import { config } from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { DynamicTool, DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

// Shared tool schemas (module-level so both standard and streaming agents can use them)
const VISION_INPUT_SCHEMA = z.union([
  z.object({ prompt: z.string().optional(), imageUrl: z.string().url().optional(), imageBase64: z.string().optional() }),
  z.object({ input: z.object({ prompt: z.string().optional(), imageUrl: z.string().url().optional(), imageBase64: z.string().optional() }) })
])

const DOC_INPUT_SCHEMA = z.union([
  z.object({ url: z.string().url(), instructions: z.string().optional() }),
  z.object({ input: z.object({ url: z.string().url(), instructions: z.string().optional() }) })
])

const IMAGE_GEN_SCHEMA = z.union([
  z.object({ prompt: z.string() }),
  z.object({ input: z.object({ prompt: z.string() }) }),
  z.object({})
])

const IMAGE_EDIT_SCHEMA = z.union([
  z.object({ prompt: z.string(), imageUrl: z.string().url().optional(), imageBase64: z.string().optional() }),
  z.object({ input: z.object({ prompt: z.string(), imageUrl: z.string().url().optional(), imageBase64: z.string().optional() }) })
])
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { maybeTraceable, isTracingEnabled } from './tracing'
import { Client } from 'langsmith'
import agentConfig from '../../config/agent-prompts.json'
import { searchHiveService } from './searchhive'
import { getOpenRouterClient, OPENROUTER_IMAGE_MODEL } from './openrouter'
import { parseDataUrl, extensionForMime } from './dataurl'
import { uploadToBlob } from './blob'
import { parseFromUrl } from './parse-doc'
import { intelligentSearch } from './intelligent-search'
import { adaptiveMemory } from './adaptive-memory'
import { getRelevantMemories, processMessageForMemories } from './memory-extractor'
import { getUserWithMemories } from './auth'
import { StreamingCallbackHandler, StreamingEvent } from './streaming-callback'
import { responseCache } from './response-cache'

config({ path: path.join(process.cwd(), '.env') })

// Optional LangSmith client (only used when tracing is enabled)
const langsmithClient = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
  apiKey: process.env.LANGSMITH_API_KEY,
})

// Helper function to add metadata to traces
const addTraceMetadata = (metadata: Record<string, any>) => {
  return {
    tags: ["lotus", "chat-agent"],
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      service: "chat-backend"
    }
  }
}

// Intelligent web search tool with query classification and caching
const createWebSearchTool = (eventCallback?: (event: any) => void) => new DynamicTool({
  name: 'web_search',
  description: 'Intelligently search the web with automatic query analysis, caching, and optimized search strategies. Uses ML-driven query classification to determine optimal search depth and sources needed.',
  func: maybeTraceable(async (query: string) => {
    try {
      console.log(`🧠 [TRACE] Intelligent Web Search called with query: "${query}"`)
      const startTime = Date.now()
      
      // Use intelligent search system
      const searchResult = await intelligentSearch.search(query, {
        progressCallback: eventCallback
      })
      
      const duration = Date.now() - startTime
      
      console.log(`✅ [TRACE] Intelligent Search completed in ${duration}ms`, {
        fromCache: searchResult.fromCache,
        searchExecuted: searchResult.searchStrategy.executed,
        intensity: searchResult.searchStrategy.analysis.searchIntensity,
        sources: searchResult.searchStrategy.actualSources,
        resultLength: searchResult.content.length
      })
      
      return searchResult.content
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [TRACE] Intelligent Web Search failed: ${errorMessage}`)
      return `Error performing intelligent web search: ${errorMessage}`
    }
  }, { 
    name: "intelligent_web_search_tool",
    ...addTraceMetadata({ tool_type: "intelligent_search", search_type: "adaptive" })
  })
})

const webSearchTool = createWebSearchTool()

// Progressive comprehensive research tool with quality assessment
const createComprehensiveSearchTool = (eventCallback?: (event: any) => void) => new DynamicTool({
  name: 'comprehensive_search',
  description: 'Perform progressive comprehensive research with quality assessment. Starts with moderate search and escalates to deep research if needed. Automatically determines optimal search strategy.',
  func: maybeTraceable(async (topic: string) => {
    try {
      console.log(`🔬 [TRACE] Progressive Search Tool called with topic: "${topic}"`)
      const startTime = Date.now()
      
      // Use progressive search strategy
      const searchResult = await intelligentSearch.progressiveSearch(topic, {
        progressCallback: eventCallback
      }, 0.7) // Quality threshold of 70%
      
      const duration = Date.now() - startTime
      
      console.log(`✅ [TRACE] Progressive Search completed in ${duration}ms`, {
        intensity: searchResult.searchStrategy.analysis.searchIntensity,
        sources: searchResult.searchStrategy.actualSources,
        resultLength: searchResult.content.length
      })
      
      return searchResult.content
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [TRACE] Progressive Search failed: ${errorMessage}`)
      return `Error performing progressive search: ${errorMessage}`
    }
  }, { 
    name: "progressive_search_tool",
    ...addTraceMetadata({ tool_type: "intelligent_search", search_type: "progressive" })
  })
})

const comprehensiveSearchTool = createComprehensiveSearchTool()

class AIAgent {
  private llm: ChatOpenAI
  private streamingLLM: ChatOpenAI
  private agent: AgentExecutor | null = null
  private streamingAgent: AgentExecutor | null = null
  private tools = [webSearchTool, comprehensiveSearchTool]
  private initialized = false
  private initPromise: Promise<void> | null = null

  constructor() {
    
    const apiKey = process.env.OPENROUTER_API_KEY
    
    console.log('OpenRouter API Key check:', {
      keyExists: !!apiKey,
      keyPrefix: apiKey?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV
    })
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable.')
    }


    // Configure ChatOpenAI for OpenRouter using official pattern
    const modelName = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b';

    this.llm = new ChatOpenAI({
      model: modelName,
      temperature: agentConfig.modelConfig.temperature,
      maxTokens: agentConfig.modelConfig.maxTokens,
      apiKey: apiKey,
      maxRetries: 3,
      timeout: 30000,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
          'X-Title': 'AI Chat App',
        },
      },
    })

    this.streamingLLM = new ChatOpenAI({
      model: modelName,
      temperature: agentConfig.modelConfig.temperature,
      maxTokens: agentConfig.modelConfig.maxTokens,
      streaming: true,
      apiKey: apiKey,
      maxRetries: 3,
      timeout: 30000,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
          'X-Title': 'AI Chat App',
        },
      },
    })

    // Defer initialization until needed
    // this.initializeAgent()
  }

  // Helper: clamp long strings to avoid context overflows
  private truncate(input: string, max: number): string {
    if (!input) return ''
    return input.length > max ? input.slice(0, max) + '…' : input
  }

  // Helper: trim chat history message content
  private trimHistory(
    chatHistory: Array<{ role: string; content: string }>,
    maxItems: number,
    maxPerItemChars: number
  ) {
    return chatHistory
      .slice(-maxItems)
      .map(msg => {
        const content = this.truncate(String(msg.content || ''), maxPerItemChars)
        if (msg.role === 'user') return ['human', content]
        if (msg.role === 'assistant') return ['ai', content]
        return ['system', content]
      })
  }


  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.initializeAgent()
    await this.initPromise
    this.initialized = true
  }

  private async initializeAgent() {
    console.log('🚀 [AGENT] Initializing optimized agent...')
    
    // Lazy load multimodal tools only when needed
    const coreTools = [webSearchTool, comprehensiveSearchTool]
    
    // For faster initialization, start with core tools only
    this.tools = coreTools
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', agentConfig.systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ])

    const agent = await createToolCallingAgent({
      llm: this.llm,
      tools: this.tools,
      prompt
    })

    this.agent = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: false, // Disabled for speed
      maxIterations: Math.min(Number(process.env.AGENT_MAX_ITERATIONS || 6), 4) // Reduced max iterations
    })

    // Create streaming agent with callback handler
    const streamingAgent = await createToolCallingAgent({
      llm: this.streamingLLM,
      tools: this.tools,
      prompt
    })

    this.streamingAgent = new AgentExecutor({
      agent: streamingAgent,
      tools: this.tools,
      verbose: false, // Disabled for speed
      returnIntermediateSteps: true,
      maxIterations: Math.min(Number(process.env.AGENT_MAX_ITERATIONS || 6), 4) // Reduced max iterations
    })
  }

  // Fast-path detection for simple queries - expanded for more coverage
  private isSimpleQuery(query: string): { isSimple: boolean; type: string; response?: string } {
    const trimmed = query.trim().toLowerCase()

    // Greetings - expanded patterns
    if (/^(hi|hello|hey|yo|sup|howdy|greetings?)[\.!?\s]*$/i.test(trimmed)) {
      return { isSimple: true, type: 'greeting', response: 'Hello! How can I help you today?' }
    }
    if (/^(good\s+(morning|afternoon|evening|day|night))[\.!?\s]*$/i.test(trimmed)) {
      return { isSimple: true, type: 'greeting', response: 'Good day! What can I assist you with?' }
    }
    if (/^(what'?s\s+up|whats?\s+up|wassup|wazzup)[\.!?\s]*$/i.test(trimmed)) {
      return { isSimple: true, type: 'greeting', response: 'Hey! What can I help you with?' }
    }
    if (/^(how'?s\s+it\s+going|how\s+are\s+you)[\.!?\s]*$/i.test(trimmed)) {
      return { isSimple: true, type: 'greeting', response: "I'm doing well, thanks for asking! How can I assist you?" }
    }

    // Simple math - expanded patterns
    if (/^[\d\s\+\-\*\/\(\)\^\%]+$/.test(trimmed)) {
      try {
        // Safe math evaluation for simple expressions
        const result = Function('"use strict"; return (' + trimmed.replace(/\^/g, '**').replace(/\%/g, '/100') + ')')();
        return { isSimple: true, type: 'math', response: String(result) }
      } catch {
        return { isSimple: false, type: 'unknown' }
      }
    }

    // Simple factual questions that don't need search/memory
    if (/^(what|who|when|where|why|how)\s+(is|are|was|were)\s+\w+(\s+\w+)?[\.?\s]*$/i.test(trimmed) && trimmed.length < 40) {
      return { isSimple: false, type: 'factual' }
    }

    // Simple requests for basic information
    if (/^(tell|give|show)\s+me\s+(about|more)\s+/i.test(trimmed) && trimmed.length < 50) {
      return { isSimple: false, type: 'information' }
    }

    // Time/date questions
    if (/\b(time|date|day|month|year|now|current)\b/i.test(trimmed) && trimmed.length < 30) {
      return { isSimple: false, type: 'temporal' }
    }

    return { isSimple: false, type: 'unknown' }
  }

  async processMessage(
    message: string,
    chatHistory: Array<{ role: string; content: string }> = [],
    deepResearchMode = false,
    userId?: string
  ): Promise<{
    content: string
    metadata?: Record<string, unknown>
  }> {
    // Check response cache first for instant responses
    const cachedResponse = responseCache.get(message)
    if (cachedResponse) {
      console.log(`⚡ [AGENT] Cache hit for query: ${message.substring(0, 30)}...`)
      return {
        content: cachedResponse.response,
        metadata: {
          cache_hit: true,
          query_type: cachedResponse.queryType,
          execution_time_ms: 0,
          hit_count: cachedResponse.hitCount
        }
      }
    }

    // Check for fast-path simple queries
    const simpleCheck = this.isSimpleQuery(message)
    if (simpleCheck.isSimple && simpleCheck.response) {
      console.log(`⚡ [AGENT] Fast-path response for ${simpleCheck.type} query`)
      // Cache the simple response
      responseCache.set(message, simpleCheck.response, simpleCheck.type)
      return {
        content: simpleCheck.response,
        metadata: {
          fast_path: true,
          query_type: simpleCheck.type,
          execution_time_ms: 0
        }
      }
    }

    // Ensure agent is initialized for non-simple queries
    await this.ensureInitialized()

    if (!this.agent) {
      throw new Error('Agent initialization failed')
    }

    try {
      // Optimized: Skip complex parallel operations for simple queries
      let userMemoriesContext = ''
      let memoryResult: any = null
      
      // Skip memory retrieval for simple/fast queries - expanded conditions
      const skipMemory = simpleCheck.type === 'greeting' || simpleCheck.type === 'math' ||
                         simpleCheck.type === 'factual' || simpleCheck.type === 'temporal' ||
                         simpleCheck.type === 'information' || !userId

      if (skipMemory && userId) {
        console.log(`⚡ [TRACE] Skipping memory retrieval for ${simpleCheck.type} query`)
      }

      // Only retrieve memories for complex queries that need personalization - more aggressive skipping
      if (userId && !skipMemory) {
        const memoryStartTime = Date.now()
        
        try {
          console.log(`🧠 [TRACE] Starting selective memory retrieval for user: ${userId}`)
          
          // Quick check: if message is very short, skip memories
          if (message.trim().length < 20) {
            console.log(`⚡ [TRACE] Skipping memories for very short message`)
          } else {
            memoryResult = await adaptiveMemory.retrieveAdaptiveMemories(userId, message)
            
            console.log(`📚 [TRACE] Adaptive memory retrieval completed:`, {
              memoryCount: memoryResult.memories.length,
              strategy: memoryResult.strategy.reasoning,
              retrievalTime: memoryResult.performance.retrievalTime,
              totalAvailable: memoryResult.metadata.totalAvailableMemories
            })
            
            // Only add personalization context if we have highly relevant memories
            if (memoryResult.memories.length > 0) {
              const highlyRelevantMemories = memoryResult.memories.filter((memory: any) => 
                (memory.relevanceScore || 0) > 0.85 && 
                memory.value && 
                !memory.value.includes('User:') && 
                !memory.value.includes('Assistant:') &&
                !memory.value.includes('\nUser:') &&
                !memory.value.includes('\nAssistant:')
              ).slice(0, 2) // Max 2 memories for speed
              
              if (highlyRelevantMemories.length > 0) {
                userMemoriesContext = '\n\n=== USER CONTEXT ===\n'
                userMemoriesContext += `Relevant Information:\n`
                highlyRelevantMemories.forEach((memory: any) => {
                  userMemoriesContext += `- ${memory.key}: ${memory.value}\n`
                })
                userMemoriesContext += '\nUse this context naturally where relevant.\n=== END CONTEXT ===\n\n'
              } else if (memoryResult.context?.communicationStyle) {
                userMemoriesContext = `\n[User prefers ${memoryResult.context.communicationStyle} communication]\n`
              }
            }
          }
        } catch (error) {
          console.error('❌ [TRACE] Memory retrieval error (continuing):', error)
          // Continue without memories rather than failing
        }
        
        const memoryDuration = Date.now() - memoryStartTime
        console.log(`⚡ [TRACE] Memory operations completed in ${memoryDuration}ms`)
      }

      const formattedHistory = this.trimHistory(chatHistory, agentConfig.conversationSettings.maxHistoryLength, 2000)

      // Add current date and time to every query
      const now = new Date()
      const currentDateTime = now.toISOString()
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const localDateTime = now.toLocaleString('en-US', {
        timeZone: userTimezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      })

      // Safety caps for context length
      const MAX_MEMORY_CONTEXT = 4000
      const MAX_MEMORY_ITEM = 500
      if (userMemoriesContext.includes('Relevant Information:')) {
        // Re-trim memory context defensively
        const lines = userMemoriesContext.split('\n')
        let acc = ''
        for (const line of lines) {
          const toAdd = this.truncate(line, MAX_MEMORY_ITEM)
          if ((acc + toAdd + '\n').length > MAX_MEMORY_CONTEXT) break
          acc += toAdd + '\n'
        }
        userMemoriesContext = acc
      } else {
        userMemoriesContext = this.truncate(userMemoriesContext, MAX_MEMORY_CONTEXT)
      }

      const safeMessage = this.truncate(String(message || ''), 4000)
      let processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})]${userMemoriesContext}${safeMessage}`
      
      if (deepResearchMode) {
        processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})]${userMemoriesContext}[COMPREHENSIVE RESEARCH MODE] Please provide a thorough, well-researched response using the comprehensive_search tool if needed: ${message}`
      }

      console.log(`🤖 [TRACE] Invoking agent with ${formattedHistory.length} history messages`)
      const agentStartTime = Date.now()
      
      const result = await this.agent!.invoke({
        input: processedMessage,
        chat_history: formattedHistory
      })

      const agentDuration = Date.now() - agentStartTime
      console.log(`⚡ [TRACE] Agent execution completed in ${agentDuration}ms`)
      console.log(`🔧 [TRACE] Tools used: ${result.intermediateSteps?.length > 0 ? 'Yes' : 'No'} (${result.intermediateSteps?.length || 0} steps)`)

      const response = {
        content: result.output,
        metadata: {
          model: process.env.OPENROUTER_MODEL,
          tools_used: result.intermediateSteps?.length > 0 ? true : false,
          user_memories_used: userMemoriesContext.length > 0 ? true : false,
          execution_time_ms: agentDuration,
          memory_count: memoryResult?.memories?.length || 0,
          relevant_memories_count: userMemoriesContext.length > 0 ? "yes" : "no"
        }
      }

      // Cache successful responses for future use
      if (result.output && result.output.length > 10 && result.output.length < 1000 && 
          !result.output.includes('error') && !result.output.includes('apologize')) {
        responseCache.set(message, result.output, simpleCheck.type)
      }

      // Process message for memories in the background if userId is provided
      if (userId) {
        console.log(`💾 [TRACE] Starting background memory processing for user: ${userId}`)
        processMessageForMemories(userId, message, result.output)
      }

      return response
    } catch (error) {
      console.error('Agent processing error:', error)
      return {
        content: 'I apologize, but I encountered an error while processing your message. Please try again.',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  async *streamMessage(
    message: string,
    chatHistory: Array<{ role: string; content: string }> = [],
    userId?: string,
    deepResearchMode: boolean = false
  ): AsyncGenerator<{ type: string; content?: string; metadata?: any }, void, unknown> {
    try {
      console.log('🤖 [AGENT] Starting streamMessage for query:', message.substring(0, 100))

      // Check response cache first for instant streaming
      const cachedResponse = responseCache.get(message)
      if (cachedResponse) {
        console.log(`⚡ [AGENT] Cache hit stream for query: ${message.substring(0, 30)}...`)
        yield {
          type: 'content',
          content: cachedResponse.response,
          metadata: {
            cache_hit: true,
            query_type: cachedResponse.queryType,
            hit_count: cachedResponse.hitCount
          }
        }
        yield {
          type: 'complete',
          metadata: {
            cache_hit: true,
            query_type: cachedResponse.queryType,
            execution_time_ms: 0
          }
        }
        return
      }

      // Check for fast-path simple queries
      const simpleCheck = this.isSimpleQuery(message)
      if (simpleCheck.isSimple && simpleCheck.response) {
        console.log(`⚡ [AGENT] Fast-path streaming response for ${simpleCheck.type} query`)
        // Cache the simple response
        responseCache.set(message, simpleCheck.response, simpleCheck.type)
        
        // Stream the response immediately without any processing
        yield {
          type: 'content',
          content: simpleCheck.response,
          metadata: {
            fast_path: true,
            query_type: simpleCheck.type
          }
        }
        yield {
          type: 'complete',
          metadata: {
            fast_path: true,
            query_type: simpleCheck.type,
            execution_time_ms: 0
          }
        }
        return
      }

      // Initial thinking stream for non-simple queries
      yield {
        type: 'thinking_stream',
        content: 'Analyzing your query...',
        metadata: { phase: 'initialization', timestamp: Date.now() }
      }
      
      // Skip memory retrieval for simple/fast queries
      const skipMemory = simpleCheck.type === 'greeting' || simpleCheck.type === 'math' ||
                         simpleCheck.type === 'factual' || !userId

      // Get user memories if userId is provided
      let userMemoriesContext = ''
      const userProfile: any = null

      if (userId && !skipMemory) {
        yield {
          type: 'thinking_stream',
          content: 'Accessing your personal context and memories...',
          metadata: { phase: 'memory_access', timestamp: Date.now() }
        }
        
        try {
          console.log(`🧠 [TRACE] Starting adaptive memory retrieval for user: ${userId}`)
          const memoryStartTime = Date.now()
          
          yield {
            type: 'memory_access',
            content: 'Analyzing query and retrieving personalized context...',
            metadata: { phase: 'adaptive_searching', userId, timestamp: Date.now() }
          }
          
          // Use adaptive memory retrieval
          const memoryResult = await adaptiveMemory.retrieveAdaptiveMemories(userId, message)
          console.log(`📚 [TRACE] Adaptive memory completed:`, {
            memoryCount: memoryResult.memories.length,
            strategy: memoryResult.strategy.reasoning,
            totalAvailable: memoryResult.metadata.totalAvailableMemories
          })
          
          const memoryDuration = Date.now() - memoryStartTime
          
          yield {
            type: 'memory_access',
            content: `Applied ${memoryResult.strategy.reasoning.toLowerCase()} - found ${memoryResult.memories.length} relevant insights`,
            metadata: {
              phase: 'complete',
              relevantCount: memoryResult.memories.length,
              totalMemories: memoryResult.metadata.totalAvailableMemories,
              strategy: memoryResult.strategy.reasoning,
              duration: memoryDuration,
              timestamp: Date.now()
            }
          }
          
          // Only add personalization context if we have meaningful memories
          if (memoryResult.memories.length > 0) {
            userMemoriesContext = '\n\n=== USER CONTEXT ===\n'
            
            yield {
              type: 'thinking_stream',
              content: 'Applying relevant user context...',
              metadata: { 
                phase: 'context_integration', 
                strategy: memoryResult.strategy.reasoning,
                timestamp: Date.now() 
              }
            }
            
            // Add only highly relevant memories
            userMemoriesContext += `Relevant Information:\n`
            memoryResult.memories.forEach((memory: any) => {
              // Skip if value looks like a conversation exchange
              if (memory.value && (
                memory.value.includes('User:') || 
                memory.value.includes('Assistant:') ||
                memory.value.includes('\nUser:') ||
                memory.value.includes('\nAssistant:')
              )) {
                console.log('🚫 [AGENT] Skipping conversation-like memory in streaming context')
                return
              }
              
              // Only include high-relevance memories
              if (!memory.relevanceScore || memory.relevanceScore > 0.7) {
                userMemoriesContext += `- ${memory.key}: ${memory.value}\n`
              }
            })
            
            userMemoriesContext += '\nUse this context naturally where relevant.\n=== END CONTEXT ===\n\n'
          } else if (memoryResult.context?.communicationStyle) {
            // For greetings or minimal personalization, only add style preference
            userMemoriesContext = `\n[User prefers ${memoryResult.context.communicationStyle} communication]\n`
          }
        } catch (memoryError) {
          console.error('❌ [TRACE] Error fetching user memories:', memoryError)
          yield {
            type: 'thinking_stream',
            content: 'Continuing without personal context due to memory access error...',
            metadata: { phase: 'memory_error', timestamp: Date.now() }
          }
        }
      }

      const formattedHistory = this.trimHistory(chatHistory, agentConfig.conversationSettings.maxHistoryLength, 2000)

      // Add current date and time to every query
      const now = new Date()
      const currentDateTime = now.toISOString()
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const localDateTime = now.toLocaleString('en-US', {
        timeZone: userTimezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      })

      // Safety caps for context length
      const MAX_MEMORY_CONTEXT = 4000
      const MAX_MEMORY_ITEM = 500
      if (userMemoriesContext.includes('Relevant Information:')) {
        const lines = userMemoriesContext.split('\n')
        let acc = ''
        for (const line of lines) {
          const toAdd = this.truncate(line, MAX_MEMORY_ITEM)
          if ((acc + toAdd + '\n').length > MAX_MEMORY_CONTEXT) break
          acc += toAdd + '\n'
        }
        userMemoriesContext = acc
      } else {
        userMemoriesContext = this.truncate(userMemoriesContext, MAX_MEMORY_CONTEXT)
      }

      const safeMessage = this.truncate(String(message || ''), 4000)
      let processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})]${userMemoriesContext}${safeMessage}`
      
      // Enhanced query analysis thinking
      yield {
        type: 'thinking_stream',
        content: 'Analyzing query complexity and information requirements...',
        metadata: { phase: 'query_analysis', timestamp: Date.now() }
      }
      
      // Query categorization thinking
      yield {
        type: 'context_analysis',
        content: 'Categorizing query type and determining optimal approach',
        metadata: {
          queryLength: message.length,
          deepResearch: deepResearchMode,
          hasContext: userMemoriesContext.length > 0,
          timestamp: Date.now()
        }
      }
      
      // If deep research mode is explicitly requested, hint to the agent
      if (deepResearchMode) {
        yield {
          type: 'thinking_stream',
          content: 'Deep research mode activated - preparing comprehensive analysis strategy...',
          metadata: { phase: 'deep_research_planning', timestamp: Date.now() }
        }
        processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})]${userMemoriesContext}[COMPREHENSIVE RESEARCH MODE] Please provide a thorough, well-researched response using the comprehensive_search tool if needed: ${message}`
      }

      yield {
        type: 'thinking_stream',
        content: 'Initializing agent reasoning engine...',
        metadata: { phase: 'agent_initialization', timestamp: Date.now() }
      }
      
      console.log(`🤖 [TRACE] Invoking agent with ${formattedHistory.length} history messages`)
      const agentStartTime = Date.now()
      
      // Ensure agent is initialized
      await this.ensureInitialized()

      if (!this.streamingAgent) {
        throw new Error('Streaming agent initialization failed')
      }
      
      // Create event queue for real-time streaming
      const eventQueue: StreamingEvent[] = []
      let eventQueueResolver: ((value: StreamingEvent | null) => void) | null = null
      let agentExecutionComplete = false
      
      // Create streaming callback handler
      const callbackHandler = new StreamingCallbackHandler()
      
      // Create tools with search progress callbacks
      const toolEventCallback = (event: any) => {
        console.log('🔧 [TOOL] Search progress event:', event.type)
        if (eventQueueResolver) {
          eventQueueResolver(event)
          eventQueueResolver = null
        } else {
          eventQueue.push(event)
        }
      }
      
      const streamingTools: any[] = [
        createWebSearchTool(toolEventCallback),
        createComprehensiveSearchTool(toolEventCallback),
        // Image edit (image-to-image)
        new DynamicStructuredTool({
          name: 'image_edit',
          description: 'Edit or transform an existing image (e.g., isolate subject, remove background, blur, crop, recolor). Input JSON must include a clear prompt and one image via imageUrl or imageBase64. If no imageUrl/imageBase64 is provided but the prompt references "this image", "that image", or "the image", it will use the most recent image from the conversation. Returns Markdown image(s) with edited result.',
          schema: IMAGE_EDIT_SCHEMA,
          func: maybeTraceable(async (raw: any) => {
            try {
              const input = ((): any => (raw && typeof raw === 'object' && 'input' in raw) ? (raw as any).input : raw)()
              let prompt: string = String(input?.prompt || '')
              let imageUrl: string | undefined = input?.imageUrl
              let imageBase64: string | undefined = input?.imageBase64

              if (!prompt) {
                return 'Image edit requires a prompt describing the desired changes.'
              }

              // If no image is provided but prompt references an image, extract from available images context
              if (!imageUrl && !imageBase64) {
                const promptLower = prompt.toLowerCase()
                if (promptLower.includes('this image') || promptLower.includes('that image') ||
                    promptLower.includes('the image') || promptLower.includes('it ') ||
                    promptLower.includes('edit') || promptLower.includes('modify')) {

                  // Look for available images in the conversation context
                  const imageRegex = /Image \d+:\s*\n- URL: (https?:\/\/[^\s\n]+)/g
                  let match
                  const availableImages: string[] = []

                  const fullContext = JSON.stringify(arguments)
                  while ((match = imageRegex.exec(fullContext)) !== null) {
                    availableImages.push(match[1])
                  }

                  if (availableImages.length > 0) {
                    imageUrl = availableImages[availableImages.length - 1] // Use most recent
                    console.log(`🖼️ [IMAGE_EDIT_STREAM] Using context image: ${imageUrl}`)
                  }
                }
              }

              if (!imageUrl && !imageBase64) {
                return 'Image edit requires an image. Please provide an imageUrl, imageBase64, or ensure there are recent images in the conversation to reference.'
              }

              // Enhance prompt for better editing results
              if (prompt.length < 300) {
                prompt = `Edit this image: ${prompt}. Maintain the overall composition and quality while making the requested changes.`
              }

              const client = getOpenRouterClient()
              const content: any[] = [ { type: 'text', text: prompt } ]
              if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } })
              if (imageBase64) content.push({ type: 'image_url', image_url: { url: imageBase64 } })

              const result = await client.chat.completions.create({
                model: process.env.OPENROUTER_IMAGE_EDIT_MODEL || OPENROUTER_IMAGE_MODEL,
                messages: [ { role: 'user', content } ],
                modalities: ['image', 'text'] as any,
              } as any)

              const message: any = result.choices?.[0]?.message
              const images: any[] = message?.images || []
              if (!images.length) return 'The image edit model returned no images.'

              const uploaded = await Promise.all(images.map(async (img: any, i: number) => {
                const url: string = img?.image_url?.url || ''
                if (url.startsWith('data:')) {
                  const parsed = parseDataUrl(url)
                  if (parsed) {
                    const ext = extensionForMime(parsed.mime)
                    const path = `generated/edits/${Date.now()}-${i}.${ext}`
                    try {
                      const blobUrl = await uploadToBlob({ path, data: parsed.buffer, contentType: parsed.mime })
                      return blobUrl
                    } catch {
                      return url
                    }
                  }
                }
                return url
              }))

              const md = uploaded.map((u, i) => `![edited image ${i+1}](${u})`).join('\n\n')
              return md
            } catch (err: any) {
              return `Image edit failed: ${err?.message || String(err)}`
            }
          }, addTraceMetadata({ tool_type: 'multimodal', capability: 'image_edit' }))
        }),
        // Image generation (non-streaming result, but reports as tool usage)
        new DynamicStructuredTool({
          name: 'image_generate',
          description: 'Generate an image when the user explicitly asks for an image or picture. Input can be plain text prompt or JSON {"prompt": string}. Include brief relevant context from the ongoing chat in the prompt. Returns a Markdown image tag with embedded base64 image data. Do not use unless the user requests an image.',
          schema: IMAGE_GEN_SCHEMA,
          func: maybeTraceable(async (raw: any) => {
            try {
              const normalized = ((): any => {
                if (typeof raw === 'string') return { prompt: raw }
                if (raw && typeof raw === 'object') {
                  if ('prompt' in raw) return raw as any
                  if ('input' in raw) return (raw as any).input
                }
                return { prompt: '' }
              })()
              const prompt: string = String(normalized.prompt || '')
              if (!prompt) return 'No prompt provided for image generation.'
              const client = getOpenRouterClient()
              const result = await client.chat.completions.create({
                model: OPENROUTER_IMAGE_MODEL,
                messages: [ { role: 'user', content: prompt } ],
                modalities: ['image', 'text'] as any,
              } as any)
              const message: any = result.choices?.[0]?.message
              const images: any[] = message?.images || []
              if (!images.length) return 'The image model returned no images.'

              const uploaded = await Promise.all(images.map(async (img: any, i: number) => {
                const url: string = img?.image_url?.url || ''
                if (url.startsWith('data:')) {
                  const parsed = parseDataUrl(url)
                  if (parsed) {
                    const ext = extensionForMime(parsed.mime)
                    const path = `generated/${Date.now()}-${i}.${ext}`
                    try {
                      const blobUrl = await uploadToBlob({ path, data: parsed.buffer, contentType: parsed.mime })
                      return blobUrl
                    } catch (e) {
                      return url
                    }
                  }
                }
                return url
              }))

              const md = uploaded.map((u, i) => `![generated image ${i+1}](${u})`).join('\n\n')
              return md
            } catch (err: any) {
              return `Image generation failed: ${err?.message || String(err)}`
            }
          }, addTraceMetadata({ tool_type: 'multimodal', capability: 'image_generate' }))
        }),
        // Vision analyze
        new DynamicStructuredTool({
          name: 'vision_analyze',
          description: 'Summarize or describe an image. Input must be JSON: {"prompt": string, "imageUrl"?: string, "imageBase64"?: string}. Include brief relevant chat context in the prompt. Use when the user asks about an image or provides an image URL/data URI. Returns a concise summary/answer.',
          schema: VISION_INPUT_SCHEMA,
          func: maybeTraceable(async (raw: any) => {
            try {
              const input = ((): any => (raw && typeof raw === 'object' && 'input' in raw) ? (raw as any).input : raw)()
              const prompt: string = input?.prompt ? String(input.prompt) : ''
              const imageUrl: string | undefined = input?.imageUrl
              const imageBase64: string | undefined = input?.imageBase64
              if (!prompt && !imageUrl && !imageBase64) return 'No prompt or image provided.'
              const client = getOpenRouterClient()
              const content: any[] = []
              if (prompt) content.push({ type: 'text', text: prompt })
              if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } })
              if (imageBase64) content.push({ type: 'image_url', image_url: { url: imageBase64 } })
              const completion = await client.chat.completions.create({
                model: process.env.OPENROUTER_VISION_MODEL || OPENROUTER_IMAGE_MODEL,
                messages: [ { role: 'user', content } ],
              })
              const text = completion.choices?.[0]?.message?.content || 'No description available.'
              return text
            } catch (err: any) {
              return `Vision analysis failed: ${err?.message || String(err)}`
            }
          }, addTraceMetadata({ tool_type: 'multimodal', capability: 'vision_analyze' }))
        }),
        // Document summarize
        new DynamicStructuredTool({
          name: 'document_summarize',
          description: 'Summarize a document from a URL. Input must be JSON: {"url": string, "instructions"?: string}. Include any brief context/instructions relevant from the chat. Supports PDF, DOCX, TXT, MD, HTML. Returns a concise summary.',
          schema: DOC_INPUT_SCHEMA,
          func: maybeTraceable(async (raw: any) => {
            try {
              const input = ((): any => (raw && typeof raw === 'object' && 'input' in raw) ? (raw as any).input : raw)()
              const url: string = input?.url ? String(input.url) : ''
              const instructions: string = input?.instructions ? String(input.instructions) : 'Provide a concise helpful summary.'
              if (!url) return 'No URL provided.'
              const parsed = await parseFromUrl(url)
              const text = (parsed.text || '').slice(0, 120_000)
              const client = getOpenRouterClient()
              const completion = await client.chat.completions.create({
                model: process.env.OPENROUTER_VISION_MODEL || OPENROUTER_IMAGE_MODEL,
                messages: [
                  { role: 'system', content: 'You are a helpful assistant summarizing documents. Be accurate and concise.' },
                  { role: 'user', content: [ { type: 'text', text: `${instructions}\n\nDocument type: ${parsed.type}\n\nContent:\n${text}` } ] as any },
                ],
              })
              const summary = completion.choices?.[0]?.message?.content || 'No summary available.'
              return summary
            } catch (err: any) {
              return `Document summarization failed: ${err?.message || String(err)}`
            }
          }, addTraceMetadata({ tool_type: 'multimodal', capability: 'document_summarize' }))
        })
      ]
      
      // Set up callback to push events to queue
      callbackHandler.setEventCallback((event: StreamingEvent) => {
        console.log('📨 [STREAM] Received callback event:', event.type)
        if (eventQueueResolver) {
          // If there's a waiting consumer, resolve immediately
          eventQueueResolver(event)
          eventQueueResolver = null
        } else {
          // Otherwise queue the event
          eventQueue.push(event)
        }
      })
      
      // Create a temporary streaming agent with custom tools for this request
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', agentConfig.systemPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
        new MessagesPlaceholder('agent_scratchpad')
      ])

      const tempStreamingAgent = await createToolCallingAgent({
        llm: this.streamingLLM,
        tools: streamingTools,
        prompt
      })

      const tempAgentExecutor = new AgentExecutor({
        agent: tempStreamingAgent,
        tools: streamingTools,
        verbose: process.env.NODE_ENV === 'development',
        returnIntermediateSteps: true,
        maxIterations: Number(process.env.AGENT_MAX_ITERATIONS || 6)
      })

      // Start agent execution in background
      console.log('🤖 [AGENT] Starting async agent execution with callbacks')
      const agentPromise = tempAgentExecutor.invoke({
        input: processedMessage,
        chat_history: formattedHistory,
        callbacks: [callbackHandler]
      }).then(result => {
        console.log(`⚡ [TRACE] Agent execution completed in ${Date.now() - agentStartTime}ms`)
        console.log(`🔧 [TRACE] Tools used: ${result.intermediateSteps?.length > 0 ? 'Yes' : 'No'} (${result.intermediateSteps?.length || 0} steps)`)
        agentExecutionComplete = true
        // Signal completion
        if (eventQueueResolver) {
          eventQueueResolver(null)
        }
        return result
      }).catch(error => {
        console.error('❌ [AGENT] Execution error:', error)
        agentExecutionComplete = true
        if (eventQueueResolver) {
          eventQueueResolver(null)
        }
        throw error
      })
      
      // Helper function to get next event from queue or wait for one
      const getNextEvent = (): Promise<StreamingEvent | null> => {
        return new Promise((resolve) => {
          if (eventQueue.length > 0) {
            resolve(eventQueue.shift()!)
          } else if (agentExecutionComplete) {
            resolve(null)
          } else {
            eventQueueResolver = resolve
          }
        })
      }
      
      // Stream events in real-time while agent is executing
      let event: StreamingEvent | null
      while ((event = await getNextEvent()) !== null) {
        console.log('🚀 [AGENT] Yielding real-time event:', event.type, event.metadata)
        // Yield the event immediately
        yield event
        
        // No artificial delay - stream as fast as possible
      }
      
      // Wait for agent to complete and get result
      const result = await agentPromise
      
      console.log('🤖 [AGENT] Agent execution complete, processing final result')
      console.log('🤖 [AGENT] Result keys:', Object.keys(result))
      console.log('🤖 [AGENT] Result output length:', result.output?.length || 0)

      // The events have already been streamed in real-time via callbacks
      // Just add final synthesis events if tools were used
      if (result.intermediateSteps && result.intermediateSteps.length > 0) {
        // Enhanced synthesis step (this happens after all tools complete)
        yield {
          type: 'context_synthesis',
          content: 'Synthesizing all gathered information to create comprehensive response',
          metadata: {
            sourcesUsed: result.intermediateSteps.length,
            totalInformation: result.intermediateSteps.reduce((acc: number, step: any) => acc + (step.observation?.length || 0), 0),
            synthesisStrategy: 'comprehensive_integration',
            timestamp: Date.now()
          }
        }
        
        yield {
          type: 'thinking_stream',
          content: 'Crafting final response structure...',
          metadata: { phase: 'response_structuring', timestamp: Date.now() }
        }
      } else {
        // No tools used - agent is using its knowledge
        yield {
          type: 'thinking_stream',
          content: 'Query answered using existing knowledge',
          metadata: {
            phase: 'knowledge_based_response',
            reasoning: 'sufficient_internal_knowledge',
            timestamp: Date.now()
          }
        }
      }
      
      // Final response preparation thinking
      yield {
        type: 'response_planning',
        content: 'Finalizing response structure and beginning content generation',
        metadata: {
          responseLength: result.output.length,
          complexity: result.output.length > 1000 ? 'detailed' : 'concise',
          timestamp: Date.now()
        }
      }
      
      // Stream the response in optimized chunks for faster display
      const chunkSize = 100 // Increased chunk size for less overhead
      const content = result.output || ''
      
      console.log('📝 [AGENT] Streaming response content, length:', content.length)
      
      if (content.length > 0) {
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, Math.min(i + chunkSize, content.length))
          console.log(`📝 [AGENT] Streaming chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(content.length / chunkSize)}:`, chunk.substring(0, 50))
          yield { 
            type: 'content', 
            content: chunk,
            metadata: {
              progress: Math.floor((i / content.length) * 100),
              chunkIndex: Math.floor(i / chunkSize),
              totalChunks: Math.ceil(content.length / chunkSize)
            }
          }
          
          // No artificial delay between chunks
      }
      } else {
        console.error('❌ [AGENT] No content to stream! Result:', result)
        yield {
          type: 'content',
          content: 'I apologize, but I encountered an issue generating a response. Please try again.',
          metadata: { error: 'no_content' }
        }
      }
      
      // Enhanced completion with comprehensive metadata
      const agentDuration = Date.now() - agentStartTime
      yield { 
        type: 'complete', 
        metadata: {
          ...result.metadata,
          reasoning_steps: result.intermediateSteps?.length || 0,
          total_duration_ms: agentDuration,
          response_length: content.length,
          tools_used: result.intermediateSteps?.map((step: any) => step.action?.tool).filter(Boolean) || [],
          information_sources: result.intermediateSteps?.length || 0,
          memory_used: userMemoriesContext.length > 0,
          deep_research_mode: deepResearchMode,
          completion_timestamp: Date.now()
        }
      }
      
      // Process message for memories in the background if userId is provided
      if (userId) {
        console.log(`💾 [TRACE] Starting background memory processing for user: ${userId}`)
        processMessageForMemories(userId, message, result.output)
      }
    } catch (error) {
      console.error('Error in streamMessage:', error)
      yield { 
        type: 'error', 
        content: 'Sorry, I encountered an error processing your request.',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

const aiAgent = new AIAgent()

// Optionally wrap with LangSmith tracing if enabled
if (isTracingEnabled()) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { traceable } = require('langsmith/traceable')
  aiAgent.processMessage = traceable(aiAgent.processMessage.bind(aiAgent), { 
    name: "processMessage",
    ...addTraceMetadata({ 
      operation_type: "chat_completion",
      has_tools: true,
      has_memory: true 
    })
  })
  aiAgent.streamMessage = traceable(aiAgent.streamMessage.bind(aiAgent), { 
    name: "streamMessage",
    ...addTraceMetadata({ 
      operation_type: "chat_streaming",
      has_tools: true,
      has_memory: true 
    })
  })
}

export { aiAgent }
export default AIAgent
