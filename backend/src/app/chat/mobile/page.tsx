'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../hooks/useAuth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function MobileStyleChatPage() {
  return <MobileChatContent />
}

function MobileChatContent() {
  const { user, signOut } = useAuth()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)

  useEffect(() => {
    // Create a new chat on mount to mirror mobile flow
    const createChat = async () => {
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
          setChatId(data.data.id)
        }
      } catch (err) {
        console.error('Failed to create chat:', err)
      }
    }
    createChat()
  }, [user])

  const sendMessage = async () => {
    if (!message.trim() || !chatId || loading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`,
        },
        body: JSON.stringify({ content: userMessage.content }),
      })

      if (res.ok) {
        const data = await res.json()
        const ai = data.data.aiMessage as { id: string; content: string }
        setMessages(prev => [...prev, { id: ai.id, role: 'assistant', content: ai.content }])
      } else if (res.status === 401) {
        signOut()
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Failed to send message.' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header to mirror mobile */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <img src="/lotus.svg" alt="Lotus" className="h-6 w-6 invert opacity-80" />
          <span className="text-lg font-semibold">Lotus AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/memories" className="px-3 py-1.5 rounded-md bg-neutral-800 text-xs hover:bg-neutral-700">Memories</Link>
          <Link href="/settings" className="px-3 py-1.5 rounded-md bg-neutral-800 text-xs hover:bg-neutral-700">Profile</Link>
          <button onClick={signOut} className="px-3 py-1.5 rounded-md bg-neutral-800 text-xs hover:bg-neutral-700">Logout</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.role === 'user' ? 'bg-indigo-500 self-end ml-auto' : 'bg-neutral-800 self-start mr-auto'}`}>
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="px-5 pb-6 pt-3 border-t border-neutral-800">
        <div className="flex items-end gap-3">
          <textarea
            className="flex-1 bg-neutral-900 rounded-2xl text-white placeholder-neutral-500 px-4 py-3 outline-none resize-none max-h-40 min-h-12"
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              !message.trim() || loading ? 'bg-indigo-500/50 text-white/70 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

