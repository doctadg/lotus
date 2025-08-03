import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChatMessage } from '../components/ChatMessage'
import { TypingIndicator } from '../components/TypingIndicator'
import { apiService } from '../services/api'
import { Message, Chat } from '../types'

interface ChatScreenProps {
  chatId: string | null
  onMenuPress: () => void
  onChatCreated?: (chatId: string) => void
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, onMenuPress, onChatCreated }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [chat, setChat] = useState<Chat | null>(null)
  const [deepResearchMode, setDeepResearchMode] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const streamingContentRef = useRef('')
  const lastUpdateTimeRef = useRef(0)
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null)
  
  const inputHeight = useSharedValue(50)

  useEffect(() => {
    if (chatId) {
      loadChat()
      loadMessages()
    } else {
      setMessages([])
      setChat(null)
    }
  }, [chatId])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
      }
    }
  }, [])

  const loadChat = async () => {
    if (!chatId) return
    try {
      const chatData = await apiService.getChat(chatId)
      setChat(chatData)
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const loadMessages = async () => {
    if (!chatId) return
    setIsLoading(true)
    try {
      const messagesData = await apiService.getMessages(chatId)
      setMessages(messagesData)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return

    const messageText = inputText.trim()
    setInputText('')
    setIsSending(true)

    try {
      // Create a new chat if none exists
      let currentChatId = chatId
      if (!currentChatId) {
        const newChat = await apiService.createChat({
          title: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '')
        })
        currentChatId = newChat.id
        setChat(newChat)
        // Notify parent component about the new chat
        if (onChatCreated) {
          onChatCreated(currentChatId)
        }
      }

      // Add user message immediately to UI
      const userMessage: Message = {
        id: 'temp-user-' + Date.now(),
        chatId: currentChatId,
        role: 'user',
        content: messageText,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMessage])

      let currentAIMessage: Message | null = null
      let streamingContent = ''

      for await (const event of apiService.sendMessageStream(currentChatId, {
        content: messageText,
        deepResearchMode
      })) {
        switch (event.type) {
          case 'user_message':
            // Replace temporary user message with real one from backend
            setMessages(prev => prev.map(msg => 
              msg.id === userMessage.id 
                ? event.data 
                : msg
            ))
            break

          case 'ai_typing':
            setIsTyping(event.data.typing)
            if (event.data.typing && !currentAIMessage) {
              // Create a temporary message for streaming with unique ID
              currentAIMessage = {
                id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                chatId: currentChatId,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString()
              }
              setMessages(prev => [...prev, currentAIMessage!])
            }
            break

          case 'ai_chunk':
            if (currentAIMessage) {
              // Accumulate chunks in ref for better performance
              streamingContent += event.data.content
              streamingContentRef.current = streamingContent
              
              // Debounce updates to reduce lag (update max every 100ms)
              const now = Date.now()
              if (now - lastUpdateTimeRef.current > 100) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === currentAIMessage!.id 
                      ? { ...msg, content: streamingContentRef.current }
                      : msg
                  )
                )
                lastUpdateTimeRef.current = now
              } else {
                // Clear any pending update and schedule a new one
                if (pendingUpdateRef.current) {
                  clearTimeout(pendingUpdateRef.current)
                }
                pendingUpdateRef.current = setTimeout(() => {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === currentAIMessage!.id 
                        ? { ...msg, content: streamingContentRef.current }
                        : msg
                    )
                  )
                  lastUpdateTimeRef.current = Date.now()
                }, 100)
              }
            }
            break

          case 'ai_message_complete':
            if (currentAIMessage) {
              // Clear any pending updates
              if (pendingUpdateRef.current) {
                clearTimeout(pendingUpdateRef.current)
                pendingUpdateRef.current = null
              }
              // Replace temporary message with final message
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === currentAIMessage!.id 
                    ? event.data
                    : msg
                )
              )
              streamingContentRef.current = ''
            }
            break

          case 'complete':
            // Clear any pending updates
            if (pendingUpdateRef.current) {
              clearTimeout(pendingUpdateRef.current)
              pendingUpdateRef.current = null
            }
            setIsSending(false)
            setIsTyping(false)
            streamingContentRef.current = ''
            break

          case 'error':
            console.error('Streaming error:', event.data)
            Alert.alert('Error', event.data.message || 'An error occurred')
            setInputText(messageText)
            setIsSending(false)
            setIsTyping(false)
            // Clean up temporary message and pending updates
            if (pendingUpdateRef.current) {
              clearTimeout(pendingUpdateRef.current)
              pendingUpdateRef.current = null
            }
            if (currentAIMessage) {
              setMessages(prev => prev.filter(msg => msg.id !== currentAIMessage!.id))
            }
            streamingContentRef.current = ''
            break
        }
        
        // Throttled auto-scroll during streaming (less frequent for better performance)
        if (event.type === 'ai_chunk' && Date.now() - lastUpdateTimeRef.current > 200) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false }) // Non-animated for better performance
          }, 50)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Clean up any pending updates
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
        pendingUpdateRef.current = null
      }
      streamingContentRef.current = ''
      // Only show alert if we haven't already shown one from the streaming events
      if (!error.message?.includes('HTTP error')) {
        Alert.alert('Error', 'Failed to send message')
      }
      setInputText(messageText)
      setIsSending(false)
      setIsTyping(false)
    }
  }

  const animatedInputStyle = useAnimatedStyle(() => ({
    height: inputHeight.value
  }))

  // Memoize message rendering for better performance
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => (
    <ChatMessage message={item} index={index} />
  ), [])
  
  // Memoize key extractor
  const keyExtractor = useCallback((item: Message, index: number) => 
    `${item.id || 'msg'}-${index}-${item.role}`, [])

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <Text style={styles.emptyTitle}>ChatGPT</Text>
        <Text style={styles.emptySubtitle}>How can I help you today?</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {chat?.title || 'New Chat'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        {messages.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            getItemLayout={undefined}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10a37f" />
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          {/* Deep Research Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.deepResearchButton,
                deepResearchMode && styles.deepResearchButtonActive
              ]}
              onPress={() => setDeepResearchMode(!deepResearchMode)}
            >
              <Text style={[
                styles.deepResearchIcon,
                deepResearchMode && styles.deepResearchIconActive
              ]}>
                🔬
              </Text>
              <Text style={[
                styles.deepResearchText,
                deepResearchMode && styles.deepResearchTextActive
              ]}>
                Deep Research
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={deepResearchMode ? "Ask for comprehensive research..." : "Message ChatGPT..."}
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={1000}
                editable={!isSending}
                onContentSizeChange={(event) => {
                  const height = Math.min(Math.max(50, event.nativeEvent.contentSize.height + 20), 120)
                  inputHeight.value = withTiming(height, { duration: 200 })
                }}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  deepResearchMode && styles.sendButtonResearch,
                  (!inputText.trim() || isSending) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.sendIcon}>→</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  menuButton: {
    padding: 8,
    marginRight: 12
  },
  menuIcon: {
    width: 18,
    height: 14,
    justifyContent: 'space-between'
  },
  menuLine: {
    height: 2,
    backgroundColor: '#374151',
    borderRadius: 1
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center'
  },
  headerSpacer: {
    width: 42
  },
  content: {
    flex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyContent: {
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center'
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    paddingBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8
  },
  toggleContainer: {
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  deepResearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  deepResearchButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6'
  },
  deepResearchIcon: {
    fontSize: 14,
    marginRight: 6
  },
  deepResearchIconActive: {
    fontSize: 14
  },
  deepResearchText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500'
  },
  deepResearchTextActive: {
    color: '#1d4ed8',
    fontWeight: '600'
  },
  inputContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    maxHeight: 100,
    marginRight: 12
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10a37f',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonResearch: {
    backgroundColor: '#3b82f6'
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db'
  },
  sendIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
})