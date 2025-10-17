import { config } from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { DynamicTool, DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { maybeTraceable, isTracingEnabled } from './tracing'
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

config({ path: path.join(process.cwd(), '.env') })

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

// Helper function to add metadata to traces
const addTraceMetadata = (metadata: Record<string, any>) => {
  return {
    tags: ["lotus", "chat-agent", "fast"],
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      service: "chat-backend-fast"
    }
  }
}

// Fast web search tool with minimal overhead
const createFastWebSearchTool = (eventCallback?: (event: any) => void) => new DynamicTool({
  name: 'web_search',
  description: 'Fast web search with intelligent caching and minimal overhead',
  func: maybeTraceable(async (query: string) => {
    try {
      console.log(`⚡ [FAST_SEARCH] Quick search for: "${query}"`)
      const startTime = Date.now()
      
      // Use intelligent search with fast settings
      const searchResult = await intelligentSearch.search(query, {
        progressCallback: eventCallback
      })
      
      const duration = Date.now() - startTime
      console.log(`✅ [FAST_SEARCH] Completed in ${duration}ms`)
      
      return searchResult.content
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [FAST_SEARCH] Error: ${errorMessage}`)
      return `Search error: ${errorMessage}`
    }
  }, { 
    name: "fast_web_search_tool",
    ...addTraceMetadata({ tool_type: "fast_search", search_type: "optimized" })
  })
})

const fastWebSearchTool = createFastWebSearchTool()

class FastAIAgent {
  private llm: ChatOpenAI
  private streamingLLM: ChatOpenAI
  private agent: AgentExecutor | null = null
  private streamingAgent: AgentExecutor | null = null
  private tools = [fastWebSearchTool]
  private initialized = false
  private initPromise: Promise<void> | null = null

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable.')
    }

    // Use faster model for quick responses
    const modelName = process.env.OPENROUTER_FAST_MODEL || 'openai/gpt-3.5-turbo'

    this.llm = new ChatOpenAI({
      model: modelName,
      temperature: 0.3, // Lower temperature for faster, more focused responses
      maxTokens: 1000, // Reduced max tokens for speed
      apiKey: apiKey,
      maxRetries: 2, // Fewer retries for speed
      timeout: 15000, // Shorter timeout
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
          'X-Title': 'Fast AI Chat App',
        },
      },
    })

    this.streamingLLM = new ChatOpenAI({
      model: modelName,
      temperature: 0.3,
      maxTokens: 1000,
      streaming: true,
      apiKey: apiKey,
      maxRetries: 2,
      timeout: 15000,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
          'X-Title': 'Fast AI Chat App',
        },
      },
    })
  }

  // Helper: clamp long strings to avoid context overflows
  private truncate(input: string, max: number): string {
    if (!input) return ''
    return input.length > max ? input.slice(0, max) + '…' : input
  }

  // Helper: trim chat history message content - more aggressive for speed
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
    console.log('🚀 [FAST_AGENT] Initializing fast agent...')
    
    // Simplified prompt for faster processing
    const fastPrompt = `You are a helpful AI assistant. Provide concise, accurate responses. Use the web search tool when you need current information, but prefer to answer from your knowledge when possible. Be direct and efficient.`

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', fastPrompt],
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
      maxIterations: 3 // Reduced iterations for speed
    })

    // Create streaming agent
    const streamingAgent = await createToolCallingAgent({
      llm: this.streamingLLM,
      tools: this.tools,
      prompt
    })

    this.streamingAgent = new AgentExecutor({
      agent: streamingAgent,
      tools: this.tools,
      verbose: false,
      returnIntermediateSteps: false, // Disabled for speed
      maxIterations: 3
    })
  }

  // Enhanced fast-path detection for simple queries
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
    // Check for fast-path simple queries first
    const simpleCheck = this.isSimpleQuery(message)
    if (simpleCheck.isSimple && simpleCheck.response) {
      console.log(`⚡ [FAST_AGENT] Instant response for ${simpleCheck.type} query`)
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
      throw new Error('Fast agent initialization failed')
    }

    try {
      // Optimized: Skip memory retrieval for most simple queries
      const skipMemory = simpleCheck.type === 'greeting' || simpleCheck.type === 'math' ||
                         simpleCheck.type === 'factual' || simpleCheck.type === 'temporal' ||
                         simpleCheck.type === 'information' || !userId

      let userMemoriesContext = ''
      
      if (userId && !skipMemory) {
        try {
          console.log(`🧠 [FAST_AGENT] Quick memory check for user: ${userId}`)
          const memoryResult = await adaptiveMemory.retrieveAdaptiveMemories(userId, message)
          
          // Only use memories if highly relevant
          if (memoryResult.memories.length > 0 && memoryResult.memories.some(m => (m.relevanceScore || 0) > 0.8)) {
            userMemoriesContext = '\n\n=== USER CONTEXT ===\n'
            userMemoriesContext += `Relevant Information:\n`
            memoryResult.memories
              .filter(m => (m.relevanceScore || 0) > 0.8)
              .slice(0, 2) // Max 2 memories for speed
              .forEach((memory: any) => {
                userMemoriesContext += `- ${memory.key}: ${memory.value}\n`
              })
            userMemoriesContext += '\n=== END CONTEXT ===\n\n'
          }
        } catch (error) {
          console.error('❌ [FAST_AGENT] Memory error (continuing):', error)
        }
      }

      // Simplified history processing
      const formattedHistory = this.trimHistory(chatHistory, 3, 500) // Reduced history for speed

      // Add current date/time only if needed
      const now = new Date()
      const currentDateTime = now.toISOString()
      
      const safeMessage = this.truncate(String(message || ''), 2000) // Reduced message length
      const processedMessage = `[CURRENT DATE: ${currentDateTime}]${userMemoriesContext}${safeMessage}`
      
      console.log(`🤖 [FAST_AGENT] Processing query...`)
      const agentStartTime = Date.now()
      
      const result = await this.agent!.invoke({
        input: processedMessage,
        chat_history: formattedHistory
      })

      const agentDuration = Date.now() - agentStartTime
      console.log(`⚡ [FAST_AGENT] Completed in ${agentDuration}ms`)

      // Process message for memories in background if userId is provided
      if (userId && !skipMemory) {
        processMessageForMemories(userId, message, result.output).catch(console.error)
      }

      return {
        content: result.output,
        metadata: {
          model: process.env.OPENROUTER_FAST_MODEL || 'openai/gpt-3.5-turbo',
          fast_mode: true,
          tools_used: result.intermediateSteps?.length > 0 ? true : false,
          user_memories_used: userMemoriesContext.length > 0 ? true : false,
          execution_time_ms: agentDuration
        }
      }
    } catch (error) {
      console.error('Fast agent processing error:', error)
      return {
        content: 'I apologize, but I encountered an error while processing your message. Please try again.',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fast_mode: true
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
      console.log('🤖 [FAST_AGENT] Starting stream for:', message.substring(0, 50))

      // Check for fast-path simple queries first
      const simpleCheck = this.isSimpleQuery(message)
      if (simpleCheck.isSimple && simpleCheck.response) {
        console.log(`⚡ [FAST_AGENT] Instant stream for ${simpleCheck.type} query`)
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

      // Minimal thinking for fast mode
      yield {
        type: 'thinking_stream',
        content: 'Processing...',
        metadata: { phase: 'fast_processing', timestamp: Date.now() }
      }

      // Skip memory for simple queries
      const skipMemory = simpleCheck.type === 'greeting' || simpleCheck.type === 'math' ||
                         simpleCheck.type === 'factual' || simpleCheck.type === 'temporal' ||
                         simpleCheck.type === 'information' || !userId

      let userMemoriesContext = ''

      if (userId && !skipMemory) {
        try {
          const memoryResult = await adaptiveMemory.retrieveAdaptiveMemories(userId, message)
          
          if (memoryResult.memories.length > 0 && memoryResult.memories.some(m => (m.relevanceScore || 0) > 0.8)) {
            userMemoriesContext = '\n\n=== USER CONTEXT ===\n'
            userMemoriesContext += `Relevant Information:\n`
            memoryResult.memories
              .filter(m => (m.relevanceScore || 0) > 0.8)
              .slice(0, 2)
              .forEach((memory: any) => {
                userMemoriesContext += `- ${memory.key}: ${memory.value}\n`
              })
            userMemoriesContext += '\n=== END CONTEXT ===\n\n'
          }
        } catch (error) {
          console.error('❌ [FAST_AGENT] Memory stream error:', error)
        }
      }

      // Simplified history
      const formattedHistory = this.trimHistory(chatHistory, 3, 500)

      const now = new Date()
      const currentDateTime = now.toISOString()
      const safeMessage = this.truncate(String(message || ''), 2000)
      const processedMessage = `[CURRENT DATE: ${currentDateTime}]${userMemoriesContext}${safeMessage}`
      
      // Ensure agent is initialized
      await this.ensureInitialized()

      if (!this.streamingAgent) {
        throw new Error('Fast streaming agent initialization failed')
      }
      
      console.log('🤖 [FAST_AGENT] Starting fast stream execution...')
      const agentStartTime = Date.now()
      
      // Create fast tools with minimal callbacks
      const fastTools = [createFastWebSearchTool()]
      
      // Create temporary fast agent
      const fastPrompt = `You are a helpful AI assistant. Provide concise, accurate responses. Use the web search tool when you need current information. Be direct and efficient.`
      
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', fastPrompt],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}'],
        new MessagesPlaceholder('agent_scratchpad')
      ])

      const tempStreamingAgent = await createToolCallingAgent({
        llm: this.streamingLLM,
        tools: fastTools,
        prompt
      })

      const tempAgentExecutor = new AgentExecutor({
        agent: tempStreamingAgent,
        tools: fastTools,
        verbose: false,
        returnIntermediateSteps: false,
        maxIterations: 3
      })

      // Execute agent
      const result = await tempAgentExecutor.invoke({
        input: processedMessage,
        chat_history: formattedHistory
      })

      const agentDuration = Date.now() - agentStartTime
      console.log(`⚡ [FAST_AGENT] Stream execution completed in ${agentDuration}ms`)

      // Stream the response in larger chunks for speed
      const chunkSize = 200 // Larger chunks for faster streaming
      const content = result.output || ''
      
      if (content.length > 0) {
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, Math.min(i + chunkSize, content.length))
          yield { 
            type: 'content', 
            content: chunk,
            metadata: {
              progress: Math.floor((i / content.length) * 100),
              fast_mode: true
            }
          }
        }
      }
      
      yield { 
        type: 'complete', 
        metadata: {
          fast_mode: true,
          total_duration_ms: agentDuration,
          response_length: content.length,
          completion_timestamp: Date.now()
        }
      }
      
      // Background memory processing
      if (userId && !skipMemory) {
        processMessageForMemories(userId, message, result.output).catch(console.error)
      }
    } catch (error) {
      console.error('Error in fast streamMessage:', error)
      yield { 
        type: 'error', 
        content: 'Sorry, I encountered an error processing your request.',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error', fast_mode: true }
      }
    }
  }
}

const fastAIAgent = new FastAIAgent()

// Optionally wrap with LangSmith tracing if enabled
if (isTracingEnabled()) {
  const { traceable } = require('langsmith/traceable')
  fastAIAgent.processMessage = traceable(fastAIAgent.processMessage.bind(fastAIAgent), { 
    name: "processMessageFast",
    ...addTraceMetadata({ 
      operation_type: "chat_completion_fast",
      has_tools: true,
      has_memory: true 
    })
  })
  fastAIAgent.streamMessage = traceable(fastAIAgent.streamMessage.bind(fastAIAgent), { 
    name: "streamMessageFast",
    ...addTraceMetadata({ 
      operation_type: "chat_streaming_fast",
      has_tools: true,
      has_memory: true 
    })
  })
}

export { fastAIAgent }
export default FastAIAgent