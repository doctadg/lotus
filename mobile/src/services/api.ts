import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ApiResponse, Chat, Message, User, SendMessageRequest, CreateChatRequest } from '../types'

class ApiService {
  private api: AxiosInstance
  private baseURL = 'https://lotus-backend.vercel.app/api' // Production backend URL

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add auth interceptor
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('userToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async createUser(email: string, name?: string): Promise<User> {
    const response = await this.api.post<ApiResponse<User>>('/user/profile', {
      email,
      name
    })
    
    if (response.data.success && response.data.data) {
      // Store email as token for simple auth
      await AsyncStorage.setItem('userToken', email)
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data))
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to create user')
  }

  async getUserProfile(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>('/user/profile')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to get user profile')
  }

  // Chat methods
  async createChat(data: CreateChatRequest): Promise<Chat> {
    const response = await this.api.post<ApiResponse<Chat>>('/chat', data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to create chat')
  }

  async getChats(): Promise<Chat[]> {
    const response = await this.api.get<ApiResponse<Chat[]>>('/chat')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to get chats')
  }

  async getChat(chatId: string): Promise<Chat> {
    const response = await this.api.get<ApiResponse<Chat>>(`/chat/${chatId}`)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to get chat')
  }

  async deleteChat(chatId: string): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/chat/${chatId}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete chat')
    }
  }

  // Message methods
  async getMessages(chatId: string): Promise<Message[]> {
    const response = await this.api.get<ApiResponse<Message[]>>(`/chat/${chatId}/messages`)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to get messages')
  }

  async sendMessage(chatId: string, data: SendMessageRequest): Promise<{ userMessage: Message; aiMessage: Message }> {
    const response = await this.api.post<ApiResponse<{ userMessage: Message; aiMessage: Message }>>(`/chat/${chatId}/messages`, data)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to send message')
  }

  // Real-time streaming message support (matching landing page approach)
  async *sendMessageStream(chatId: string, data: SendMessageRequest): AsyncGenerator<{
    type: 'user_message' | 'ai_typing' | 'ai_chunk' | 'ai_message_complete' | 'complete' | 'error'
    data: any
  }, void, unknown> {
    const token = await AsyncStorage.getItem('userToken')
    if (!token) {
      throw new Error('No authentication token')
    }

    console.log('Sending request to:', `${this.baseURL}/chat/${chatId}/stream`)
    console.log('Request data:', data)
    
    const response = await fetch(`${this.baseURL}/chat/${chatId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(data)
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Response error text:', errorText)
      yield { type: 'error', data: { message: `HTTP error! status: ${response.status} - ${errorText}` } }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', data: { message: 'No response stream available' } }
      return
    }

    let buffer = ''
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        buffer += chunk
        const lines = buffer.split('\n')
        
        // Keep the last line in buffer (might be incomplete)
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data) continue
            
            try {
              const eventData = JSON.parse(data)
              console.log('Received event:', eventData.type)
              yield eventData
            } catch (error) {
              console.error('Error parsing SSE data:', error, 'Line:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      yield { type: 'error', data: { message: error.message || 'Streaming failed' } }
    } finally {
      reader.releaseLock()
    }
  }

  // Utility methods
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('userToken')
    await AsyncStorage.removeItem('userData')
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('userToken')
    return !!token
  }
}

export const apiService = new ApiService()