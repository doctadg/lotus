import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Keyboard
} from 'react-native'
import { useAuth } from '../src/hooks/useAuth'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import AgentStatus from '../src/components/AgentStatus'
import { Feather } from '@expo/vector-icons'
import { theme } from '../src/constants/theme'
import { LotusIcon, LotusFullLogo } from '../src/components/Logo'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: Date
}

export default function HomeScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'simple' | 'deep'>('simple')
  const [thinkingSteps, setThinkingSteps] = useState<any[]>([])
  const [searchSteps, setSearchSteps] = useState<any[]>([])
  const [currentTools, setCurrentTools] = useState<any[]>([])
  const [agentComplete, setAgentComplete] = useState(false)
  const messagesEndRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)
  const slideAnim = useRef(new Animated.Value(-300)).current
  const keyboardAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [sidebarOpen])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardAnim, {
          toValue: -e.endCoordinates.height - (Platform.OS === 'ios' ? 40 : 30),
          duration: 250,
          useNativeDriver: true,
        }).start()
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()
      }
    )

    return () => {
      keyboardDidHideListener.remove()
      keyboardDidShowListener.remove()
    }
  }, [])

  const loadChats = async () => {
    try {
      const response = await apiService.getChats()
      setChatSessions(response.map((chat: any) => ({
        id: chat.id,
        title: chat.title || 'New Chat',
        messages: [],
        updatedAt: new Date(chat.updatedAt)
      })))
    } catch (error) {
      console.error('Error loading chats:', error)
    }
  }

  const newChat = () => {
    setCurrentChatId(null)
    setMessages([])
    setSidebarOpen(false)
  }

  const loadChatMessages = async (chatId: string) => {
    try {
      const messages = await apiService.getMessages(chatId)
      setMessages(messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp)
      })))
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
  }

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId)
    setSidebarOpen(false)
    await loadChatMessages(chatId)
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const messageText = inputText.trim()
    setInputText('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      let chatId = currentChatId

      // Create new chat if needed
      if (!chatId) {
        const newChatResponse = await apiService.createChat({
          title: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
        })
        chatId = newChatResponse.id
        setCurrentChatId(chatId)
        await loadChats() // Refresh chat list
      }

      // Reset agent state for new message
      setThinkingSteps([])
      setSearchSteps([])
      setCurrentTools([])
      setAgentComplete(false)

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        role: 'user',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])

      // Stream AI response - don't create assistant message until content arrives
      let assistantMessageContent = ''
      let assistantMessage: Message | null = null

      const streamGenerator = apiService.sendMessageStream(chatId, {
        content: messageText,
        deepResearchMode: searchMode === 'deep'
      })

      for await (const event of streamGenerator) {
        // Handle thinking events
        if (event.type === 'thinking_stream' || event.type === 'memory_access' || 
            event.type === 'context_analysis' || event.type === 'response_planning') {
          const thinkingStep = {
            id: `${event.type}-${Date.now()}-${Math.random()}`,
            type: event.type,
            content: event.data.content,
            timestamp: Date.now()
          }
          setThinkingSteps(prev => [...prev, thinkingStep])
        } 
        // Handle search events
        else if (event.type === 'search_planning') {
          const searchStep = {
            id: `search-plan-${Date.now()}`,
            type: 'planning',
            tool: event.data.metadata?.tool || 'web_search',
            content: event.data.content,
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if (event.type === 'search_start') {
          const searchStep = {
            id: `search-start-${Date.now()}`,
            type: 'start',
            tool: event.data.metadata?.tool || 'web_search',
            content: event.data.content,
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if (event.type === 'search_progress') {
          const searchStep = {
            id: `search-progress-${Date.now()}`,
            type: 'progress',
            tool: event.data.metadata?.tool || 'web_search',
            content: event.data.content,
            progress: event.data.metadata?.progress,
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if (event.type === 'search_result_analysis' || event.type === 'context_synthesis') {
          const analysisStep = {
            id: `${event.type}-${Date.now()}`,
            type: event.type,
            content: event.data.content,
            timestamp: Date.now()
          }
          setThinkingSteps(prev => [...prev, analysisStep])
        }
        // Handle tool events
        else if (event.type === 'tool_call') {
          setCurrentTools(prev => [
            ...prev.map(t => ({ ...t, status: 'complete' })),
            {
              tool: event.data.tool,
              status: 'executing',
              query: event.data.metadata?.query
            }
          ])
        }
        else if (event.type === 'tool_result') {
          setCurrentTools(prev => 
            prev.map(t => 
              t.tool === event.data.metadata?.tool
                ? { ...t, status: 'complete', resultSize: event.data.metadata?.result_size }
                : t
            )
          )
        }
        // Handle content streaming
        else if (event.type === 'ai_chunk') {
          // Clear all agent activities when AI starts responding
          setThinkingSteps([])
          setSearchSteps([])
          setCurrentTools([])
          setAgentComplete(true)
          
          // Create assistant message on first chunk
          if (!assistantMessage) {
            assistantMessage = {
              id: (Date.now() + 1).toString(),
              content: '',
              role: 'assistant',
              timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage!])
          }
          
          assistantMessageContent += event.data.content || ''
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage!.id 
                ? { ...msg, content: assistantMessageContent }
                : msg
            )
          )
        } else if (event.type === 'ai_message_complete') {
          assistantMessageContent = event.data.content
          if (assistantMessage) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessage!.id 
                  ? { ...msg, content: assistantMessageContent }
                  : msg
              )
            )
          }
        } else if (event.type === 'error') {
          setAgentComplete(true)
          throw new Error(event.data.message)
        } else if (event.type === 'complete') {
          setAgentComplete(true)
          break
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message. Please try again.')
      setAgentComplete(true)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  return (
    <AuthGuard>
      <View style={styles.container}>
        {/* Sidebar Modal */}
        <Modal
          visible={sidebarOpen}
          animationType="none"
          transparent={true}
          onRequestClose={() => setSidebarOpen(false)}
        >
          <TouchableOpacity 
            style={styles.sidebarOverlay}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.sidebar,
                  {
                    transform: [{ translateX: slideAnim }]
                  }
                ]}
              >
              {/* Header with Logo */}
              <View style={styles.sidebarHeader}>
                <LotusFullLogo width={120} height={30} color={theme.colors.text} />
                <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                  <Feather name="x" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              {/* User Profile */}
              <View style={styles.userProfile}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user?.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                  <Feather name="log-out" size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              {/* New Chat Button */}
              <TouchableOpacity style={styles.newChatButton} onPress={newChat}>
                <Feather name="plus" size={16} color={theme.colors.text} />
                <Text style={styles.newChatText}>New Chat</Text>
              </TouchableOpacity>

              {/* Chat Sessions */}
              <ScrollView style={styles.chatsList}>
                {chatSessions.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={[
                      styles.chatItem,
                      currentChatId === chat.id && styles.chatItemActive
                    ]}
                    onPress={() => selectChat(chat.id)}
                  >
                    <Feather name="message-circle" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.chatItemText}>{chat.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)}>
            <Feather name="menu" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
            <LotusIcon size={24} color={theme.colors.text} />
            <Text style={styles.headerTitle}>Lotus</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>How can I help you today?</Text>
              <Text style={styles.emptySubtitle}>Ask me anything or choose from the suggestions below</Text>
            </View>
          ) : (
            <FlatList
              ref={messagesEndRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View>
                  <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
                    <Text style={styles.messageText}>{item.content}</Text>
                  </View>
                  
                  {/* Show agent status after the last message and only if there's agent activity */}
                  {index === messages.length - 1 && 
                   (thinkingSteps.length > 0 || searchSteps.length > 0 || currentTools.length > 0) && (
                    <AgentStatus 
                      thinkingSteps={thinkingSteps}
                      searchSteps={searchSteps}
                      tools={currentTools}
                      isActive={!agentComplete}
                    />
                  )}
                </View>
              )}
              onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        {/* Input Area */}
        <Animated.View style={[
          styles.inputArea,
          {
            transform: [{ translateY: keyboardAnim }]
          }
        ]}>
            {/* Search Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, searchMode === 'simple' && styles.modeButtonActive]}
              onPress={() => setSearchMode('simple')}
            >
              <Feather name="search" size={12} color={searchMode === 'simple' ? theme.colors.text : theme.colors.textSecondary} />
              <Text style={[styles.modeButtonText, searchMode === 'simple' && styles.modeButtonTextActive]}>Quick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, searchMode === 'deep' && styles.modeButtonActive]}
              onPress={() => setSearchMode('deep')}
            >
              <Feather name="zap" size={12} color={searchMode === 'deep' ? theme.colors.text : theme.colors.textSecondary} />
              <Text style={[styles.modeButtonText, searchMode === 'deep' && styles.modeButtonTextActive]}>Deep</Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message Lotus..."
              placeholderTextColor="#ffffff60"
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <Feather name="send" size={16} color={theme.colors.text} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    flexDirection: 'row'
  },
  sidebar: {
    width: 300,
    height: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.lg,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing['3xl']
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md
  },
  userAvatarText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.sm
  },
  userInfo: {
    flex: 1
  },
  userName: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium
  },
  userEmail: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular
  },
  logoutButton: {
    padding: theme.spacing.sm
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg
  },
  newChatText: {
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily.medium
  },
  chatsList: {
    flex: 1
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm
  },
  chatItemActive: {
    backgroundColor: theme.colors.surface
  },
  chatItemText: {
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: theme.spacing['4xl']
  },
  headerLogoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: theme.typography.letterSpacing.tight
  },
  headerSpacer: {
    width: 24
  },
  messagesContainer: {
    flex: 1,
    padding: theme.spacing.lg
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center'
  },
  messageContainer: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface
  },
  messageText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular
  },
  inputArea: {
    padding: theme.spacing.lg,
    borderTopWidth: 0,
    backgroundColor: theme.colors.background
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.md,
    alignSelf: 'center'
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary
  },
  modeButtonText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium
  },
  modeButtonTextActive: {
    color: theme.colors.text
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    marginRight: theme.spacing.md,
    maxHeight: 80
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceHover
  }
})
