export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface Chat {
  id: string
  userId: string
  title?: string
  createdAt: Date
  updatedAt: Date
  messages?: Message[]
}

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface CreateChatRequest {
  title?: string
}

export interface SendMessageRequest {
  content: string
  role?: 'user'
}

export interface AgentResponse {
  content: string
  metadata?: {
    model: string
    tokens_used?: number
    function_calls?: Record<string, unknown>[]
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}