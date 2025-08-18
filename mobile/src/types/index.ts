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

export interface UserMemory {
  id: string
  userId: string
  type: 'preference' | 'fact' | 'context' | 'skill'
  category: string
  key: string
  value: string
  confidence: number
  source: 'explicit' | 'inferred'
  createdAt: string
  updatedAt: string
}

export interface UserContext {
  id: string
  userId: string
  communicationStyle?: string
  topicsOfInterest?: string[]
  expertiseAreas?: string[]
  preferredResponseStyle?: string
  timezone?: string
  createdAt: string
  updatedAt: string
}

export interface PersonalizedQuestion {
  id: string
  content: string
  category?: string
  isPersonalized?: boolean
}

export interface Subscription {
  id?: string
  userId: string
  planType: 'free' | 'pro' | 'premium'
  status: 'active' | 'canceled' | 'past_due' | null
  currentPeriodStart?: string
  currentPeriodEnd?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  user: User
  token: string
}
