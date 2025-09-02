"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from "next/link"
import { useAuth } from '../../hooks/useAuth'
import { MessageRenderer } from '../../components/chat/MessageRenderer'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { AgentActivity } from '../../components/chat/AgentActivity'
import { UpgradePrompt } from '../../components/chat/UpgradePrompt'
import Dither from '../../components/landing/Dither'
import { Search, Sparkles, Send, Menu, X, LogOut, MessageCircle, Plus, Trash2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface DynamicQuestion {
  text: string
  category: 'technical' | 'creative' | 'personal' | 'general'
  reasoning: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: Date
}

interface ThinkingStep {
  id: string
  type: 'thinking_stream' | 'memory_access' | 'context_analysis' | 'search_planning' | 
        'search_result_analysis' | 'context_synthesis' | 'response_planning'
  content: string
  phase?: string
  timestamp: number
  metadata?: any
}

interface SearchStep {
  id: string
  type: 'planning' | 'start' | 'progress' | 'analysis' | 'complete'
  tool: string
  content: string
  url?: string
  progress?: number
  quality?: string
  timestamp: number
  metadata?: any
}

interface ToolCall {
  tool: string
  status: 'executing' | 'complete' | 'error'
  query?: string
  resultSize?: number
  duration?: number
}

function ChatPageContent() {
  const { user, signOut } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Auto-hide sidebar on mobile by default
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 // md breakpoint
    }
    return true
  })
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [currentTools, setCurrentTools] = useState<ToolCall[]>([])
  const [showAIProcessing, setShowAIProcessing] = useState(false)
  const [agentComplete, setAgentComplete] = useState(false)
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [searchMode, setSearchMode] = useState<'simple' | 'deep'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('searchMode') as 'simple' | 'deep') || 'simple'
    }
    return 'simple'
  })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const thinkingBatchRef = useRef<ThinkingStep[]>([])
  const thinkingBatchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentChatId])

  useEffect(() => {
    localStorage.setItem('searchMode', searchMode)
  }, [searchMode])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = newHeight + 'px'
    }
  }, [inputText])

  const generateChatTitle = async (messages: Message[]): Promise<string> => {
    if (messages.length < 2) return 'New chat'
    
    try {
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(0, 4).map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.title || 'New chat'
      }
    } catch (error) {
      console.error('Error generating title:', error)
    }
    
    return messages[0]?.content.slice(0, 30) || 'New chat'
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    // Check if user is trying to use deep research mode without Pro plan
    if (searchMode === 'deep') {
      try {
        const response = await fetch('/api/user/subscription', {
          headers: {
            'Authorization': `Bearer ${user?.id}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const subscription = data.data.subscription
          const isProUser = subscription.planType === 'pro' && subscription.status === 'active'

          if (!isProUser) {
            // Show upgrade prompt instead of sending message
            const upgradeMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: 'Deep research mode is only available for Pro users. Please upgrade to access this feature.',
              role: 'assistant',
              timestamp: new Date()
            }
            setMessages(prev => [...prev, upgradeMessage])
            setInputText('')
            return
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
      }
    }

    const messageText = inputText.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date()
    }

    let updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputText('')
    setIsLoading(true)

    // Create a new chat if one doesn't exist
    let chatId = currentChatId
    if (!chatId) {
      try {
        const createChatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.id}`
          },
          body: JSON.stringify({
            title: messageText.slice(0, 50) + '...'
          })
        })

        if (createChatResponse.ok) {
          const chatData = await createChatResponse.json()
          chatId = chatData.data.id
          setCurrentChatId(chatId)
        } else {
          throw new Error('Failed to create chat')
        }
      } catch (error) {
        console.error('Error creating chat:', error)
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch(`/api/chat/${chatId}/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify({
          content: messageText,
          deepResearchMode: searchMode === 'deep'
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          signOut()
          return
        }
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }

      updatedMessages = [...updatedMessages, assistantMessage]
      setMessages(updatedMessages)
      
      // Reset agent state for new message
      setThinkingSteps([])
      setSearchSteps([])
      setCurrentTools([])
      setShowAIProcessing(true)
      setAgentComplete(false)
      thinkingBatchRef.current = []

      // Buffer for incomplete chunks
      let buffer = ''
      const decoder = new TextDecoder()
      let eventCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Split by newlines but keep the last potentially incomplete line
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6)
            if (data === '[DONE]') break
            
            try {
              const parsed = JSON.parse(data)
              eventCount++
              console.log(`[WEB] Event #${eventCount}:`, parsed.type, parsed.data)
              
              switch (parsed.type) {
                case 'thinking_stream':
                  console.log('[WEB] Thinking stream:', parsed.data)
                  const thinkingStep: ThinkingStep = {
                    id: `thinking-${Date.now()}-${Math.random()}`,
                    type: 'thinking_stream',
                    content: parsed.data.content,
                    phase: parsed.data.metadata?.phase,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  
                  thinkingBatchRef.current.push(thinkingStep)
                  
                  // Clear existing timeout
                  if (thinkingBatchTimeout.current) {
                    clearTimeout(thinkingBatchTimeout.current)
                  }
                  
                  // Batch updates for performance
                  thinkingBatchTimeout.current = setTimeout(() => {
                    if (thinkingBatchRef.current.length > 0) {
                      setThinkingSteps(prev => [...prev, ...thinkingBatchRef.current])
                      thinkingBatchRef.current = []
                    }
                  }, 50)
                  break
                  
                case 'memory_access':
                case 'context_analysis':
                case 'search_result_analysis':
                case 'context_synthesis':
                case 'response_planning':
                  const enhancedStep: ThinkingStep = {
                    id: `${parsed.type}-${Date.now()}`,
                    type: parsed.type,
                    content: parsed.data.content,
                    phase: parsed.data.metadata?.phase,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setThinkingSteps(prev => [...prev, enhancedStep])
                  break
                  
                case 'search_planning':
                  setShowAIProcessing(true)
                  const planStep: SearchStep = {
                    id: `search-plan-${Date.now()}`,
                    type: 'planning',
                    tool: parsed.data.metadata?.tool || 'web_search',
                    content: parsed.data.content,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setSearchSteps(prev => [...prev, planStep])
                  break
                  
                case 'search_start':
                  const startStep: SearchStep = {
                    id: `search-start-${Date.now()}`,
                    type: 'start',
                    tool: parsed.data.metadata?.tool || 'web_search',
                    content: parsed.data.content,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setSearchSteps(prev => [...prev, startStep])
                  break
                  
                case 'search_progress':
                  const progressStep: SearchStep = {
                    id: `search-progress-${Date.now()}`,
                    type: 'progress',
                    tool: parsed.data.metadata?.tool || 'web_search',
                    content: parsed.data.content,
                    progress: parsed.data.metadata?.progress,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setSearchSteps(prev => [...prev, progressStep])
                  break
                  
                case 'search_detailed':
                  console.log('[WEB] Detailed search event:', parsed.data)
                  setShowAIProcessing(true)
                  const detailedStep: SearchStep = {
                    id: `search-detailed-${Date.now()}`,
                    type: parsed.data.metadata?.phase === 'search_start' ? 'start' : 
                          parsed.data.metadata?.phase === 'results_found' ? 'progress' :
                          parsed.data.metadata?.phase === 'search_complete' ? 'complete' : 'progress',
                    tool: 'web_search',
                    content: parsed.data.content,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setSearchSteps(prev => [...prev, detailedStep])
                  break
                  
                case 'website_scraping':
                  console.log('[WEB] Website scraping event:', parsed.data)
                  setShowAIProcessing(true)
                  const scrapingStep: SearchStep = {
                    id: `website-scraping-${Date.now()}`,
                    type: parsed.data.metadata?.phase === 'scraping_start' ? 'progress' :
                          parsed.data.metadata?.phase === 'scraping_success' ? 'progress' :
                          parsed.data.metadata?.phase === 'scraping_error' ? 'progress' : 'progress',
                    tool: 'web_search',
                    content: parsed.data.content,
                    url: parsed.data.metadata?.url,
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setSearchSteps(prev => [...prev, scrapingStep])
                  break
                  
                case 'tool_call':
                  console.log('[WEB] Tool call:', parsed.data)
                  setCurrentTools(prev => [
                    ...prev.map(t => ({ ...t, status: 'complete' as const })),
                    {
                      tool: parsed.data.tool,
                      status: 'executing' as const,
                      query: parsed.data.metadata?.query
                    }
                  ])
                  break
                  
                case 'tool_result':
                  setCurrentTools(prev => 
                    prev.map(t => 
                      t.tool === parsed.data.metadata?.tool
                        ? { ...t, status: 'complete' as const, resultSize: parsed.data.metadata?.result_size }
                        : t
                    )
                  )
                  
                  if (parsed.data.metadata?.tool) {
                    const completeStep: SearchStep = {
                      id: `search-complete-${Date.now()}`,
                      type: 'complete',
                      tool: parsed.data.metadata.tool,
                      content: 'Search completed',
                      quality: parsed.data.metadata.quality,
                      timestamp: Date.now(),
                      metadata: parsed.data.metadata
                    }
                    setSearchSteps(prev => [...prev, completeStep])
                  }
                  break
                  
                case 'agent_thought':
                  // Also create a thinking stream for agent thoughts
                  const agentThought: ThinkingStep = {
                    id: `agent-thought-${Date.now()}`,
                    type: 'thinking_stream',
                    content: parsed.data.content,
                    phase: 'agent_reasoning',
                    timestamp: Date.now(),
                    metadata: parsed.data.metadata
                  }
                  setThinkingSteps(prev => [...prev, agentThought])
                  break
                  
                case 'ai_thinking':
                  // Legacy support
                  setIsTyping(true)
                  setMessages(prev => {
                  const newMessages = prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: 'Using tools... ' + (parsed.data?.content || '') }
                      : msg
                  )
                  updatedMessages = newMessages
                  return newMessages
                })
                case 'ai_typing':
                  setIsTyping(parsed.data?.typing || false)
                  break
                  
                case 'ai_chunk':
                  if (parsed.data?.content) {
                    const content = parsed.data.content
                    setIsTyping(false) // Clear typing when content starts coming
                    
                    // Update message content
                    setMessages(prev => {
                  let newMessages = prev
                  const currentMsg = prev.find(msg => msg.id === assistantMessage.id)
                  
                  if (currentMsg && (currentMsg.content.startsWith('Thinking...') || currentMsg.content.startsWith('Using tools...'))) {
                    // Clear the thinking/tool message, start fresh
                    newMessages = prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: content }
                        : msg
                    )
                  } else {
                    // Append to existing content
                    newMessages = prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: msg.content + content }
                        : msg
                    )
                  }
                  updatedMessages = newMessages
                  return newMessages
                })
                  }
                  break
                  
                case 'complete':
                  console.log('[WEB] Stream complete')
                  setIsTyping(false)
                  setAgentComplete(true)
                  
                  // Flush any remaining thinking steps
                  if (thinkingBatchRef.current.length > 0) {
                    setThinkingSteps(prev => [...prev, ...thinkingBatchRef.current])
                    thinkingBatchRef.current = []
                  }
                  
                  // Keep components visible but let them auto-minimize
                  // The components will handle their own minimization
                  // Don't hide them completely
                  break
                  
                case 'limit_exceeded':
                  console.log('[WEB] Limit exceeded:', parsed.data)
                  setShowUpgradePrompt(true)
                  setIsLoading(false)
                  setIsTyping(false)
                  return

                default:
                  console.log('[WEB] Unknown event type:', parsed.type)
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError, 'Line:', line)
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6)
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'ai_chunk' && parsed.data?.content) {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: msg.content + parsed.data.content }
                : msg
            ))
          }
        } catch (err) {
          console.error('Error parsing final buffer:', err)
        }
      }

      // Load chats after successful message
      await loadChats()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Something went wrong. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Load user's chats from the API
  const loadChats = async () => {
    try {
      const response = await fetch('/api/chat', {
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const chats: ChatSession[] = data.data.map((chat: { id: string; title?: string; updatedAt: string }) => ({
          id: chat.id,
          title: chat.title || 'Untitled Chat',
          messages: [], // We'll load messages when chat is selected
          updatedAt: new Date(chat.updatedAt)
        }))
        setChatSessions(chats)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    }
  }

  // Load dynamic questions for the user
  const loadDynamicQuestions = async () => {
    if (!user?.id) return
    
    setQuestionsLoading(true)
    try {
      const response = await fetch('/api/user/questions', {
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDynamicQuestions(data.data.questions || [])
          setIsPersonalized(data.data.isPersonalized || false)
          console.log(`🎯 [CHAT] Loaded ${data.data.questions?.length || 0} dynamic questions (personalized: ${data.data.isPersonalized})`)
        }
      } else {
        // Fallback to static questions if API fails
        const fallbackQuestions: DynamicQuestion[] = [
          { text: 'Explain quantum computing', category: 'technical', reasoning: 'General technical interest' },
          { text: 'Write a haiku about coding', category: 'creative', reasoning: 'Creative expression' },
          { text: 'Compare React vs Vue', category: 'technical', reasoning: 'Web development' },
          { text: 'Plan a weekend trip', category: 'personal', reasoning: 'Personal assistance' }
        ]
        setDynamicQuestions(fallbackQuestions)
        setIsPersonalized(false)
      }
    } catch (error) {
      console.error('Error loading dynamic questions:', error)
      // Fallback questions on error
      const fallbackQuestions: DynamicQuestion[] = [
        { text: 'Explain quantum computing', category: 'technical', reasoning: 'General technical interest' },
        { text: 'Write a haiku about coding', category: 'creative', reasoning: 'Creative expression' },
        { text: 'Compare React vs Vue', category: 'technical', reasoning: 'Web development' },
        { text: 'Plan a weekend trip', category: 'personal', reasoning: 'Personal assistance' }
      ]
      setDynamicQuestions(fallbackQuestions)
      setIsPersonalized(false)
    } finally {
      setQuestionsLoading(false)
    }
  }

  // Load messages for a specific chat
  const loadChatMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.data.map((msg: { id: string; content: string; role: string; createdAt: string }) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.createdAt)
        }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
    return []
  }

  const newChat = () => {
    setCurrentChatId(null)
    setMessages([])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Get icon for question category
  const getQuestionIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <Search size={20} />
      case 'creative':
        return <Sparkles size={20} />
      case 'personal':
        return <MessageCircle size={20} />
      case 'general':
      default:
        return <Plus size={20} />
    }
  }

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId)
    setIsLoading(true)
    const messages = await loadChatMessages(chatId)
    setMessages(messages)
    setIsLoading(false)
  }

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.id}`
        }
      })

      if (response.ok) {
        setChatSessions(prev => prev.filter(chat => chat.id !== chatId))
        if (currentChatId === chatId) {
          newChat()
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  // Load chats and questions on component mount
  useEffect(() => {
    if (user?.id) {
      loadChats()
      loadDynamicQuestions()
    }
  }, [user])

  // Keyboard shortcuts and responsive handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        newChat()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    const handleResize = () => {
      // Auto-close sidebar on mobile when resizing to mobile view
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false)
      }
      // Auto-open sidebar on desktop when resizing to desktop view
      if (window.innerWidth >= 768 && !sidebarOpen) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-black text-white relative overflow-hidden">
      {/* Dither Background - Hidden on mobile for performance */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Dither
          waveColor={[0.1, 0.15, 0.3]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.8}
          colorNum={6}
          waveAmplitude={0.3}
          waveFrequency={2.5}
          waveSpeed={0.01}
          pixelSize={3}
        />
        {/* Overlay to soften dither effect */}
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      {/* Mobile Background - Simple gradient for performance */}
      <div className="absolute inset-0 z-0 md:hidden bg-gradient-to-br from-gray-900 via-black to-gray-800" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarOpen ? 'md:w-80' : 'md:w-0'}
        fixed md:relative
        w-80 md:w-80
        h-full
        transition-all duration-300 ease-in-out
        glass-card bg-black/20 border-r border-white/10 
        flex flex-col overflow-hidden 
        z-50 md:z-10
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" className="flex items-center">
            <img 
              src="/lotus-full.svg" 
              alt="Lotus" 
              className="h-7 w-auto opacity-90 hover:opacity-100 transition-opacity filter brightness-0 invert"
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-3 md:p-2 text-tertiary hover:text-primary transition-all duration-200 hover:bg-white/10 rounded-lg touch-manipulation"
          >
            <X size={20} className="md:w-4 md:h-4" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-tertiary truncate">
                {user?.email}
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-3 md:p-2 text-tertiary hover:text-primary transition-all duration-200 hover:bg-white/10 rounded-lg touch-manipulation"
              title="Logout"
            >
              <LogOut size={20} className="md:w-4 md:h-4" />
            </button>
          </div>
        </div>

        <button onClick={newChat} className="flex items-center gap-3 mx-4 mb-4 px-4 py-3 glass-card-hover bg-white/5 rounded-xl text-sm font-medium text-white group">
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
          New chat
        </button>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                currentChatId === chat.id 
                  ? 'bg-white/10 border border-white/20' 
                  : 'hover:bg-white/5 border border-transparent hover:border-white/10'
              }`}
            >
              <MessageCircle size={16} className="text-text-tertiary group-hover:text-white transition-colors" />
              <span className="flex-1 text-sm text-text-secondary group-hover:text-white truncate font-medium">{chat.title}</span>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-text-tertiary hover:text-red-400 transition-all hover:bg-red-500/10 rounded-lg"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="glass-card p-6 rounded-2xl">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <p className="text-text-secondary text-sm">No conversations yet</p>
                <p className="text-text-tertiary text-xs mt-1">Start a new chat to get started</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link 
            href="/memories" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-white glass-card-hover rounded-xl transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            View Memory Map
          </Link>
          <Link 
            href="/settings" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-white glass-card-hover rounded-xl transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            Settings
          </Link>
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-4 md:p-3 glass-card hover:bg-white/10 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-xl touch-manipulation"
        >
          <Menu size={24} className="md:w-5 md:h-5" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative z-10">
        {showUpgradePrompt && (
          <UpgradePrompt 
            onUpgrade={async () => {
              try {
                const response = await fetch('/api/stripe/checkout', {
                  method: 'POST',
                  headers: {
                              'Content-Type': 'application/json'
                  }
                })

                if (response.ok) {
                  const data = await response.json()
                  // Redirect to Stripe checkout
                  window.location.href = data.data.url
                } else {
                  // Fallback to settings page
                  window.location.href = '/settings'
                }
              } catch (error) {
                // Fallback to settings page
                window.location.href = '/settings'
              }
            }}
            onClose={() => setShowUpgradePrompt(false)}
          />
        )}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
              <div className="glass-card p-6 md:p-12 rounded-2xl md:rounded-3xl max-w-2xl w-full mx-2 md:mx-4">
                <img 
                  src="/lotus.svg" 
                  alt="Lotus" 
                  className="h-16 w-auto mb-6 opacity-60 mx-auto filter brightness-0 invert"
                  style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}
                />
                <h1 className="text-responsive-xl font-light mb-4 text-shimmer">
                  How can I help you today?
                </h1>
                <div className="flex items-center justify-center gap-2 mb-8">
                  <p className="text-text-secondary text-responsive-base leading-relaxed">
                    {questionsLoading ? 'Loading personalized suggestions...' : 
                     isPersonalized ? 'Here are some personalized suggestions for you' : 
                     'Ask me anything or choose from the suggestions below'}
                  </p>
                  {isPersonalized && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Personalized suggestions based on your memories"></div>
                  )}
                </div>

                {questionsLoading ? (
                  <div className="flex justify-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-lg mx-auto">
                    {dynamicQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => setInputText(question.text)}
                        className="glass-card-hover p-4 md:p-6 rounded-xl md:rounded-2xl text-left group animate-slideUp border border-white/5 touch-manipulation"
                        style={{ animationDelay: `${i * 0.1}s` }}
                        title={`${question.reasoning} (${question.category})`}
                      >
                        <div className="text-text-tertiary mb-3 group-hover:text-blue-400 transition-colors">
                          {getQuestionIcon(question.category)}
                        </div>
                        <span className="text-sm text-text-secondary group-hover:text-white transition-colors font-medium">
                          {question.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-3 md:space-y-4">
              {messages.map((message, index) => {
                // Check if this is the current AI message being streamed
                const isCurrentAIMessage = message.role === 'assistant' && 
                  index === messages.length - 1 && 
                  (thinkingSteps.length > 0 || searchSteps.length > 0 || currentTools.length > 0)
                
                // Only show AI message if it has actual content
                const shouldShowAIMessage = message.role === 'user' || 
                  (message.role === 'assistant' && message.content.trim().length > 0)
                
                return (
                  <React.Fragment key={message.id}>
                    {/* Show unified AI processing component */}
                    {/* Unified Agent Activity */}
                    {isCurrentAIMessage && (thinkingSteps.length > 0 || searchSteps.length > 0 || currentTools.length > 0) && (
                      <div className="mb-4">
                        <AgentActivity 
                          thinkingSteps={thinkingSteps}
                          searchSteps={searchSteps}
                          tools={currentTools}
                          isActive={!agentComplete}
                        />
                      </div>
                    )}
                    
                    {/* Only render message if it should be shown */}
                    {shouldShowAIMessage && (
                      <div className={`flex gap-3 md:gap-4 animate-fadeIn ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold shadow-lg ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                        }`}>
                          {message.role === 'user' ? 'U' : 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm text-text-secondary mb-2 font-medium ${message.role === 'user' ? 'text-right' : ''}`}>
                            {message.role === 'user' ? 'You' : 'Lotus'}
                          </div>
                          <div className={`${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`glass-card bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 inline-block max-w-none ${
                              message.role === 'user' ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20' : ''
                            }`}>
                              <MessageRenderer 
                                content={message.content}
                                role={message.role}
                                messageId={message.id}
                                isStreaming={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
              
              {(isLoading || isTyping) && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 md:gap-4 animate-fadeIn">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-xs md:text-sm font-semibold shadow-lg">
                    L
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-secondary mb-2 font-medium">Lotus</div>
                    <div className="glass-card bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 inline-block">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-text-tertiary text-sm ml-2">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Search Mode Toggle */}
            <div className="flex justify-center">
              <div className="glass-card bg-white/5 rounded-xl md:rounded-2xl p-1.5 md:p-2 inline-flex">
                <button
                  className={`px-3 md:px-4 py-2.5 md:py-2 text-xs font-medium rounded-lg md:rounded-xl transition-all duration-200 flex items-center gap-2 touch-manipulation ${
                    searchMode === 'simple' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                      : 'text-text-tertiary hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setSearchMode('simple')}
                  title="Quick search - 2-3 sources, faster responses"
                  type="button"
                >
                  <Search size={12} />
                  Quick
                </button>
                <button
                  className={`px-3 md:px-4 py-2.5 md:py-2 text-xs font-medium rounded-lg md:rounded-xl transition-all duration-200 flex items-center gap-2 touch-manipulation ${
                    searchMode === 'deep' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                      : 'text-text-tertiary hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setSearchMode('deep')}
                  title="Deep research - 5-8 sources, comprehensive analysis"
                  type="button"
                >
                  <Sparkles size={12} />
                  Deep
                </button>
              </div>
            </div>

            {/* Input Field */}
            <div className="glass-card p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
              <div className="flex items-end gap-3 md:gap-4">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Message Lotus..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-text-muted border-none outline-none resize-none min-h-[24px] max-h-[120px] text-sm md:text-base leading-relaxed touch-manipulation"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className={`p-4 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 flex items-center justify-center group touch-manipulation ${
                    isLoading || !inputText.trim()
                      ? 'bg-white/10 text-text-muted cursor-not-allowed' 
                      : searchMode === 'deep'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25 hover:scale-105' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105'
                  }`}
                >
                  <Send size={18} className="md:w-4 md:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return <ChatPageContent />
}
