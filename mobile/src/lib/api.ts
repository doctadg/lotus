import axios, { AxiosInstance } from 'axios'
import { ApiResponse, Chat, Message, User, SendMessageRequest, CreateChatRequest } from '../types'
import Constants from 'expo-constants'

class ApiService {
  private api: AxiosInstance
  private baseURL = Constants.expoConfig?.extra?.apiUrl || 'https://mror.app/api'
  private tokenProvider: (() => Promise<string | null>) | null = null

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
      try {
        if (this.tokenProvider) {
          const token = await this.tokenProvider()
          if (token) {
            if (__DEV__) {
              console.log('API Request:', {
                url: config.url,
                method: config.method,
                hasToken: true
              })
            }
            config.headers.Authorization = `Bearer ${token}`
          } else {
            if (__DEV__) console.log('API Request: token provider returned null')
          }
        } else {
          if (__DEV__) console.log('API Request: no token provider set')
        }
      } catch (error) {
        if (__DEV__) console.error('Error getting token for API request:', error)
      }
      
      return config
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            success: response.data?.success
          })
        }
        return response
      },
      (error) => {
        if (__DEV__) {
          console.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          })
        }
        return Promise.reject(error)
      }
    )
  }

  async getSubscription(): Promise<{ planType: string; status: string | null; currentPeriodEnd: string | null }> {
    const res = await this.api.get<ApiResponse<{ subscription: any }>>('/user/subscription')
    const sub = res.data?.data?.subscription
    if (!sub) throw new Error('Failed to load subscription')
    return {
      planType: String(sub.planType || 'free'),
      status: sub.status || null,
      currentPeriodEnd: sub.currentPeriodEnd || null,
    }
  }

  // Billing
  async createCheckout(): Promise<{ url: string }> {
    const res = await this.api.post<ApiResponse<{ sessionId?: string; url?: string }>>('/stripe/checkout', {})
    const url = res.data?.data?.url
    if (!url) throw new Error('Failed to start checkout')
    return { url }
  }

  async createBillingPortal(): Promise<{ url: string }> {
    const res = await this.api.post<ApiResponse<{ url: string }>>('/stripe/portal', {})
    const url = res.data?.data?.url
    if (!url) throw new Error('Failed to open billing portal')
    return { url }
  }

  // Set token provider function
  setTokenProvider(tokenProvider: () => Promise<string | null>) {
    this.tokenProvider = tokenProvider
  }

  // Remove token provider
  removeTokenProvider() {
    this.tokenProvider = null
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
    const response = await this.api.get<ApiResponse<{ messages: Message[]; pagination: any }>>(`/chat/${chatId}/messages`)

    if (response.data.success && response.data.data) {
      // Extract messages array from the paginated response
      return response.data.data.messages || []
    }

    throw new Error(response.data.error || 'Failed to get messages')
  }

  async sendMessage(chatId: string, data: SendMessageRequest): Promise<{ userMessage: Message; aiMessage: Message }> {
    const response = await this.api.post<ApiResponse<{ userMessage: Message; assistantMessage: Message }>>(`/chat/${chatId}/messages`, data)
    
    if (response.data.success && response.data.data) {
      const { userMessage, assistantMessage } = response.data.data
      return { userMessage, aiMessage: assistantMessage }
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
    let token: string | null = null
    
    try {
      if (this.tokenProvider) {
        token = await this.tokenProvider()
      }
    } catch (error) {
      console.error('Error getting token for streaming:', error)
    }
    
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
            const payload = line.slice(6).trim()
            if (!payload) continue

            // Handle OpenAI-style terminator
            if (payload === '[DONE]' || payload === '[done]') {
              const doneEvent = { type: 'complete', data: null }
              if (resolveNext) { resolveNext(doneEvent); resolveNext = null } else { eventQueue.push(doneEvent) }
              continue
            }

            let parsed: any
            try {
              parsed = JSON.parse(payload)
            } catch (error) {
              if (__DEV__) console.error('Error parsing SSE data:', error, 'Line:', line)
              continue
            }

            // Normalize a variety of possible streaming payloads into our event shape
            const normalize = (raw: any) => {
              // If already in our expected shape
              if (raw && typeof raw.type === 'string') return raw

              // OpenAI chat.completions.stream style
              const oaChoice = raw?.choices?.[0]
              const deltaText = oaChoice?.delta?.content || oaChoice?.delta?.text
              if (typeof deltaText === 'string' && deltaText.length > 0) {
                return { type: 'ai_chunk', data: { content: deltaText } }
              }
              if (oaChoice?.finish_reason) {
                return { type: 'complete', data: { reason: oaChoice.finish_reason } }
              }

              // Simple message envelope
              if (typeof raw?.content === 'string') {
                return { type: 'ai_chunk', data: { content: raw.content } }
              }

              // Image payloads
              const imageUrl = raw?.image_url || raw?.url || raw?.data?.image_url
              if (imageUrl) {
                return { type: 'ai_image', data: { url: imageUrl, alt: raw?.alt } }
              }

              // Tool/function call payloads
              if (raw?.tool_call || raw?.function_call) {
                return { type: 'tool_call', data: raw }
              }

              return { type: 'unknown', data: raw }
            }

            const eventData = normalize(parsed)
            if (resolveNext) {
              resolveNext(eventData)
              resolveNext = null
            } else {
              eventQueue.push(eventData)
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
            const payload = buffer.slice(6).trim()
            if (payload === '[DONE]' || payload === '[done]') {
              const doneEvent = { type: 'complete', data: null }
              if (resolveNext) { resolveNext(doneEvent); resolveNext = null } else { eventQueue.push(doneEvent) }
            } else if (payload) {
              try {
                const parsed = JSON.parse(payload)
                const eventData = { type: 'unknown', data: parsed }
                if (resolveNext) { resolveNext(eventData); resolveNext = null } else { eventQueue.push(eventData) }
              } catch (error) {
                if (__DEV__) console.error('Error parsing final SSE data:', error)
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

  // Upload a file via multipart/form-data, returns public URL
  async uploadFile(file: { uri: string; name: string; type: string }): Promise<{ url: string; contentType: string; name: string }> {
    const uploadUrl = `${this.baseURL}/tools/upload`
    // Build FormData for React Native
    const form = new FormData()
    // @ts-ignore - React Native's FormData accepts this shape
    form.append('file', { uri: file.uri, name: file.name, type: file.type })

    // Get token if available
    let token: string | null = null
    try {
      if (this.tokenProvider) token = await this.tokenProvider()
    } catch {}

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type so RN sets proper boundary
        Accept: 'application/json'
      },
      body: form as any
    })

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`)
    }
    const data = await res.json()
    return { url: data.url, contentType: data.contentType, name: data.name }
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

  /**
   * Sync RevenueCat subscription status with backend
   * Call this after purchases, restores, or on app startup
   */
  async syncRevenueCatSubscription(data: {
    isPro: boolean
    customerInfo: {
      originalAppUserId: string
      activeSubscriptions: string[]
      entitlements: string[]
    } | null
  }): Promise<void> {
    try {
      if (__DEV__) {
        console.log('📤 Syncing RevenueCat subscription with backend:', data)
      }

      const response = await this.api.post<ApiResponse>('/revenuecat/sync', data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to sync subscription')
      }

      if (__DEV__) {
        console.log('✅ Subscription synced successfully')
      }
    } catch (error) {
      console.error('❌ Failed to sync subscription with backend:', error)
      // Don't throw - sync failures shouldn't block the app
      // The webhook will eventually sync it
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
