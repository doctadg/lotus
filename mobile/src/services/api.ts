import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ApiResponse, Chat, Message, User, SendMessageRequest, CreateChatRequest } from '../types'

class ApiService {
  private api: AxiosInstance
  private baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://lotus-backend.vercel.app/api' // Deployed backend URL

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

  // Real-time streaming message support with event-source-polyfill for React Native
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

    console.log('📡 [API] Starting SSE stream')
    console.log('📡 [API] URL:', `${this.baseURL}/chat/${chatId}/stream`)
    console.log('📡 [API] Request data:', data)
    console.log('📡 [API] Deep research mode:', data.deepResearchMode)
    
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
      console.log('📡 [API] XHR state changed:', xhr.readyState, 'Status:', xhr.status)
      
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        // Get new data since last process
        const currentResponse = xhr.responseText
        const newData = currentResponse.substring(lastProcessedIndex)
        lastProcessedIndex = currentResponse.length
        
        if (newData.length > 0) {
          console.log('📡 [API] New data received:', newData.length, 'bytes')
        }
        
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
                console.log('📱 [MOBILE] SSE Event received:', {
                  type: eventData.type,
                  hasData: !!eventData.data,
                  dataContent: eventData.data?.content ? eventData.data.content.substring(0, 50) + '...' : 'no content',
                  metadata: eventData.data?.metadata
                })
                
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
    console.log('📡 [API] Sending XHR request with body:', JSON.stringify(data))
    xhr.send(JSON.stringify(data))
    console.log('📡 [API] XHR request sent')
    
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