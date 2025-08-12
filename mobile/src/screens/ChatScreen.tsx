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
import { EnhancedChatMessage } from '../components/EnhancedChatMessage'
import { TypingIndicator } from '../components/TypingIndicator'
import { AgentReasoningCard, AgentStep } from '../components/AgentReasoningCard'
import { ToolUseBadge, ToolType, ToolStatus, ToolPhase } from '../components/ToolUseBadge'
import { AgentStatusMessage } from '../components/AgentStatusMessage'
import { SearchProgressCard } from '../components/SearchProgressCard'
import { ThinkingStreamComponent } from '../components/ThinkingStreamComponent'
import { apiService } from '../services/api'
import { Message, Chat } from '../types'
import { Microscope } from 'lucide-react-native'

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
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [currentTools, setCurrentTools] = useState<Array<{ tool: ToolType; status: ToolStatus; phase?: ToolPhase; progress?: number; url?: string; quality?: string; resultSize?: number; duration?: number }>>([])
  const [thinkingSteps, setThinkingSteps] = useState<Array<{ id: string; type: 'thinking_stream' | 'memory_access' | 'context_analysis' | 'search_planning' | 'search_result_analysis' | 'context_synthesis' | 'response_planning'; content: string; phase?: string; timestamp: number; metadata?: any }>>([])
  const [searchSteps, setSearchSteps] = useState<Array<{ id: string; type: 'planning' | 'start' | 'progress' | 'analysis' | 'complete'; tool: string; content: string; url?: string; progress?: number; quality?: string; timestamp: number; metadata?: any }>>([])
  const [showReasoningCard, setShowReasoningCard] = useState(false)
  const [reasoningCardExpanded, setReasoningCardExpanded] = useState(false)
  const [showThinkingStream, setShowThinkingStream] = useState(true)
  const [showSearchProgress, setShowSearchProgress] = useState(false)
  const [agentStartTime, setAgentStartTime] = useState(0)
  const [agentComplete, setAgentComplete] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const streamingContentRef = useRef('')
  const lastUpdateTimeRef = useRef(0)
  const pendingUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thinkingBatchRef = useRef<Array<any>>([])
  const thinkingBatchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchBatchRef = useRef<Array<any>>([])
  const searchBatchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const inputHeight = useSharedValue(45)

  useEffect(() => {
    if (chatId) {
      loadChat()
      loadMessages()
    } else {
      setMessages([])
      setChat(null)
    }
  }, [chatId])

  // Cleanup effect with enhanced cleanup
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current)
      }
      if (thinkingBatchTimeout.current) {
        clearTimeout(thinkingBatchTimeout.current)
      }
      if (searchBatchTimeout.current) {
        clearTimeout(searchBatchTimeout.current)
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

      // Reset agent state for new message
      setAgentSteps([])
      setCurrentTools([])
      setThinkingSteps([])
      setSearchSteps([])
      setShowReasoningCard(false)
      setReasoningCardExpanded(false)
      setShowThinkingStream(true)
      setShowSearchProgress(false)
      setAgentStartTime(Date.now())
      setAgentComplete(false)

      let currentAIMessage: Message | null = null
      let streamingContent = ''
      let localAgentSteps: AgentStep[] = []

      console.log('🚀 [CHAT] Starting message stream for:', messageText)
      let streamEventCount = 0
      
      for await (const event of apiService.sendMessageStream(currentChatId, {
        content: messageText,
        deepResearchMode
      })) {
        streamEventCount++
        console.log(`🔥 [CHAT] Event #${streamEventCount}:`, {
          type: event.type,
          hasData: !!event.data,
          dataKeys: event.data ? Object.keys(event.data) : [],
          content: event.data?.content ? event.data.content.substring(0, 50) + '...' : undefined
        })
        switch (event.type) {
          case 'user_message':
            // Replace temporary user message with real one from backend
            setMessages(prev => prev.map(msg => 
              msg.id === userMessage.id 
                ? event.data 
                : msg
            ))
            break
            
          case 'thinking_stream':
            console.log('💭 [CHAT] Thinking stream event:', {
              content: event.data?.content,
              phase: event.data?.metadata?.phase,
              metadata: event.data?.metadata
            })
            
            // Batch thinking steps for better performance
            const thinkingStep = {
              id: `thinking-${Date.now()}-${Math.random()}`,
              type: event.type,
              content: event.data.content,
              phase: event.data.metadata?.phase,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            
            thinkingBatchRef.current.push(thinkingStep)
            console.log('💭 [CHAT] Added to batch, current batch size:', thinkingBatchRef.current.length)
            
            // Clear existing timeout
            if (thinkingBatchTimeout.current) {
              clearTimeout(thinkingBatchTimeout.current)
            }
            
            // Set new timeout to batch updates
            thinkingBatchTimeout.current = setTimeout(() => {
              if (thinkingBatchRef.current.length > 0) {
                console.log('💭 [CHAT] Flushing batch of', thinkingBatchRef.current.length, 'thinking steps')
                setThinkingSteps(prev => {
                  const newSteps = [...prev, ...thinkingBatchRef.current]
                  console.log('💭 [CHAT] Total thinking steps now:', newSteps.length)
                  return newSteps
                })
                thinkingBatchRef.current = []
              }
            }, 50) // 50ms batching for thinking steps
            break
            
          case 'memory_access':
          case 'context_analysis':
          case 'search_result_analysis':
          case 'context_synthesis':
          case 'response_planning':
            // Add enhanced thinking steps
            const enhancedThinkingStep = {
              id: `${event.type}-${Date.now()}-${Math.random()}`,
              type: event.type,
              content: event.data.content,
              phase: event.data.metadata?.phase,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            setThinkingSteps(prev => [...prev, enhancedThinkingStep])
            break
            
          case 'search_planning':
            // Start search progress tracking with batching
            const planningStep = {
              id: `search-planning-${Date.now()}`,
              type: 'planning',
              tool: event.data.metadata?.tool || 'web_search',
              content: event.data.content,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            searchBatchRef.current.push(planningStep)
            setShowSearchProgress(true)
            
            // Immediate update for search start
            setSearchSteps(prev => [...prev, planningStep])
            break
            
          case 'search_start':
            // Add search start step
            const startStep = {
              id: `search-start-${Date.now()}`,
              type: 'start',
              tool: event.data.metadata?.tool || 'web_search',
              content: event.data.content,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            searchBatchRef.current.push(startStep)
            
            // Immediate update for visibility
            setSearchSteps(prev => [...prev, startStep])
            break
            
          case 'search_progress':
            // Batch search progress updates
            const progressStep = {
              id: `search-progress-${Date.now()}`,
              type: 'progress',
              tool: event.data.metadata?.tool || 'web_search',
              content: event.data.content,
              progress: event.data.metadata?.progress,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            
            searchBatchRef.current.push(progressStep)
            
            // Clear existing timeout
            if (searchBatchTimeout.current) {
              clearTimeout(searchBatchTimeout.current)
            }
            
            // Set timeout for batch update
            searchBatchTimeout.current = setTimeout(() => {
              if (searchBatchRef.current.length > 0) {
                setSearchSteps(prev => [...prev, ...searchBatchRef.current])
                searchBatchRef.current = []
              }
            }, 100) // 100ms batching for search progress
            break

          case 'agent_thought':
            // Add agent reasoning step
            const thoughtStep: AgentStep = {
              type: 'thought',
              content: event.data.content,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            localAgentSteps.push(thoughtStep)
            setAgentSteps([...localAgentSteps])
            setShowReasoningCard(true)
            break

          case 'tool_call':
            // Add tool call step and enhanced badge
            const toolStep: AgentStep = {
              type: 'tool_call',
              content: event.data.metadata?.description || 'Using tool',
              tool: event.data.tool,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            localAgentSteps.push(toolStep)
            setAgentSteps([...localAgentSteps])
            
            // Update enhanced tool badges
            setCurrentTools(prev => [
              ...prev.map(t => ({ 
                ...t, 
                status: t.status !== 'complete' ? 'complete' as ToolStatus : t.status,
                duration: t.status === 'active' ? Date.now() - agentStartTime : t.duration
              })),
              { 
                tool: event.data.tool as ToolType, 
                status: event.data.metadata?.status || 'active' as ToolStatus,
                phase: event.data.metadata?.phase as ToolPhase,
                progress: event.data.metadata?.progress,
                url: event.data.metadata?.url,
                quality: event.data.metadata?.quality
              }
            ])
            break

          case 'tool_result':
            // Add tool result step
            const resultStep: AgentStep = {
              type: 'tool_result',
              content: event.data.content,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            localAgentSteps.push(resultStep)
            setAgentSteps([...localAgentSteps])
            
            // Update tool status to complete with enhanced data
            setCurrentTools(prev => 
              prev.map(t => 
                t.tool === event.data.metadata?.tool 
                  ? { 
                      ...t, 
                      status: 'complete' as ToolStatus,
                      quality: event.data.metadata?.quality || t.quality,
                      resultSize: event.data.metadata?.result_size,
                      duration: Date.now() - agentStartTime
                    }
                  : t
              )
            )
            
            // Add search completion step
            if (event.data.metadata?.tool) {
              const completeStep = {
                id: `search-complete-${Date.now()}`,
                type: 'complete',
                tool: event.data.metadata.tool,
                content: 'Search completed successfully',
                quality: event.data.metadata.quality,
                timestamp: Date.now(),
                metadata: event.data.metadata
              }
              setSearchSteps(prev => [...prev, completeStep])
            }
            break

          case 'agent_processing':
            // Add processing step
            const processingStep: AgentStep = {
              type: 'processing',
              content: event.data.content,
              timestamp: Date.now(),
              metadata: event.data.metadata
            }
            localAgentSteps.push(processingStep)
            setAgentSteps([...localAgentSteps])
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
            // Ensure AI message exists before streaming content
            if (!currentAIMessage) {
              currentAIMessage = {
                id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                chatId: currentChatId,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString()
              }
              setMessages(prev => [...prev, currentAIMessage!])
            }
            
            if (currentAIMessage) {
              // Accumulate chunks in ref for better performance
              streamingContent += event.data.content
              streamingContentRef.current = streamingContent
              
              // Optimized debounce updates with different intervals based on content length
              const now = Date.now()
              const contentLength = streamingContentRef.current.length
              const debounceInterval = contentLength < 500 ? 50 : contentLength < 1500 ? 100 : 150
              
              if (now - lastUpdateTimeRef.current > debounceInterval) {
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
                }, debounceInterval)
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
            
            // Mark all tools as complete with final data
            setCurrentTools(prev => 
              prev.map(t => ({ 
                ...t, 
                status: 'complete' as ToolStatus,
                duration: t.duration || Date.now() - agentStartTime
              }))
            )
            
            // Calculate total duration
            const totalDuration = Date.now() - agentStartTime
            
            // Add final thinking step
            const finalThinkingStep = {
              id: `final-thinking-${Date.now()}`,
              type: 'thinking_stream',
              content: 'Response generation complete',
              phase: 'completion',
              timestamp: Date.now(),
              metadata: { duration: totalDuration, completion: true }
            }
            setThinkingSteps(prev => [...prev, finalThinkingStep])
            
            // Add a synthesis step if we had reasoning
            if (localAgentSteps.length > 0) {
              const synthesisStep: AgentStep = {
                type: 'synthesis',
                content: 'Response formulated',
                timestamp: Date.now(),
                metadata: { duration: totalDuration }
              }
              localAgentSteps.push(synthesisStep)
              setAgentSteps([...localAgentSteps])
            }
            
            // Mark agent as complete and schedule cleanup
            setAgentComplete(true)
            
            // Flush any remaining batched updates
            if (thinkingBatchRef.current.length > 0) {
              setThinkingSteps(prev => [...prev, ...thinkingBatchRef.current])
              thinkingBatchRef.current = []
            }
            if (searchBatchRef.current.length > 0) {
              setSearchSteps(prev => [...prev, ...searchBatchRef.current])
              searchBatchRef.current = []
            }
            
            // Hide progress components after delay
            setTimeout(() => {
              setShowSearchProgress(false)
              setShowThinkingStream(false)
            }, 3000) // Keep visible for 3 seconds after completion
            
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
            
            // Mark tools as error state
            setCurrentTools(prev => 
              prev.map(t => ({ ...t, status: 'error' as ToolStatus }))
            )
            
            // Add error thinking step
            const errorThinkingStep = {
              id: `error-thinking-${Date.now()}`,
              type: 'thinking_stream',
              content: 'An error occurred during processing',
              phase: 'error',
              timestamp: Date.now(),
              metadata: { error: true, message: event.data.message }
            }
            setThinkingSteps(prev => [...prev, errorThinkingStep])
            
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
        
        // Optimized auto-scroll with adaptive throttling
        if (event.type === 'ai_chunk' && !agentComplete) {
          const shouldScroll = Date.now() - lastUpdateTimeRef.current > 300
          if (shouldScroll) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
              flatListRef.current?.scrollToEnd({ animated: false })
            })
          }
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (!errorMessage.includes('HTTP error')) {
        Alert.alert('Error', 'Failed to send message')
      }
      setInputText(messageText)
      setIsSending(false)
      setIsTyping(false)
    }
  }

  const animatedInputStyle = useAnimatedStyle(() => ({
    minHeight: 45
  }))

  // Memoize message rendering for better performance
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    // Check if this is the current AI message being streamed
    const isCurrentAIMessage = item.role === 'assistant' && 
      index === messages.length - 1 && 
      (currentTools.length > 0 || agentSteps.length > 0 || thinkingSteps.length > 0)
    
    if (isCurrentAIMessage) {
      console.log('🎯 [CHAT] Current AI message state:', {
        thinkingSteps: thinkingSteps.length,
        searchSteps: searchSteps.length,
        agentSteps: agentSteps.length,
        currentTools: currentTools.length,
        showThinkingStream,
        showSearchProgress,
        agentComplete,
        messageIndex: index
      })
    }
    
    return (
      <>
        {/* Show enhanced agent status before the AI message if it's the current one */}
        {isCurrentAIMessage && (
          <>
            {/* Thinking Stream - shown during active processing */}
            {showThinkingStream && thinkingSteps.length > 0 && !agentComplete && (
              <>
                {console.log('🎨 [CHAT] Rendering ThinkingStreamComponent with', thinkingSteps.length, 'steps')}
                <ThinkingStreamComponent
                  steps={thinkingSteps}
                  isActive={!agentComplete}
                  maxHeight={200}
                  autoScroll={true}
                  showTimestamps={false}
                  collapsible={true}
                />
              </>
            )}
            
            {/* Search Progress - shown during search operations */}
            {showSearchProgress && searchSteps.length > 0 && (
              <SearchProgressCard
                steps={searchSteps}
                isActive={!agentComplete}
                onComplete={() => setShowSearchProgress(false)}
              />
            )}
            
            {/* Traditional Agent Status - shown for tool badges and reasoning */}
            <AgentStatusMessage
              steps={agentSteps}
              tools={currentTools}
              showReasoningCard={showReasoningCard}
              reasoningExpanded={reasoningCardExpanded}
              onToggleReasoning={() => setReasoningCardExpanded(!reasoningCardExpanded)}
              duration={Date.now() - agentStartTime}
              isComplete={agentComplete}
            />
          </>
        )}
        <EnhancedChatMessage message={item} index={index} />
      </>
    )
  }, [messages.length, currentTools.length, agentSteps.length, thinkingSteps.length, searchSteps.length, showReasoningCard, reasoningCardExpanded, showThinkingStream, showSearchProgress, agentComplete])
  
  // Optimized key extractor with stable keys
  const keyExtractor = useCallback((item: Message, index: number) => {
    // Use item.id if available, fallback to index-based key
    return item.id || `msg-${index}-${item.role}-${item.createdAt}`
  }, [])

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
            maxToRenderPerBatch={8}
            windowSize={8}
            initialNumToRender={8}
            updateCellsBatchingPeriod={50}
            getItemLayout={undefined}
            onEndReachedThreshold={0.5}
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
              <Microscope 
                size={14} 
                color={deepResearchMode ? '#1d4ed8' : '#6b7280'} 
                style={{ marginRight: 6 }}
              />
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
                multiline={true}
                numberOfLines={1}
                maxLength={1000}
                editable={!isSending}
                textAlignVertical="center"
                scrollEnabled={false}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 45
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    minHeight: 24,
    maxHeight: 80
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