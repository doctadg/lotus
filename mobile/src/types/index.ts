export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface Chat {
  id: string
  userId: string
  title?: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
  createdAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface SendMessageRequest {
  content: string
  role?: 'user'
  deepResearchMode?: boolean
}

export interface CreateChatRequest {
  title?: string
}