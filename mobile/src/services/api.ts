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

  // Streaming message support using Server-Sent Events
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
    console.log('Response body available:', !!response.body)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    // React Native has issues with streaming responses, so we'll read the entire response
    console.log('Reading entire response...')
    const responseText = await response.text()
    console.log('Full response received, length:', responseText.length)
    console.log('Response preview:', responseText.substring(0, 200))
    
    const lines = responseText.split('\n')
    const events: any[] = []
    
    // Parse all events first
    for (const line of lines) {
      if (line.trim().startsWith('data: ')) {
        try {
          const eventData = JSON.parse(line.slice(6))
          events.push(eventData)
        } catch (error) {
          console.error('Error parsing SSE data:', error, 'Line:', line)
        }
      }
    }
    
    // Yield events with appropriate delays to simulate streaming
    for (const eventData of events) {
      console.log('Yielding event:', eventData.type)
      
      if (eventData.type === 'ai_chunk') {
        // Break down large AI chunks into smaller pieces for better streaming effect
        const content = eventData.data.content || ''
        const words = content.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          const chunk = words.slice(0, i + 1).join(' ')
          yield {
            type: 'ai_chunk',
            data: { content: chunk }
          }
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      } else {
        yield eventData
        
        // Add delays between events to simulate streaming
        if (eventData.type === 'user_message') {
          await new Promise(resolve => setTimeout(resolve, 100))
        } else if (eventData.type === 'ai_typing') {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
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