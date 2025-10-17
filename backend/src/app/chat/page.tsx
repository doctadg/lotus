"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, Plus, Trash2, Send, Search, BookOpen, Sparkles, FileText, Image as ImageIcon, X, ChevronDown, Check, Sun, Moon } from 'lucide-react'
import { AgentActivity } from '../../components/chat/AgentActivity'
import { MessageRenderer } from '../../components/chat/MessageRenderer'
import { useAuth } from '../../hooks/useAuth'
import UpgradeModal from '@/components/billing/UpgradeModal'
import { useSubscription } from '@/hooks/useSubscription'
import { useTheme } from '../../hooks/useTheme'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
  createdAt?: string
}

interface ChatSession {
  id: string
  title?: string
  updatedAt?: string
}

type ThinkingType =
  | 'thinking_stream'
  | 'memory_access'
  | 'context_analysis'
  | 'search_planning'
  | 'search_result_analysis'
  | 'context_synthesis'
  | 'response_planning'

type SearchType = 'planning' | 'start' | 'progress' | 'analysis' | 'complete'

interface ThinkingStep {
  id: string
  type: ThinkingType
  content: string
  timestamp: number
  metadata?: any
}

interface SearchStep {
  id: string
  type: SearchType
  content: string
  tool: string
  progress?: number
  url?: string
  quality?: string
  timestamp: number
  metadata?: any
}

export default function ChatPage() {
  return <ChatLayout />
}

function ChatLayout() {
  const { user, signOut, isAuthenticated, isLoading } = useAuth()
  const { isDark, theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [agentComplete, setAgentComplete] = useState(false)
  const [currentTools, setCurrentTools] = useState<{ tool: string; status: 'executing' | 'complete' | 'error'; query?: string; resultSize?: number; duration?: number }[]>([])
  const [deepMode, setDeepMode] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { isPro } = useSubscription()
  // UI-only agent selector
  const agentOptions = [
    { id: 'general', label: 'General Assistant' },
    { id: 'research', label: 'Researcher' },
    { id: 'coder', label: 'Code Assistant' },
    { id: 'analyst', label: 'Data Analyst' },
  ] as const
  const [selectedAgent, setSelectedAgent] = useState<typeof agentOptions[number]['id']>('general')
  // New chat suggestions
  type DynamicQuestion = { text: string; category?: string; reasoning?: string }
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [isPersonalized, setIsPersonalized] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const [attachOpenHero, setAttachOpenHero] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const imageInputHeroRef = useRef<HTMLInputElement>(null)
  const docInputHeroRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  type Attachment = { url: string; contentType: string; name: string; kind: 'image' | 'document' }
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [agentMenuOpen, setAgentMenuOpen] = useState(false)
  const agentMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!agentMenuRef.current) return
      if (!agentMenuRef.current.contains(e.target as Node)) {
        setAgentMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const uploadFile = async (file: File): Promise<{ url: string; contentType: string; name: string } | null> => {
    try {
      setUploading(true)
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/tools/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return { url: data.url, contentType: data.contentType, name: data.name }
    } catch (e) {
      console.error('Upload error', e)
      return null
    } finally {
      setUploading(false)
    }
  }

  const addAttachment = (file: { url: string; contentType: string; name: string }) => {
    const isImage = file.contentType.startsWith('image/')
    setAttachments((prev) => [...prev, { url: file.url, contentType: file.contentType, name: file.name, kind: isImage ? 'image' : 'document' }])
  }

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url))
  }

  useEffect(() => {
    loadChats()
  }, [isAuthenticated])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const loadDynamicQuestions = async () => {
      if (!isAuthenticated) return
      setQuestionsLoading(true)
      try {
        const res = await fetch('/api/user/questions', {
        })
        if (res.ok) {
          const data = await res.json()
          setDynamicQuestions(data.data?.questions || [])
          setIsPersonalized(!!data.data?.isPersonalized)
        } else {
          setDynamicQuestions([
            { text: 'Explain quantum computing', category: 'technical' },
            { text: 'Write a haiku about coding', category: 'creative' },
            { text: 'Compare React vs Vue', category: 'technical' },
            { text: 'Plan a weekend trip', category: 'personal' },
          ])
          setIsPersonalized(false)
        }
      } catch (e) {
        setDynamicQuestions([
          { text: 'Explain quantum computing', category: 'technical' },
          { text: 'Write a haiku about coding', category: 'creative' },
          { text: 'Compare React vs Vue', category: 'technical' },
          { text: 'Plan a weekend trip', category: 'personal' },
        ])
        setIsPersonalized(false)
      } finally {
        setQuestionsLoading(false)
      }
    }
    loadDynamicQuestions()
  }, [isAuthenticated])

  const loadChats = async () => {
    try {
      const res = await fetch('/api/chat', {})
      if (res.ok) {
        const data = await res.json()
        console.log('Chat API response:', data) // Debug log
        // Handle both old and new API response formats
        if (Array.isArray(data.data)) {
          // Old format: data.data is directly the array
          setSessions(data.data || [])
        } else if (data.data?.chats && Array.isArray(data.data.chats)) {
          // New format: data.data has chats and pagination
          setSessions(data.data.chats)
        } else {
          console.warn('Unexpected chat data format:', data)
          setSessions([])
        }
      } else {
        console.error('Failed to load chats:', res.status)
        setSessions([])
      }
    } catch (e) {
      console.error('Failed to load chats', e)
      setSessions([])
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}/messages?limit=100`, {})
      if (res.ok) {
        const data = await res.json()
        // Handle both old and new API response formats
        let rawMessages = []
        if (Array.isArray(data.data)) {
          // Old format: data.data is directly the array
          rawMessages = data.data || []
        } else if (data.data?.messages) {
          // New format: data.data has messages and pagination
          rawMessages = data.data.messages || []
        }
        const msgs: Message[] = rawMessages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
        setMessages(msgs)
      } else if (res.status === 401) {
        console.error('Unauthorized access - please refresh the page')
      }
    } catch (e) {
      console.error('Failed to load messages', e)
    }
  }

  const newChat = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      if (res.ok) {
        const data = await res.json()
        const chat = data.data
        setSessions((prev) => [chat, ...prev])
        setCurrentChatId(chat.id)
        setMessages([])
        setSidebarOpen(false)
      } else if (res.status === 401) {
        console.error('Unauthorized access - please refresh the page')
      }
    } catch (e) {
      console.error('Failed to create chat', e)
    }
  }

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId)
    setSidebarOpen(false)
    await loadMessages(chatId)
  }

  const deleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSessions((prev) => prev.filter((c) => c.id !== chatId))
        if (currentChatId === chatId) {
          setCurrentChatId(null)
          setMessages([])
        }
      } else if (res.status === 401) {
        console.error('Unauthorized access - please refresh the page')
      }
    } catch (e) {
      console.error('Failed to delete chat', e)
    }
  }

  const sendMessage = async (overrideText?: string) => {
    let text = (overrideText ?? input).trim()
    if (sending) return
    // If there are attachments, append a simple attachment section
    if (attachments.length > 0) {
      const blocks: string[] = []
      // render images inline as markdown previews
      for (const att of attachments) {
        if (att.kind === 'image') blocks.push(`![${att.name}](${att.url})`)
      }
      // render documents as links below
      const docs = attachments.filter(a => a.kind === 'document')
      if (docs.length > 0) {
        blocks.push('Attachments:')
        for (const d of docs) {
          const safeName = d.name.replace(/\]|\[/g, '')
          blocks.push(`[${safeName}](${d.url})`)
        }
      }
      text = [blocks.join('\n\n'), text].filter(Boolean).join('\n\n')
    }
    if (!text) return

    try {
      setSending(true)

      // Ensure we have a chat
      let chatId = currentChatId
      if (!chatId) {
        const created = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify({ title: text.slice(0, 50) || 'New Chat' }),
        })
        if (created.ok) {
          const data = await created.json()
          chatId = data.data.id
          setCurrentChatId(chatId)
          setSessions((prev) => [data.data, ...prev])
        } else if (created.status === 401) {
          signOut()
          return
        } else {
          throw new Error('Failed to create chat')
        }
      }

      // Add user message
      const userMsg: Message = { id: `${Date.now()}`, role: 'user', content: text }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setAttachments([])

      // Reset agent state for new message
      setThinkingSteps([])
      setSearchSteps([])
      setAgentComplete(false)
      setCurrentTools([])

      // Add placeholder assistant message
      const assistantId = `${Date.now() + 1}`
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      // Stream response
      const res = await fetch(`/api/chat/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text, deepResearchMode: deepMode }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.error('Unauthorized - please refresh the page')
          setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 && m.role === 'assistant' && !m.content ? { ...m, content: 'Authentication error. Please refresh the page.' } : m)))
          return
        }
        if (res.status === 429) {
          const text = await res.text().catch(() => '')
          const msg = text || 'You have reached the free plan limit. Upgrade to Pro for unlimited access.'
          setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 && m.role === 'assistant' && !m.content ? { ...m, content: `${msg} \n\nUpgrade: ${window.location.origin}/pricing` } : m)))
          setSending(false)
          setShowUpgrade(true)
          return
        }
        throw new Error('Failed to send message')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) throw new Error('No stream reader')
      setIsThinking(true)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const raw of lines) {
          const line = raw.trim()
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const evt = JSON.parse(data)
            switch (evt.type) {
              case 'ai_chunk': {
                const chunk = evt.data?.content as string
                if (chunk) {
                  setIsThinking(false)
                  setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)))
                }
                break
              }
              case 'ai_typing': {
                setIsThinking(!!(evt.data?.typing ?? true))
                break
              }
              case 'thinking_stream': {
                const step: ThinkingStep = {
                  id: `think-${Date.now()}-${Math.random()}`,
                  type: 'thinking_stream',
                  content: evt.data?.content || 'Thinking...'
                    ,
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setThinkingSteps((prev) => {
                  const last = prev[prev.length - 1]
                  if (last && last.type === 'thinking_stream' && last.content === step.content) return prev
                  return [...prev, step]
                })
                setIsThinking(true)
                break
              }
              case 'memory_access':
              case 'context_analysis':
              case 'search_result_analysis':
              case 'context_synthesis':
              case 'response_planning': {
                const step: ThinkingStep = {
                  id: `${evt.type}-${Date.now()}`,
                  type: evt.type,
                  content: evt.data?.content || evt.type,
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setThinkingSteps((prev) => [...prev, step])
                setIsThinking(true)
                break
              }
              case 'search_planning': {
                const step: SearchStep = {
                  id: `search-plan-${Date.now()}`,
                  type: 'planning',
                  content: evt.data?.content || 'Planning search',
                  tool: evt.data?.metadata?.tool || 'web_search',
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setSearchSteps((prev) => [...prev, step])
                setIsThinking(true)
                break
              }
              case 'search_start': {
                const step: SearchStep = {
                  id: `search-start-${Date.now()}`,
                  type: 'start',
                  content: evt.data?.content || 'Starting search',
                  tool: evt.data?.metadata?.tool || 'web_search',
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setSearchSteps((prev) => [...prev, step])
                setIsThinking(true)
                break
              }
              case 'search_progress': {
                const step: SearchStep = {
                  id: `search-progress-${Date.now()}`,
                  type: 'progress',
                  content: evt.data?.content || 'Searching...',
                  progress: evt.data?.metadata?.progress,
                  tool: evt.data?.metadata?.tool || 'web_search',
                  url: evt.data?.metadata?.url,
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setSearchSteps((prev) => [...prev, step])
                setIsThinking(true)
                break
              }
              case 'search_detailed': {
                // Normalize detailed search phases into our SearchStep model
                const phase = evt.data?.metadata?.phase
                const step: SearchStep = {
                  id: `search-detailed-${Date.now()}`,
                  type:
                    phase === 'search_start'
                      ? 'start'
                      : phase === 'results_found'
                        ? 'progress'
                        : phase === 'search_complete'
                          ? 'complete'
                          : 'progress',
                  content: evt.data?.content || 'Searching...',
                  tool: 'web_search',
                  url: evt.data?.metadata?.url,
                  progress: evt.data?.metadata?.progress,
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setSearchSteps((prev) => [...prev, step])
                setIsThinking(true)
                break
              }
              case 'website_scraping': {
                const phase = evt.data?.metadata?.phase
                const step: SearchStep = {
                  id: `website-scraping-${Date.now()}`,
                  type: phase === 'scraping_start' ? 'progress' : phase === 'scraping_success' ? 'progress' : 'progress',
                  content: evt.data?.content || 'Scraping website',
                  tool: 'web_search',
                  url: evt.data?.metadata?.url,
                  progress: evt.data?.metadata?.progress,
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setSearchSteps((prev) => [...prev, step])
                setIsThinking(true)
                break
              }
              case 'search_complete': {
                const step: SearchStep = {
                  id: `search-complete-${Date.now()}`,
                  type: 'complete',
                  content: evt.data?.content || 'Search complete',
                  tool: evt.data?.metadata?.tool || 'web_search',
                  progress: 100,
                  timestamp: Date.now(),
                  metadata: evt.data?.metadata,
                }
                setSearchSteps((prev) => [...prev, step])
                break
              }
              case 'agent_thought':
                // Mirrored as thinking_stream by the backend; ignore to avoid duplicates
                break
              case 'tool_call': {
                const tool = evt.data?.tool || 'tool'
                const query = evt.data?.metadata?.query
                setCurrentTools((prev) => [...prev, { tool, status: 'executing', query }])
                setIsThinking(true)
                break
              }
              case 'tool_result': {
                const resultSize = evt.data?.metadata?.resultSize || evt.data?.metadata?.resultCount
                const duration = evt.data?.metadata?.duration
                const tool = evt.data?.metadata?.tool || 'tool'
                setCurrentTools((prev) => {
                  const idx = [...prev].reverse().findIndex((t) => t.tool === tool && t.status === 'executing')
                  if (idx === -1) return [...prev, { tool, status: 'complete', resultSize, duration }]
                  const realIdx = prev.length - 1 - idx
                  const updated = [...prev]
                  updated[realIdx] = { ...updated[realIdx], status: 'complete', resultSize, duration }
                  return updated
                })
                break
              }
              case 'ai_tool_use': {
                // generic tool usage event
                const tool = evt.data?.metadata?.tool || 'tool'
                const query = evt.data?.content
                setCurrentTools((prev) => [...prev, { tool, status: 'executing', query }])
                break
              }
              case 'ai_thinking':
              case 'context_analysis':
              case 'context_synthesis': {
                setIsThinking(true)
                break
              }
              case 'complete': {
                setIsThinking(false)
                setAgentComplete(true)
                break
              }
              case 'limit_exceeded': {
                setIsThinking(false)
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: 'Message limit reached. Please upgrade.' } : m)))
                break
              }
            }
          } catch (e) {
            console.error('Stream parse error', e)
          }
        }
      }

      // Refresh chat list timestamps
      await loadChats()
    } catch (e) {
      console.error('Send failed', e)
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 && m.role === 'assistant' && !m.content ? { ...m, content: 'Something went wrong.' } : m)))
    } finally {
      setSending(false)
      setIsThinking(false)
    }
  }

  // Removed custom drawer timeline; using AgentActivity inline, always showing

  const sidebar = (
    <div className={`flex h-full flex-col w-64 overflow-hidden p-2 ${isDark ? 'bg-black/20 backdrop-blur-2xl border-white/10' : 'bg-white/80 backdrop-blur-2xl border-gray-200/50'} border-r`}>
      {/* Top Bar */}
      <div className={`flex items-center justify-between px-3 py-3 rounded-xl ${isDark ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/60 backdrop-blur-xl border-gray-200/50'} border shadow-lg`}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/lotus-full.svg" alt="Lotus" className={`h-6 md:h-7 w-auto ${isDark ? 'invert opacity-90' : 'opacity-90'}`} />
        </Link>
        <button onClick={newChat} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border-white/20' : 'bg-white/80 text-gray-900 hover:bg-white border-gray-300/50'} border shadow-sm transition-all`}>
          <Plus className="w-3 h-3" /> New
        </button>
      </div>
      <div className="px-1 pt-2 space-y-1">
        <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isDark ? 'text-neutral-300 hover:bg-white/5 backdrop-blur-xl' : 'text-gray-600 hover:bg-white/60 backdrop-blur-xl'}`}>
          <Search className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} /> Search chats
        </button>
        <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isDark ? 'text-neutral-300 hover:bg-white/5 backdrop-blur-xl' : 'text-gray-600 hover:bg-white/60 backdrop-blur-xl'}`}>
          <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} /> Library
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-1">
        {(sessions || []).map((s) => (
          <div
            key={s.id}
            onClick={() => selectChat(s.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border transition-all ${
              isDark
                ? 'hover:border-white/20 hover:bg-white/10 backdrop-blur-xl hover:shadow-lg'
                : 'hover:border-gray-300/60 hover:bg-white/80 backdrop-blur-xl hover:shadow-md'
            } ${
              currentChatId === s.id
                ? (isDark ? 'bg-white/10 backdrop-blur-xl border-white/20 shadow-lg' : 'bg-white/90 backdrop-blur-xl border-gray-300/60 shadow-md')
                : 'border-transparent'
            }`}
          >
            <div className={`flex-1 truncate text-sm ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>{s.title || 'Untitled Chat'}</div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteChat(s.id)
              }}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg ${
                isDark 
                  ? 'text-neutral-400 hover:text-red-400 hover:bg-red-500/10' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className={`text-xs px-3 py-8 text-center ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>No conversations yet</div>
        )}
      </div>
      {/* Bottom Bar */}
      <div className="px-1 pt-2">
        <div className={`rounded-xl p-2 space-y-1 ${isDark ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/60 backdrop-blur-xl border-gray-200/50'} border shadow-lg`}>
          <Link href="/memories" className={`block text-xs px-3 py-2 rounded-lg transition-all ${isDark ? 'text-neutral-300 hover:bg-white/10 backdrop-blur-xl' : 'text-gray-600 hover:bg-white/80 backdrop-blur-xl'}`}>Memories</Link>
          <Link href="/settings" className={`block text-xs px-3 py-2 rounded-lg transition-all ${isDark ? 'text-neutral-300 hover:bg-white/10 backdrop-blur-xl' : 'text-gray-600 hover:bg-white/80 backdrop-blur-xl'}`}>Settings</Link>
          <button onClick={signOut} className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${isDark ? 'text-neutral-300 hover:bg-white/10 backdrop-blur-xl' : 'text-gray-600 hover:bg-white/80 backdrop-blur-xl'}`}>Logout</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-gradient-to-br from-black via-neutral-950 to-black text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
      {/* Sidebar - desktop */}
      <div className="hidden md:flex w-64 h-screen">{sidebar}</div>

      {/* Sidebar toggle - mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`md:hidden fixed top-4 left-4 z-40 p-3 rounded-lg border transition-all shadow-lg ${isDark ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20' : 'bg-white/90 backdrop-blur-xl border-gray-300/50 text-gray-900 hover:bg-white'}`}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar drawer - mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">{sidebar}</div>
          <div onClick={() => setSidebarOpen(false)} className="flex-1 h-full bg-black/50" />
        </div>
      )}

      {/* Main content */
      }
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2" ref={agentMenuRef}>
            {/* Fancy agent dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={agentMenuOpen}
                onClick={() => setAgentMenuOpen(v => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setAgentMenuOpen(false)
                }}
                className={`group inline-flex items-center gap-2 rounded-full p-[1px] border transition-all ${
                  isDark ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/60 backdrop-blur-xl border-gray-300/50'
                }`}
                title="Select agent"
              >
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-xl border shadow-lg ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-neutral-100 border-white/20'
                    : 'bg-white/80 hover:bg-white text-gray-900 border-gray-300/50'
                }`}>
                  <span className="text-sm font-medium">
                    {agentOptions.find(a => a.id === selectedAgent)?.label || 'Select Agent'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform group-aria-expanded:rotate-180 ${
                    isDark ? 'text-neutral-300' : 'text-gray-500'
                  }`} />
                </span>
              </button>

              {agentMenuOpen && (
                <div
                  role="listbox"
                  aria-activedescendant={`agent-${selectedAgent}`}
                  className={`absolute z-30 mt-2 w-64 rounded-xl border backdrop-blur-2xl shadow-2xl ring-1 overflow-hidden ${
                    isDark
                      ? 'border-white/10 bg-black/80 backdrop-blur-2xl ring-white/10'
                      : 'border-gray-200/50 bg-white/90 backdrop-blur-2xl ring-gray-200/50'
                  }`}
                >
                  {agentOptions.map((opt) => {
                    const active = opt.id === selectedAgent
                    return (
                      <button
                        key={opt.id}
                        id={`agent-${opt.id}`}
                        role="option"
                        aria-selected={active}
                        onClick={() => { setSelectedAgent(opt.id); setAgentMenuOpen(false) }}
                         className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-all ${
                           active
                             ? (isDark ? 'bg-white/10 backdrop-blur-xl text-white' : 'bg-blue-50/90 backdrop-blur-xl text-blue-900')
                             : (isDark ? 'text-neutral-200 hover:bg-white/5 backdrop-blur-xl' : 'text-gray-700 hover:bg-white/60 backdrop-blur-xl')
                         }`}
                      >
                        <span>{opt.label}</span>
                        {active && <Check className={`w-4 h-4 ${isDark ? 'text-neutral-300' : 'text-blue-600'}`} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Theme toggle button */}
          <button
            onClick={() => {
              if (theme === 'system') {
                setTheme(isDark ? 'light' : 'dark')
              } else {
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
            }}
            className={`p-2 rounded-lg transition-all ${
              isDark
                ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-yellow-400 hover:bg-white/20 hover:shadow-lg'
                : 'bg-white/80 backdrop-blur-xl border border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md'
            }`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Messages container: wider black panel with rounded corners */}
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <div
            className={`mx-auto w-full max-w-6xl rounded-2xl overflow-hidden transition-all ${
              messages.length === 0 ? '' : (isDark ? 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl')
            }`}
          >
            <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-4">
              {messages.length === 0 ? (
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-6">
                  <h1 className={`text-[22px] md:text-2xl font-medium ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>What's on the agenda today?</h1>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {questionsLoading
                      ? 'Loading personalized suggestions...'
                      : isPersonalized
                        ? 'Here are some personalized suggestions for you'
                        : 'Ask me anything or choose a suggestion'}
                  </p>
                  {/* Input box shown in hero for empty chat */}
                  <div className="w-full max-w-2xl mx-auto">
                    <div className={`rounded-2xl p-2 shadow-2xl transition-all ${isDark ? 'bg-white/5 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-gray-300/50'}`}>
                      {/* Attachments preview (hero, above input) */}
                      {attachments.length > 0 && (
                        <div className="w-full mb-2 flex flex-wrap gap-2">
                          {attachments.map((att) => (
                            <div key={att.url} className={`relative border rounded-lg p-1 ${isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-300 bg-gray-50'}`}>
                              {att.kind === 'image' ? (
                                <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded" />
                              ) : (
                                <div className={`h-16 w-44 flex items-center gap-2 px-2 text-xs ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
                                  <FileText className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                                  <span className="truncate" title={att.name}>{att.name}</span>
                                </div>
                              )}
                              <button
                                onClick={() => removeAttachment(att.url)}
                                className={`absolute -top-2 -right-2 rounded-full p-1 ${
                                  isDark 
                                    ? 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700' 
                                    : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-100'
                                }`}
                                aria-label="Remove attachment"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setAttachOpenHero((v) => !v)}
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isDark
                                ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-neutral-300 hover:bg-white/20 hover:shadow-lg'
                                : 'bg-white/80 backdrop-blur-xl border border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md'
                            }`}
                            title="Attach image or document"
                            type="button"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {attachOpenHero && (
                            <div className={`absolute z-10 mt-2 w-48 rounded-lg border shadow-2xl ${
                              isDark ? 'border-white/10 bg-black/90 backdrop-blur-2xl' : 'border-gray-300/50 bg-white/95 backdrop-blur-2xl'
                            }`}>
                              <button
                                onClick={() => {
                                  setAttachOpenHero(false)
                                  imageInputHeroRef.current?.click()
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-400" /> Upload image
                        </button>
                        <button
                          onClick={() => {
                            setAttachOpenHero(false)
                            docInputHeroRef.current?.click()
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                            isDark ? 'text-neutral-200 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                              >
                                <FileText className="w-4 h-4 text-neutral-400" /> Upload document
                              </button>
                            </div>
                          )}
                          <input
                            ref={imageInputHeroRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              const info = await uploadFile(f)
                              if (info) addAttachment(info)
                              e.currentTarget.value = ''
                            }}
                          />
                          <input
                            ref={docInputHeroRef}
                            type="file"
                            accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              const info = await uploadFile(f)
                              if (info) addAttachment(info)
                              e.currentTarget.value = ''
                            }}
                          />
                        </div>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          onPaste={async (e) => {
                            const items = e.clipboardData?.items
                            if (!items) return
                            const imgs: File[] = []
                            for (let i = 0; i < items.length; i++) {
                              const it = items[i]
                              if (it.kind === 'file' && it.type.startsWith('image/')) {
                                const file = it.getAsFile()
                                if (file) imgs.push(file)
                              }
                            }
                            if (imgs.length > 0) {
                              e.preventDefault()
                              for (const f of imgs) {
                                const info = await uploadFile(f)
                                if (info) addAttachment(info)
                              }
                            }
                          }}
                          placeholder={uploading ? "Uploading…" : "Message Lotus…"}
                          className={`flex-1 bg-transparent rounded-xl px-2 py-2 outline-none resize-none min-h-[44px] max-h-40 ${
                            isDark 
                              ? 'text-neutral-200 placeholder-neutral-500' 
                              : 'text-gray-900 placeholder-gray-400'
                          }`}
                          rows={1}
                          disabled={sending || uploading}
                        />
                  
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { if (!isPro) { setShowUpgrade(true); return } setDeepMode(v => !v) }}
                            className={`w-auto px-2 h-8 rounded-full border flex items-center gap-1 justify-center text-xs transition-all ${
                        deepMode
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent shadow-lg shadow-purple-500/50'
                          : (isDark
                              ? 'bg-white/10 backdrop-blur-xl border-white/20 text-neutral-300 hover:bg-white/20 hover:shadow-lg'
                              : 'bg-white/80 backdrop-blur-xl border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md')
                            }`}
                            title="Toggle deep research"
                            type="button"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Deep
                          </button>
                          <button
                            onClick={() => sendMessage()}
                            disabled={sending || uploading || (!input.trim() && attachments.length === 0)}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        sending || uploading || (!input.trim() && attachments.length === 0)
                          ? (isDark
                              ? 'bg-white/5 backdrop-blur-xl border-white/10 text-neutral-500 cursor-not-allowed'
                              : 'bg-gray-100/50 backdrop-blur-xl border-gray-300/50 text-gray-400 cursor-not-allowed')
                          : (isDark
                              ? 'bg-white/10 backdrop-blur-xl border-white/20 text-neutral-200 hover:bg-white/20 hover:shadow-lg'
                              : 'bg-white/80 backdrop-blur-xl border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md')
                            }`}
                            title="Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions grid */}
                  <div className="w-full max-w-2xl mx-auto">
                    {questionsLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' as any }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' as any }} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {dynamicQuestions.map((q, i) => (
                          <button
                            key={`${q.text}-${i}`}
                            onClick={() => sendMessage(q.text)}
                            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                              isDark
                                ? 'border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:shadow-xl'
                                : 'border-gray-300/50 bg-white/80 backdrop-blur-xl hover:bg-white hover:border-gray-300 hover:shadow-lg'
                            }`}
                            title={q.reasoning || undefined}
                          >
                            <span className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{q.text}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((m, index) => {
                  const hasLiveActivity = (thinkingSteps.length > 0 || searchSteps.length > 0 || currentTools.length > 0)
                  const isStreamingNow = !agentComplete && hasLiveActivity
                  const isCurrentAIMessage = m.role === 'assistant' && index === messages.length - 1 && isStreamingNow
                  const shouldShowAIMessage = m.role === 'user' || (m.role === 'assistant' && m.content.trim().length > 0)

                  return (
                    <React.Fragment key={m.id}>
                      {isCurrentAIMessage && (
                        <div className="mb-2">
                          <AgentActivity 
                            thinkingSteps={thinkingSteps}
                            searchSteps={searchSteps}
                            tools={currentTools}
                            isActive={!agentComplete}
                          />
                        </div>
                      )}

                      {shouldShowAIMessage && (
                        <div className="w-full">
                          <div
                             className={`rounded-2xl px-4 py-3 border max-w-[90%] md:max-w-[85%] transition-all ${
                               m.role === 'user'
                                 ? (isDark
                                     ? 'bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-xl text-white border-blue-500/30 shadow-lg shadow-blue-500/20 ml-auto md:mr-2'
                                     : 'bg-gradient-to-br from-blue-500/95 to-blue-600/95 backdrop-blur-xl text-white border-blue-400/30 shadow-lg shadow-blue-400/20 ml-auto md:mr-2')
                                 : (isDark
                                     ? 'bg-white/5 backdrop-blur-2xl text-neutral-200 border-white/10 shadow-xl mr-auto md:ml-2'
                                     : 'bg-white/90 backdrop-blur-2xl text-gray-900 border-gray-300/50 shadow-lg mr-auto md:ml-2')
                             }`}
                          >
                            <MessageRenderer
                              content={m.content}
                              role={m.role}
                              messageId={m.id}
                              isStreaming={m.role === 'assistant' && isStreamingNow && index === messages.length - 1}
                            />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })
              )}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        {/* Input box - show only after chat starts */}
        {messages.length > 0 && (
          <div className="px-4 pb-4">
            <div className="mx-auto w-full max-w-3xl">
              <div className="mx-auto w-full max-w-2xl px-0 py-4">
                <div className={`rounded-2xl p-2 shadow-2xl transition-all ${isDark ? 'bg-white/5 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-gray-300/50'}`}>
                  {/* Attachments preview (active chat, above input) */}
                  {attachments.length > 0 && (
                    <div className="w-full mb-2 flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div key={att.url} className={`relative border rounded-lg p-1 ${isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-300 bg-gray-50'}`}>
                          {att.kind === 'image' ? (
                            <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded" />
                          ) : (
                            <div className={`h-16 w-44 flex items-center gap-2 px-2 text-xs ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
                              <FileText className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                              <span className="truncate" title={att.name}>{att.name}</span>
                            </div>
                          )}
                          <button
                            onClick={() => removeAttachment(att.url)}
                            className={`absolute -top-2 -right-2 rounded-full p-1 ${
                              isDark 
                                ? 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700' 
                                : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-100'
                            }`}
                            aria-label="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setAttachOpen((v) => !v)}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDark
                            ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-neutral-300 hover:bg-white/20 hover:shadow-lg'
                            : 'bg-white/80 backdrop-blur-xl border border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md'
                        }`}
                        title="Attach image or document"
                        type="button"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {attachOpen && (
                        <div className={`absolute z-10 bottom-10 left-0 w-48 rounded-lg border shadow-2xl ${
                          isDark ? 'border-white/10 bg-black/90 backdrop-blur-2xl' : 'border-gray-300/50 bg-white/95 backdrop-blur-2xl'
                        }`}>
                          <button
                            onClick={() => { setAttachOpen(false); imageInputRef.current?.click() }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${
                              isDark ? 'text-neutral-200 hover:bg-white/10 backdrop-blur-xl' : 'text-gray-700 hover:bg-white/80 backdrop-blur-xl'
                            }`}
                          >
                            <ImageIcon className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} /> Upload image
                          </button>
                          <button
                            onClick={() => { setAttachOpen(false); docInputRef.current?.click() }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${
                              isDark ? 'text-neutral-200 hover:bg-white/10 backdrop-blur-xl' : 'text-gray-700 hover:bg-white/80 backdrop-blur-xl'
                            }`}
                          >
                            <FileText className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} /> Upload document
                          </button>
                        </div>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const info = await uploadFile(f)
                          if (info) addAttachment(info)
                          e.currentTarget.value = ''
                        }}
                      />
                      <input
                        ref={docInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const info = await uploadFile(f)
                          if (info) addAttachment(info)
                          e.currentTarget.value = ''
                        }}
                      />
                    </div>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      onPaste={async (e) => {
                        const items = e.clipboardData?.items
                        if (!items) return
                        const imgs: File[] = []
                        for (let i = 0; i < items.length; i++) {
                          const it = items[i]
                          if (it.kind === 'file' && it.type.startsWith('image/')) {
                            const file = it.getAsFile()
                            if (file) imgs.push(file)
                          }
                        }
                        if (imgs.length > 0) {
                          e.preventDefault()
                          for (const f of imgs) {
                            const info = await uploadFile(f)
                            if (info) addAttachment(info)
                          }
                        }
                      }}
                      placeholder={uploading ? "Uploading…" : "Message Lotus…"}
                      className={`flex-1 bg-transparent rounded-xl px-2 py-2 outline-none resize-none min-h-[44px] max-h-40 ${
                        isDark 
                          ? 'text-neutral-200 placeholder-neutral-500' 
                          : 'text-gray-900 placeholder-gray-400'
                      }`}
                      rows={1}
                      disabled={sending || uploading}
                    />
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { if (!isPro) { setShowUpgrade(true); return } setDeepMode(v => !v) }}
                        className={`w-auto px-2 h-8 rounded-full border flex items-center gap-1 justify-center text-xs transition-all ${
                          deepMode
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-transparent shadow-lg shadow-purple-500/50'
                            : (isDark
                                ? 'bg-white/10 backdrop-blur-xl border-white/20 text-neutral-300 hover:bg-white/20 hover:shadow-lg'
                                : 'bg-white/80 backdrop-blur-xl border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md')
                        }`}
                        title="Toggle deep research"
                        type="button"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Deep
                      </button>
                      <button
                        onClick={() => sendMessage()}
                        disabled={sending || uploading || (!input.trim() && attachments.length === 0)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                          sending || uploading || (!input.trim() && attachments.length === 0)
                            ? (isDark
                                ? 'bg-white/5 backdrop-blur-xl border-white/10 text-neutral-500 cursor-not-allowed'
                                : 'bg-gray-100/50 backdrop-blur-xl border-gray-300/50 text-gray-400 cursor-not-allowed')
                            : (isDark
                                ? 'bg-white/10 backdrop-blur-xl border-white/20 text-neutral-200 hover:bg-white/20 hover:shadow-lg'
                                : 'bg-white/80 backdrop-blur-xl border-gray-300/50 text-gray-600 hover:bg-white hover:shadow-md')
                        }`}
                        title="Send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Removed timeline drawer; AgentActivity is always visible above messages */}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
