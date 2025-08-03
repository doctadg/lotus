'use client'

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"

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

export default function Home() {
  const [stats, setStats] = useState({ uptime: '0ms', status: 'checking...' })
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/test/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputText,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + content }
                    : msg
                ))
              }
            } catch {
              // Handle non-JSON chunks
              if (data && data !== '[DONE]') {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + data }
                    : msg
                ))
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }

    // Update chat session
    if (currentChatId) {
      setChatSessions(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages, title: messages[0]?.content.slice(0, 50) || 'New Chat', updatedAt: new Date() }
          : chat
      ))
    }
  }

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats({ uptime: 'Online', status: 'All systems operational' })
        }
      })
      .catch(() => {
        setStats({ uptime: 'Offline', status: 'Service unavailable' })
      })
  }, [])

  const newChat = () => {
    const newChatId = Date.now().toString()
    const newSession: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      updatedAt: new Date()
    }
    setChatSessions(prev => [newSession, ...prev])
    setCurrentChatId(newChatId)
    setMessages([])
    setSidebarOpen(false)
  }

  const selectChat = (chatId: string) => {
    const chat = chatSessions.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-muted border-r border-border transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat Sessions */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {chatSessions.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors hover:bg-accent ${
                currentChatId === chat.id ? 'bg-accent' : ''
              }`}
            >
              <div className="font-medium text-sm truncate">{chat.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {chat.messages.length} messages
              </div>
            </button>
          ))}
          {chatSessions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">L</span>
                </div>
                <h1 className="text-xl font-bold">Lotus AI</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                stats.uptime === 'Online' 
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  stats.uptime === 'Online' ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`} />
                {stats.status}
              </div>
              <Link
                href="https://github.com/doctadg/lotus"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                target="_blank"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Chat Interface */}
        <main className="flex-1 flex flex-col">
          {!showChat ? (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <span className="text-primary-foreground font-bold text-3xl">L</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  AI Chat with
                  <span className="text-gradient"> Streaming</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                  Experience the next generation of AI conversations with real-time streaming responses, 
                  powered by LangChain and OpenRouter.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                  <button 
                    onClick={() => setShowChat(true)}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Start Chatting
                  </button>
                  
                  <button 
                    onClick={() => window.open('exp://192.168.1.100:8081', '_blank')}
                    className="border border-border text-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Mobile App
                  </button>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-20">
                  <div className="glass rounded-2xl p-8 hover:bg-accent/50 transition-all duration-300 animate-fade-in">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto">
                      <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Real-time Streaming</h3>
                    <p className="text-muted-foreground">Watch AI responses appear in real-time with smooth streaming technology</p>
                  </div>

                  <div className="glass rounded-2xl p-8 hover:bg-accent/50 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.1s'}}>
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto">
                      <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Advanced AI Agent</h3>
                    <p className="text-muted-foreground">Powered by LangChain with function calling and tool integration</p>
                  </div>

                  <div className="glass rounded-2xl p-8 hover:bg-accent/50 transition-all duration-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6 mx-auto">
                      <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Cross-Platform</h3>
                    <p className="text-muted-foreground">React Native mobile app with web support and responsive design</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (

            /* Chat Interface */
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
              <div className="flex-1 flex flex-col glass rounded-2xl m-4 overflow-hidden">
                {/* Chat Header */}
                <div className="bg-muted/50 border-b border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">AI</span>
                        </div>
                        OpenRouter Integration
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">Live AI conversation with streaming responses</p>
                    </div>
                    <button
                      onClick={() => setShowChat(false)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <div className="max-w-md">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-muted-foreground mb-2">Start a conversation to test the AI integration!</p>
                        <p className="text-sm text-muted-foreground">Try asking: &quot;What can you help me with?&quot;</p>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                      <div className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted border border-border'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 opacity-70`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start animate-slide-in">
                      <div className="bg-muted border border-border rounded-2xl px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputText.trim()}
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-primary rounded"></div>
                <span className="text-muted-foreground">Built with Next.js, Prisma, and LangChain</span>
              </div>
              
              <div className="flex items-center space-x-6">
                <Link href="https://github.com/doctadg/lotus" className="text-muted-foreground hover:text-foreground transition-colors">
                  GitHub
                </Link>
                <Link href="/api/health" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Docs
                </Link>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">Status: {stats.uptime}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}