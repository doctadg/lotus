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
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Keyboard,
  Image
} from 'react-native'
import { useAuth } from '../src/contexts/AuthContext'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import AgentStatus from '../src/components/AgentStatus'
import { Feather } from '@expo/vector-icons'
import { theme } from '../src/constants/theme'
import { LotusIcon, LotusFullLogo } from '../src/components/Logo'
import Markdown from '../src/components/Markdown'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useAuth as useClerkAuth } from '@clerk/clerk-expo'
import { canUseDeepResearch, isProUser } from '../src/lib/billing'
import SwipeableSidebar from '../src/components/SwipeableSidebar'
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler'

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
  const { user, logout, isAuthenticated, isLoading: isAuthLoading, isReady, hasRevenueCatPro } = useAuth()
  const { has } = useClerkAuth()
  const router = useRouter()
  // Check both RevenueCat (mobile IAP) and Clerk (web billing)
  const isPro = hasRevenueCatPro || isProUser(has)
  const hasDeepResearch = hasRevenueCatPro || canUseDeepResearch(has)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  // Quick mode by default; a separate Deep button triggers deep for a single send
  const [thinkingSteps, setThinkingSteps] = useState<any[]>([])
  const [searchSteps, setSearchSteps] = useState<any[]>([])
  const [currentTools, setCurrentTools] = useState<any[]>([])
  const [agentComplete, setAgentComplete] = useState(false)
  const [deepMode, setDeepMode] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ url: string; contentType: string; name: string; kind: 'image' | 'document' }>>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)
  const slideAnim = useRef(new Animated.Value(-300)).current
  const keyboardAnim = useRef(new Animated.Value(0)).current
  const panGestureRef = useRef(null)

  // Edge detection constants
  const EDGE_DETECTION_WIDTH = 80 // 80px from left edge

  // Load chats only after auth AND token provider are ready and user is signed in
  useEffect(() => {
    if (isReady && isAuthenticated) {
      loadChats()
    }
  }, [isReady, isAuthenticated])

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
      if (__DEV__) {
        console.log('Chats response:', response)
      }
      // Handle various response formats: array, {data: []}, or {chats: []}
      const chats = Array.isArray(response)
        ? response
        : (response?.chats || response?.data || [])

      if (__DEV__) {
        console.log('Parsed chats:', chats)
      }

      setChatSessions(chats.map((chat: any) => ({
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
      // Ensure messages is an array before mapping
      if (Array.isArray(messages)) {
        setMessages(messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp)
        })))
      } else {
        console.error('Messages response is not an array:', messages)
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
      setMessages([])
      Alert.alert('Error', 'Failed to load chat messages. Please try again.')
    }
  }

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId)
    setSidebarOpen(false)
    await loadChatMessages(chatId)
  }

  const sendMessage = async (opts?: { deep?: boolean }) => {
    if (!inputText.trim() || isLoading) return

    // Build message text with attachments if present
    const messageTextRaw = inputText.trim()
    let messageText = messageTextRaw
    if (attachments.length > 0) {
      const blocks: string[] = []
      for (const att of attachments) {
        if (att.kind === 'image') blocks.push(`![${att.name}](${att.url})`)
      }
      const docs = attachments.filter(a => a.kind === 'document')
      if (docs.length > 0) {
        blocks.push('Attachments:')
        for (const d of docs) {
          const safeName = d.name.replace(/\]|\[/g, '')
          blocks.push(`[${safeName}](${d.url})`)
        }
      }
      messageText = [blocks.join('\n\n'), messageTextRaw].filter(Boolean).join('\n\n')
    }
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

      // Create assistant placeholder immediately so activity can display before chunks
      let assistantMessageContent = ''
      let assistantMessage: Message | null = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage!])

      const streamGenerator = apiService.sendMessageStream(chatId, {
        content: messageText,
        deepResearchMode: opts?.deep ?? deepMode
      })

      for await (const event of streamGenerator) {
        // Handle thinking events
        if ((event as any)?.type === 'thinking_stream' || (event as any)?.type === 'memory_access' || 
            (event as any)?.type === 'context_analysis' || (event as any)?.type === 'response_planning') {
          const thinkingStep = {
            id: `${event.type}-${Date.now()}-${Math.random()}`,
            type: event.type,
            content: (event as any)?.data?.content ?? (event as any)?.content ?? '',
            timestamp: Date.now()
          }
          setThinkingSteps(prev => [...prev, thinkingStep])
        } 
        // Handle search events
        else if ((event as any)?.type === 'search_planning') {
          const searchStep = {
            id: `search-plan-${Date.now()}`,
            type: 'planning',
            tool: (event as any)?.data?.metadata?.tool || (event as any)?.tool || 'web_search',
            content: (event as any)?.data?.content ?? (event as any)?.content ?? '',
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if ((event as any)?.type === 'search_start') {
          const searchStep = {
            id: `search-start-${Date.now()}`,
            type: 'start',
            tool: (event as any)?.data?.metadata?.tool || (event as any)?.tool || 'web_search',
            content: (event as any)?.data?.content ?? (event as any)?.content ?? '',
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if ((event as any)?.type === 'search_progress') {
          const searchStep = {
            id: `search-progress-${Date.now()}`,
            type: 'progress',
            tool: (event as any)?.data?.metadata?.tool || (event as any)?.tool || 'web_search',
            content: (event as any)?.data?.content ?? (event as any)?.content ?? '',
            progress: (event as any)?.data?.metadata?.progress,
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if (event.type === 'search_complete') {
          const searchStep = {
            id: `search-complete-${Date.now()}`,
            type: 'complete' as const,
            tool: event.data?.metadata?.tool || 'web_search',
            content: event.data?.content || 'Search complete',
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if ((event as any)?.type === 'search_result_analysis' || (event as any)?.type === 'context_synthesis') {
          const analysisStep = {
            id: `${event.type}-${Date.now()}`,
            type: event.type,
            content: (event as any)?.data?.content ?? (event as any)?.content ?? '',
            timestamp: Date.now()
          }
          setThinkingSteps(prev => [...prev, analysisStep])
        }
        else if ((event as any)?.type === 'search_detailed') {
          const phase = (event as any)?.data?.metadata?.phase
          const mappedType = phase === 'search_start' ? 'start' : phase === 'results_found' ? 'progress' : phase === 'search_complete' ? 'complete' : 'progress'
          const searchStep = {
            id: `search-detailed-${Date.now()}`,
            type: mappedType as any,
            tool: 'web_search',
            content: (event as any)?.data?.content ?? (event as any)?.content ?? 'Searching...',
            progress: (event as any)?.data?.metadata?.progress,
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if ((event as any)?.type === 'website_scraping') {
          const phase = (event as any)?.data?.metadata?.phase
          const searchStep = {
            id: `website-scraping-${Date.now()}`,
            type: 'progress' as const,
            tool: 'web_search',
            content: (event as any)?.data?.content ?? (event as any)?.content ?? 'Scraping website',
            progress: (event as any)?.data?.metadata?.progress,
            timestamp: Date.now()
          }
          setSearchSteps(prev => [...prev, searchStep])
        }
        else if ((event as any)?.type === 'agent_thought') {
          const thinkingStep = {
            id: `agent-thought-${Date.now()}`,
            type: 'thinking_stream' as const,
            content: (event as any)?.data?.content ?? (event as any)?.content ?? '',
            timestamp: Date.now()
          }
          setThinkingSteps(prev => [...prev, thinkingStep])
        }
        // Handle tool events
        else if ((event as any)?.type === 'tool_call') {
          setCurrentTools(prev => [
            ...prev.map(t => ({ ...t, status: 'complete' })),
            {
              tool: (event as any)?.data?.tool || (event as any)?.tool || 'tool',
              status: 'executing',
              query: (event as any)?.data?.metadata?.query
            }
          ])
        }
        else if ((event as any)?.type === 'tool_result') {
          setCurrentTools(prev => 
            prev.map(t => 
              t.tool === ((event as any)?.data?.metadata?.tool || (event as any)?.tool)
                ? { ...t, status: 'complete', resultSize: (event as any)?.data?.metadata?.result_size }
                : t
            )
          )
        }
        // Handle content streaming
        else if (event.type === 'ai_chunk' || event.type === 'content') {
          // Keep activity visible during streaming; don't mark complete yet
          setAgentComplete(false)
          
          const chunk = (event as any)?.data?.content ?? (event as any)?.content ?? ''
          assistantMessageContent += chunk
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage!.id 
                ? { ...msg, content: assistantMessageContent }
                : msg
            )
          )
        } else if (event.type === 'ai_message_complete' || event.type === 'complete') {
          assistantMessageContent = (event as any)?.data?.content ?? assistantMessageContent
          setAgentComplete(true)
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
          const msg = (event as any)?.data?.message || (event as any)?.data?.content || (event as any)?.content || 'Stream error'
          throw new Error(msg)
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
      setAttachments([])
    }
  }

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (perm.status !== 'granted') return
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 })
      if (result.canceled || result.assets?.length === 0) return
      const asset = result.assets[0]
      if (!asset.uri) return
      setUploading(true)
      const info = await apiService.uploadFile({ uri: asset.uri, name: asset.fileName || 'image.jpg', type: asset.mimeType || 'image/jpeg' })
      setAttachments(prev => [...prev, { ...info, kind: 'image' }])
    } catch (e) {
      console.error('Image pick/upload error', e)
    } finally {
      setUploading(false)
    }
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (result.canceled || !result.assets || result.assets.length === 0) return
      const file = result.assets[0]
      if (!file.uri) return
      setUploading(true)
      const info = await apiService.uploadFile({ uri: file.uri, name: file.name || 'document', type: file.mimeType || 'application/octet-stream' })
      const kind: 'image' | 'document' = (info.contentType || '').startsWith('image/') ? 'image' : 'document'
      setAttachments(prev => [...prev, { ...info, kind }])
    } catch (e) {
      console.error('Document pick/upload error', e)
    } finally {
      setUploading(false)
    }
  }

  // Gesture handler for opening sidebar from edge
  const gestureStartX = useRef(0)

  const handleGestureEvent = (event: any) => {
    // Track gesture progress
  }

  const handleGestureStateChange = (event: any) => {
    const { state, translationX, x, absoluteX } = event.nativeEvent

    if (state === State.BEGAN) {
      // Record where the gesture started
      gestureStartX.current = absoluteX
    }

    if (state === State.END) {
      // Only open if gesture started from left edge AND swiped right enough
      if (gestureStartX.current <= EDGE_DETECTION_WIDTH && translationX > 60) {
        setSidebarOpen(true)
      }
    }
  }

  return (
    <AuthGuard>
      <PanGestureHandler
        ref={panGestureRef}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
        activeOffsetX={10}
        failOffsetY={[-20, 20]}
        simultaneousHandlers={messagesEndRef}
        enabled={!sidebarOpen}
      >
        <Animated.View style={styles.container}>
          {/* New Swipeable Sidebar */}
          <SwipeableSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpen={() => setSidebarOpen(true)}
            user={user}
            isPro={isPro}
            chatSessions={chatSessions}
            onLoadChat={selectChat}
            onNewChat={newChat}
            onLogout={logout}
          />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)}>
            <Feather name="menu" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
            <LotusFullLogo width={80} height={28} />
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
                {item.role === 'assistant' ? (
                  <Markdown content={item.content} />
                ) : (
                  <Text style={styles.messageText}>{item.content}</Text>
                )}
              </View>
                  
                  {/* Show agent status after the last message only while agent is actively working */}
                  {index === messages.length - 1 && !agentComplete &&
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
          {/* Attachments preview stays above input; controls move inside input */}

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, gap: theme.spacing.sm }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {attachments.map((att) => (
                  <View key={att.url} style={{ marginRight: theme.spacing.sm }}>
                    {att.kind === 'image' ? (
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: att.url }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                        <TouchableOpacity style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#0008', borderRadius: 10, padding: 2 }} onPress={() => setAttachments(prev => prev.filter(a => a.url !== att.url))}>
                          <Feather name="x" size={12} color={theme.colors.text} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => setAttachments(prev => prev.filter(a => a.url !== att.url))} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{att.name}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input with inline controls: + | text | Deep | Send */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={[styles.addButton, { marginRight: theme.spacing.sm }]} onPress={pickImage} onLongPress={pickDocument} disabled={isLoading || uploading}>
              <Feather name="plus" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={uploading ? 'Uploading…' : 'Message Mror...'}
              placeholderTextColor="#ffffff60"
              multiline
              editable={!isLoading && !uploading}
            />
            <TouchableOpacity
              style={[styles.deepButton, { marginRight: theme.spacing.sm }, deepMode ? styles.deepButtonActive : null]}
              onPress={() => {
                if (!hasDeepResearch) {
                  Alert.alert(
                    'Deep Research is a Pro Feature',
                    'Upgrade to Pro to access Deep Research mode with comprehensive sources and enhanced analysis.',
                    [
                      { text: 'Maybe Later', style: 'cancel' },
                      { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
                    ]
                  )
                } else {
                  setDeepMode(v => !v)
                }
              }}
              disabled={isLoading}
            >
              <Feather name="zap" size={12} color={deepMode ? theme.colors.text : theme.colors.textSecondary} />
              <Text style={[styles.deepButtonText, deepMode ? styles.deepButtonTextActive : null]}>Deep</Text>
              {!isPro && (
                <Feather name="lock" size={10} color={theme.colors.textSecondary} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() && attachments.length === 0) || isLoading ? styles.sendButtonDisabled : null]}
              onPress={() => sendMessage()}
              disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <Feather name="send" size={16} color={theme.colors.text} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
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
  sidebarLogoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
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
    borderBottomWidth: 0,
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
  modeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm
  },
  modeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    opacity: 0.7
  },
  modeHintText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular
  },
  deepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md
  },
  deepButtonActive: {
    backgroundColor: '#5b21b6'
  },
  deepButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium
  },
  deepButtonTextActive: {
    color: '#fff'
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
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
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  proBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    color: '#fff',
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
  },
})
