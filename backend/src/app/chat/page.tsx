'use client'

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"
import { useAuth, ProtectedRoute } from '../../lib/auth-context'
import { MessageRenderer } from '../../components/chat/MessageRenderer'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

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

function ChatPageContent() {
  const { token, user, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
            'Authorization': `Bearer ${token}`
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: messageText,
          deepResearchMode: false
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          logout()
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

      // Buffer for incomplete chunks
      let buffer = ''
      const decoder = new TextDecoder()

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
              
              if (parsed.type === 'ai_thinking') {
                // Show thinking phase
                setIsTyping(true)
                setMessages(prev => {
                  const newMessages = prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: '🤔 ' + (parsed.data?.content || 'Thinking...') }
                      : msg
                  )
                  updatedMessages = newMessages
                  return newMessages
                })
              } else if (parsed.type === 'ai_tool_use') {
                // Show tool use
                setMessages(prev => {
                  const newMessages = prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: '🔍 ' + (parsed.data?.content || 'Using tools...') }
                      : msg
                  )
                  updatedMessages = newMessages
                  return newMessages
                })
              } else if (parsed.type === 'ai_typing') {
                setIsTyping(parsed.data?.typing || false)
              } else if (parsed.type === 'ai_chunk' && parsed.data?.content) {
                const content = parsed.data.content
                setIsTyping(false) // Clear typing when content starts coming
                
                // Check if we need to clear the thinking/tool use message
                setMessages(prev => {
                  let newMessages = prev
                  const currentMsg = prev.find(msg => msg.id === assistantMessage.id)
                  
                  if (currentMsg && (currentMsg.content.startsWith('🤔') || currentMsg.content.startsWith('🔍'))) {
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
              } else if (parsed.type === 'complete') {
                setIsTyping(false)
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
          'Authorization': `Bearer ${token}`
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

  // Load messages for a specific chat
  const loadChatMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
          'Authorization': `Bearer ${token}`
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

  // Load chats on component mount
  useEffect(() => {
    loadChats()
  }, [token])

  // Keyboard shortcuts
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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <img 
              src="/lotus-white.png" 
              alt="Lotus" 
              style={{ height: '28px', width: 'auto' }}
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Profile Section */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border)',
          marginBottom: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.name || 'User'}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--text-tertiary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              title="Logout"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <button onClick={newChat} className="new-chat-button">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>

        <div className="chat-list">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="chat-item-text">{chat.title}</span>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className="delete-button"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {chatSessions.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem 1rem',
              color: 'var(--text-tertiary)',
              fontSize: '13px'
            }}>
              No conversations yet
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-3 border-t border-border space-y-2">
          <Link 
            href="/memories" 
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            View Memory Map
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="toggle-sidebar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <div className="main-content">
        <div className="messages-container">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <img 
                src="/lotus-white.png" 
                alt="Lotus" 
                style={{ height: '48px', width: 'auto', marginBottom: '16px', opacity: 0.9 }}
              />
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
                How can I help you today?
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Ask me anything or choose from the suggestions below
              </p>

              <div className="suggestions-grid">
                {[
                  { icon: '💡', text: 'Explain quantum computing' },
                  { icon: '✍️', text: 'Write a haiku about coding' },
                  { icon: '🔍', text: 'Compare React vs Vue' },
                  { icon: '🎯', text: 'Plan a weekend trip' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(item.text)}
                    className="suggestion-card"
                  >
                    <span className="suggestion-icon">{item.icon}</span>
                    <span className="suggestion-text">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="messages-wrapper">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? 'U' : 'L'}
                  </div>
                  <div className="message-content">
                    <div className="message-role">
                      {message.role === 'user' ? 'You' : 'Lotus'}
                    </div>
                    <div className="message-text">
                      <MessageRenderer 
                        content={message.content}
                        role={message.role}
                        messageId={message.id}
                        isStreaming={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {(isLoading || isTyping) && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="message assistant">
                  <div className="message-avatar">L</div>
                  <div className="message-content">
                    <div className="message-role">Lotus</div>
                    <div className="loading-dots">
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
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
              className="input-field"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className="send-button"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  )
}