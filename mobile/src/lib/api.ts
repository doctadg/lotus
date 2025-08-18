import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ApiResponse, Chat, Message, User, SendMessageRequest, CreateChatRequest } from '../types'
import Constants from 'expo-constants'

class ApiService {
  private api: AxiosInstance
  private baseURL = Constants.expoConfig?.extra?.apiUrl || 'https://lotus-backend.vercel.app/api'

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
        const tokenParts = token.split('.')
        console.log('API Request:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenStructure: `${tokenParts.length} parts`,
          tokenPreview: token.substring(0, 20) + '...'
        })
        config.headers.Authorization = `Bearer ${token}`
      } else {
        console.log('API Request without token:', config.url)
      }
      return config
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response:', {
          url: response.config.url,
          status: response.status,
          success: response.data?.success
        })
        return response
      },
      (error) => {
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      email,
      password
    })
    
    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data
      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('userData', JSON.stringify(user))
      return { user, token }
    }
    
    throw new Error(response.data.error || 'Login failed')
  }

  async register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    const response = await this.api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', {
      email,
      password,
      name
    })
    
    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data
      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('userData', JSON.stringify(user))
      return { user, token }
    }
    
    throw new Error(response.data.error || 'Registration failed')
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

  // Real-time streaming message support
  async *sendMessageStream(chatId: string, data: SendMessageRequest): AsyncGenerator<{
    type: 'user_message' | 'ai_typing' | 'ai_chunk' | 'ai_message_complete' | 'complete' | 'error' | 
          'agent_thought' | 'tool_call' | 'tool_result' | 'agent_processing' | 'ai_tool_use' |
          'thinking_stream' | 'memory_access' | 'context_analysis' | 'search_planning' | 
          'search_start' | 'search_progress' | 'search_result_analysis' | 'context_synthesis' | 'response_planning'
    data: any
  }, void, unknown> {
    const token = await AsyncStorage.getItem('userToken')
    if (!token) {
      throw new Error('No authentication token')
    }

    // Create an async generator that properly handles streaming
    const eventQueue: any[] = []
    let resolveNext: ((value: any) => void) | null = null
    let rejectNext: ((error: any) => void) | null = null
    let done = false
    let hasErrored = false
    
    // Start the request
    const xhr = new XMLHttpRequest()
    let buffer = ''
    let lastProcessedIndex = 0
    
    xhr.open('POST', `${this.baseURL}/chat/${chatId}/stream`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Accept', 'text/event-stream')
    xhr.setRequestHeader('Cache-Control', 'no-cache')
    
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        // Get new data since last process
        const currentResponse = xhr.responseText
        const newData = currentResponse.substring(lastProcessedIndex)
        lastProcessedIndex = currentResponse.length
        
        // Add new data to buffer
        buffer += newData
        
        // Process complete lines
        const lines = buffer.split('\n')
        // Keep the last line in buffer if it's incomplete
        buffer = lines[lines.length - 1]
        
        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i]
          if (line.trim().startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data) {
              try {
                const eventData = JSON.parse(data)
                if (resolveNext) {
                  resolveNext(eventData)
                  resolveNext = null
                } else {
                  eventQueue.push(eventData)
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error, 'Line:', line)
              }
            }
          }
        }
        
        // Handle completion
        if (xhr.readyState === 4) {
          done = true
          if (xhr.status !== 200) {
            hasErrored = true
            const errorEvent = {
              type: 'error',
              data: { message: `HTTP error! status: ${xhr.status} - ${xhr.responseText}` }
            }
            if (resolveNext) {
              resolveNext(errorEvent)
              resolveNext = null
            } else {
              eventQueue.push(errorEvent)
            }
          }
          
          // Process any remaining buffer
          if (buffer.trim().startsWith('data: ')) {
            const data = buffer.slice(6).trim()
            if (data) {
              try {
                const eventData = JSON.parse(data)
                if (resolveNext) {
                  resolveNext(eventData)
                  resolveNext = null
                } else {
                  eventQueue.push(eventData)
                }
              } catch (error) {
                console.error('Error parsing final SSE data:', error)
              }
            }
          }
          
          // Resolve any waiting promise
          if (resolveNext) {
            resolveNext(null)
            resolveNext = null
          }
        }
      }
    }
    
    xhr.onerror = () => {
      done = true
      hasErrored = true
      const errorEvent = {
        type: 'error',
        data: { message: 'Network error' }
      }
      if (resolveNext) {
        resolveNext(errorEvent)
        resolveNext = null
      } else {
        eventQueue.push(errorEvent)
      }
    }
    
    // Send the request
    xhr.send(JSON.stringify(data))
    
    // Yield events as they arrive
    while (!done || eventQueue.length > 0) {
      if (eventQueue.length > 0) {
        const event = eventQueue.shift()
        if (event) {
          yield event
          
          // Only continue if not an error or complete event
          if (event.type === 'error' || event.type === 'complete') {
            break
          }
        }
      } else if (!done) {
        // Wait for next event
        const nextEvent = await new Promise<any>((resolve, reject) => {
          resolveNext = resolve
          rejectNext = reject
        })
        
        if (nextEvent) {
          yield nextEvent
          
          // Only continue if not an error or complete event  
          if (nextEvent.type === 'error' || nextEvent.type === 'complete') {
            break
          }
        }
      }
    }
  }

  // Context methods
  async getUserContext(): Promise<any> {
    const response = await this.api.get<ApiResponse<{ context: any }>>('/user/context')
    
    if (response.data.success) {
      return response.data.data?.context
    }
    
    throw new Error(response.data.error || 'Failed to get user context')
  }

  async updateUserContext(contextData: {
    communicationStyle?: string
    topicsOfInterest?: string[]
    expertiseAreas?: string[]
    preferredResponseStyle?: string
    timezone?: string
  }): Promise<void> {
    const response = await this.api.post<ApiResponse>('/user/context', contextData)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update user context')
    }
  }

  // Questions methods
  async getPersonalizedQuestions(): Promise<{ questions: any[]; isPersonalized: boolean; source: string }> {
    const response = await this.api.get<ApiResponse<{ questions: any[]; isPersonalized: boolean; source: string }>>('/user/questions')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to get personalized questions')
  }

  // Memory methods
  async getUserMemories(query?: string, type?: string, limit: number = 20): Promise<{ memories: any[] }> {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (type) params.append('type', type)
    params.append('limit', limit.toString())
    
    const response = await this.api.get<ApiResponse<{ memories: any[] }>>(`/user/memories?${params}`)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.error || 'Failed to get user memories')
  }

  async createUserMemory(memoryData: {
    type: 'preference' | 'fact' | 'context' | 'skill'
    category?: string
    key: string
    value: string
    confidence?: number
  }): Promise<void> {
    const response = await this.api.post<ApiResponse>('/user/memories', memoryData)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create memory')
    }
  }

  async deleteUserMemory(memoryId?: string, key?: string): Promise<void> {
    const params = new URLSearchParams()
    if (memoryId) params.append('id', memoryId)
    if (key) params.append('key', key)
    
    const response = await this.api.delete<ApiResponse>(`/user/memories?${params}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete memory')
    }
  }

  // Subscription methods
  async getUserSubscription(): Promise<any> {
    const response = await this.api.get<ApiResponse<{ subscription: any }>>('/user/subscription')
    
    if (response.data.success && response.data.data) {
      return response.data.data.subscription
    }
    
    throw new Error(response.data.error || 'Failed to get subscription')
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
