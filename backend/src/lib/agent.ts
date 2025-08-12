import { config } from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { DynamicTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { traceable } from 'langsmith/traceable'
import { Client } from 'langsmith'
import agentConfig from '../../config/agent-prompts.json'
import { searchHiveService } from './searchhive'
import { getRelevantMemories, processMessageForMemories } from './memory-extractor'
import { getUserWithMemories } from './auth'
import { StreamingCallbackHandler, StreamingEvent } from './streaming-callback'

config({ path: path.join(process.cwd(), '.env') })

// Initialize LangSmith client for enhanced tracing
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

// SearchHive web search and scrape tool for comprehensive information
const createWebSearchTool = (eventCallback?: (event: any) => void) => new DynamicTool({
  name: 'web_search',
  description: 'Search the web and scrape top results for comprehensive, current information. Use this for recent events, current prices, latest news, product reviews, or any query requiring up-to-date information with full content.',
  func: traceable(async (query: string) => {
    try {
      console.log(`🔍 [TRACE] Web Search Tool called with query: "${query}"`)
      const startTime = Date.now()
      
      // Determine if this needs comprehensive coverage
      const isComprehensive = searchHiveService.isComprehensiveQuery(query)
      const maxResults = isComprehensive ? 8 : 5
      const scrapeCount = isComprehensive ? 5 : 3
      
      const result = await searchHiveService.performSearchAndScrape(query, maxResults, scrapeCount, eventCallback)
      const duration = Date.now() - startTime
      
      console.log(`✅ [TRACE] Web Search completed in ${duration}ms, result length: ${result.length} chars`)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [TRACE] Web Search failed: ${errorMessage}`)
      return `Error performing web search: ${errorMessage}`
    }
  }, { 
    name: "web_search_tool",
    ...addTraceMetadata({ tool_type: "web_search", search_type: "search_and_scrape" })
  })
})

const webSearchTool = createWebSearchTool()

// SearchHive comprehensive research tool for in-depth analysis
const createComprehensiveSearchTool = (eventCallback?: (event: any) => void) => new DynamicTool({
  name: 'comprehensive_search',
  description: 'Perform comprehensive web search with extensive scraping for in-depth research. Use this for complex topics requiring thorough investigation, detailed analysis, or when you need comprehensive understanding of a subject.',
  func: traceable(async (topic: string) => {
    try {
      console.log(`🔬 [TRACE] Comprehensive Search Tool called with topic: "${topic}"`)
      const startTime = Date.now()
      const result = await searchHiveService.performComprehensiveSearch(topic, eventCallback)
      const duration = Date.now() - startTime
      
      console.log(`✅ [TRACE] Comprehensive Search completed in ${duration}ms, result length: ${result.length} chars`)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [TRACE] Comprehensive Search failed: ${errorMessage}`)
      return `Error performing comprehensive search: ${errorMessage}`
    }
  }, { 
    name: "comprehensive_search_tool",
    ...addTraceMetadata({ tool_type: "web_search", search_type: "comprehensive" })
  })
})

const comprehensiveSearchTool = createComprehensiveSearchTool()

class AIAgent {
  private llm: ChatOpenAI
  private streamingLLM: ChatOpenAI
  private agent: AgentExecutor | null = null
  private streamingAgent: AgentExecutor | null = null
  private tools = [webSearchTool, comprehensiveSearchTool]

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

    this.initializeAgent()
  }


  private async initializeAgent() {
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
      verbose: process.env.NODE_ENV === 'development'
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
      verbose: process.env.NODE_ENV === 'development',
      returnIntermediateSteps: true
    })
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
    if (!this.agent) {
      await this.initializeAgent()
    }

    try {
      // Get user memories if userId is provided
      let userMemoriesContext = ''
      let userProfile: any = null
      
      if (userId) {
        try {
          console.log(`🧠 [TRACE] Retrieving memories for user: ${userId}`)
          const memoryStartTime = Date.now()
          
          // Get relevant memories for this query
          const relevantMemories = await getRelevantMemories(userId, message, 5)
          console.log(`📚 [TRACE] Found ${relevantMemories.length} relevant memories`)
          
          // Get user profile with context
          userProfile = await getUserWithMemories(userId)
          console.log(`👤 [TRACE] User profile loaded with ${userProfile?.memories?.length || 0} total memories`)
          
          const memoryDuration = Date.now() - memoryStartTime
          console.log(`⏱️ [TRACE] Memory retrieval completed in ${memoryDuration}ms`)
          
          if (relevantMemories.length > 0 || (userProfile?.memories?.length && userProfile.memories.length > 0)) {
            userMemoriesContext = '\n\n=== USER CONTEXT & MEMORIES ===\n'
            
            if (userProfile?.contexts?.[0]) {
              const context = userProfile.contexts[0]
              userMemoriesContext += `Communication Style: ${context.communicationStyle || 'Not specified'}\n`
              userMemoriesContext += `Preferred Response Style: ${context.preferredResponseStyle || 'Not specified'}\n`
              if (context.topicsOfInterest?.length > 0) {
                userMemoriesContext += `Topics of Interest: ${context.topicsOfInterest.join(', ')}\n`
              }
              if (context.expertiseAreas?.length > 0) {
                userMemoriesContext += `Expertise Areas: ${context.expertiseAreas.join(', ')}\n`
              }
            }
            
            if (relevantMemories.length > 0) {
              userMemoriesContext += '\nRelevant User Memories:\n'
              relevantMemories.forEach(memory => {
                userMemoriesContext += `- ${memory.key}: ${memory.value} (confidence: ${(memory.confidence * 100).toFixed(0)}%)\n`
              })
            }
            
            if (userProfile?.memories?.length > 0) {
              userMemoriesContext += '\nOther User Preferences:\n'
              userProfile.memories.slice(0, 3).forEach((memory: any) => {
                userMemoriesContext += `- ${memory.key}: ${memory.value}\n`
              })
            }
            
            userMemoriesContext += '\nPlease use this context to personalize your response appropriately.\n=== END USER CONTEXT ===\n\n'
          }
        } catch (memoryError) {
          console.error('❌ [TRACE] Error fetching user memories:', memoryError)
          // Continue without memories if there's an error
        }
      }

      const formattedHistory = chatHistory
        .slice(-agentConfig.conversationSettings.maxHistoryLength)
        .map(msg => {
          if (msg.role === 'user') {
            return ['human', msg.content]
          } else if (msg.role === 'assistant') {
            return ['ai', msg.content]
          }
          return ['system', msg.content]
        })

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

      let processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})]${userMemoriesContext}${message}`
      
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
          memory_count: userProfile?.memories?.length || 0,
          relevant_memories_count: userMemoriesContext.length > 0 ? "yes" : "no"
        }
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
      // Initial thinking stream
      yield {
        type: 'thinking_stream',
        content: 'Initializing analysis of your query...',
        metadata: { phase: 'initialization', timestamp: Date.now() }
      }
      
      // Get user memories if userId is provided
      let userMemoriesContext = ''
      let userProfile: any = null
      
      if (userId) {
        yield {
          type: 'thinking_stream',
          content: 'Accessing your personal context and memories...',
          metadata: { phase: 'memory_access', timestamp: Date.now() }
        }
        
        try {
          console.log(`🧠 [TRACE] Retrieving memories for user: ${userId}`)
          const memoryStartTime = Date.now()
          
          yield {
            type: 'memory_access',
            content: 'Searching relevant memories',
            metadata: { phase: 'searching', userId, timestamp: Date.now() }
          }
          
          // Get relevant memories for this query
          const relevantMemories = await getRelevantMemories(userId, message, 5)
          console.log(`📚 [TRACE] Found ${relevantMemories.length} relevant memories`)
          
          // Get user profile with context
          userProfile = await getUserWithMemories(userId)
          console.log(`👤 [TRACE] User profile loaded with ${userProfile?.memories?.length || 0} total memories`)
          
          const memoryDuration = Date.now() - memoryStartTime
          console.log(`⏱️ [TRACE] Memory retrieval completed in ${memoryDuration}ms`)
          
          yield {
            type: 'memory_access',
            content: `Found ${relevantMemories.length} relevant memories and user context`,
            metadata: {
              phase: 'complete',
              relevantCount: relevantMemories.length,
              totalMemories: userProfile?.memories?.length || 0,
              duration: memoryDuration,
              timestamp: Date.now()
            }
          }
          
          if (relevantMemories.length > 0 || (userProfile?.memories?.length && userProfile.memories.length > 0)) {
            userMemoriesContext = '\n\n=== USER CONTEXT & MEMORIES ===\n'
            
            yield {
              type: 'thinking_stream',
              content: 'Integrating your personal context into my analysis...',
              metadata: { phase: 'context_integration', timestamp: Date.now() }
            }
            
            if (userProfile?.contexts?.[0]) {
              const context = userProfile.contexts[0]
              userMemoriesContext += `Communication Style: ${context.communicationStyle || 'Not specified'}\n`
              userMemoriesContext += `Preferred Response Style: ${context.preferredResponseStyle || 'Not specified'}\n`
              if (context.topicsOfInterest?.length > 0) {
                userMemoriesContext += `Topics of Interest: ${context.topicsOfInterest.join(', ')}\n`
              }
              if (context.expertiseAreas?.length > 0) {
                userMemoriesContext += `Expertise Areas: ${context.expertiseAreas.join(', ')}\n`
              }
            }
            
            if (relevantMemories.length > 0) {
              userMemoriesContext += '\nRelevant User Memories:\n'
              relevantMemories.forEach(memory => {
                userMemoriesContext += `- ${memory.key}: ${memory.value} (confidence: ${(memory.confidence * 100).toFixed(0)}%)\n`
              })
            }
            
            if (userProfile?.memories?.length > 0) {
              userMemoriesContext += '\nOther User Preferences:\n'
              userProfile.memories.slice(0, 3).forEach((memory: any) => {
                userMemoriesContext += `- ${memory.key}: ${memory.value}\n`
              })
            }
            
            userMemoriesContext += '\nPlease use this context to personalize your response appropriately.\n=== END USER CONTEXT ===\n\n'
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

      const formattedHistory = chatHistory
        .slice(-agentConfig.conversationSettings.maxHistoryLength)
        .map(msg => {
          if (msg.role === 'user') {
            return ['human', msg.content]
          } else if (msg.role === 'assistant') {
            return ['ai', msg.content]
          }
          return ['system', msg.content]
        })

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

      let processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})]${userMemoriesContext}${message}`
      
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
      
      // Initialize agents if needed
      if (!this.streamingAgent) {
        await this.initializeAgent()
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
      
      const streamingTools = [
        createWebSearchTool(toolEventCallback),
        createComprehensiveSearchTool(toolEventCallback)
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
        returnIntermediateSteps: true
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
        
        // Add small delay to prevent overwhelming the stream
        await new Promise(resolve => setTimeout(resolve, 10))
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
      
      // Stream the response in chunks for smooth display
      const chunkSize = 20
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
          
          // Very small delay for smooth streaming
          if (i < content.length - chunkSize) {
            await new Promise(resolve => setTimeout(resolve, 5))
          }
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

// Wrap methods with LangSmith tracing
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

export { aiAgent }
export default AIAgent
