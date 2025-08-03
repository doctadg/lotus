import { config } from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { DynamicTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import agentConfig from '../../config/agent-prompts.json'
import { searchHiveService } from './searchhive'

config({ path: path.join(process.cwd(), '.env') })

// SearchHive web search tool for real-time information
const swiftSearchTool = new DynamicTool({
  name: 'swift_search',
  description: 'Search the web for current, real-time information. Use this for recent events, current prices, latest news, product reviews, or any query requiring up-to-date information.',
  func: async (query: string) => {
    try {
      return await searchHiveService.performSwiftSearch(query, false)
    } catch (error) {
      return `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
})

// SearchHive deep research tool for comprehensive analysis
const deepResearchTool = new DynamicTool({
  name: 'deep_research',
  description: 'Perform comprehensive research across multiple sources with AI-powered analysis. Use this for complex topics requiring thorough investigation, detailed comparisons, or in-depth understanding.',
  func: async (topic: string) => {
    try {
      return await searchHiveService.performDeepResearch(topic, true)
    } catch (error) {
      return `Error performing deep research: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
})

class AIAgent {
  private llm: ChatOpenAI
  private streamingLLM: ChatOpenAI
  private agent: AgentExecutor | null = null
  private tools = [swiftSearchTool, deepResearchTool]

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
    const modelName = process.env.OPENROUTER_MODEL || 'qwen/qwen3-30b-a3b-instruct-2507';

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

  private analyzeQueryForSearch(query: string): boolean {
    const lowerQuery = query.toLowerCase()
    
    // Temporal keywords that ALWAYS require search
    const temporalKeywords = [
      'latest', 'recent', 'current', 'now', 'today', 'this year', '2024', '2025',
      'what\'s new', 'what\'s happening', 'breaking', 'update', 'news',
      'trending', 'popular', 'hot', 'viral'
    ]
    
    // Factual data keywords that ALWAYS require search
    const factualKeywords = [
      'price', 'cost', 'stock', 'market', 'exchange rate', 'worth',
      'earnings', 'revenue', 'profit', 'financial',
      'specs', 'specifications', 'availability', 'release',
      'review', 'rating', 'comparison', 'vs', 'versus',
      'statistics', 'stats', 'data', 'research findings'
    ]
    
    // Events and people keywords
    const eventKeywords = [
      'election', 'vote', 'politics', 'politician',
      'celebrity', 'public figure', 'famous person',
      'sports', 'score', 'result', 'schedule', 'standings',
      'weather', 'disaster', 'emergency'
    ]
    
    // Technology and business keywords
    const techKeywords = [
      'software update', 'new feature', 'release',
      'startup', 'ipo', 'acquisition', 'merger',
      'ai development', 'new tool', 'platform',
      'crypto', 'bitcoin', 'ethereum', 'nft', 'blockchain'
    ]
    
    const allKeywords = [...temporalKeywords, ...factualKeywords, ...eventKeywords, ...techKeywords]
    
    // Check if query contains any search-triggering keywords
    const hasSearchKeywords = allKeywords.some(keyword => lowerQuery.includes(keyword))
    
    // Additional patterns that suggest need for current information
    const questionPatterns = [
      /how much (does|is|are)/i,
      /what (is|are) the (price|cost)/i,
      /when (did|will|is)/i,
      /who (is|are|won|lost)/i,
      /where (is|are|can)/i,
      /which (company|product|service)/i
    ]
    
    const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(query))
    
    // Check for numerical queries that might need current data
    const hasNumbers = /\d{4}/.test(query) || /\$\d+/.test(query) || /\b\d+%\b/.test(query)
    
    return hasSearchKeywords || hasQuestionPattern || hasNumbers
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
  }

  async processMessage(
    message: string,
    chatHistory: Array<{ role: string; content: string }> = [],
    deepResearchMode = false
  ): Promise<{
    content: string
    metadata?: Record<string, unknown>
  }> {
    if (!this.agent) {
      await this.initializeAgent()
    }

    try {
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

      // Analyze query and force search if needed
      const needsSearch = this.analyzeQueryForSearch(message)
      
      let processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] ${message}`
      
      if (deepResearchMode) {
        processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] [DEEP RESEARCH MODE] Please use the deep_research tool for comprehensive analysis: ${message}`
      } else if (needsSearch) {
        processedMessage = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] [SEARCH REQUIRED] You MUST use swift_search before responding. Query: ${message}`
      }

      const result = await this.agent!.invoke({
        input: processedMessage,
        chat_history: formattedHistory
      })

      return {
        content: result.output,
        metadata: {
          model: process.env.OPENROUTER_MODEL,
          tools_used: result.intermediateSteps?.length > 0 ? true : false
        }
      }
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
    chatHistory: Array<{ role: string; content: string }> = []
  ): AsyncGenerator<string, void, unknown> {
    try {
      const formattedHistory = chatHistory
        .slice(-agentConfig.conversationSettings.maxHistoryLength)
        .map(msg => {
          if (msg.role === 'user') {
            return { role: 'human' as const, content: msg.content }
          } else if (msg.role === 'assistant') {
            return { role: 'ai' as const, content: msg.content }
          }
          return { role: 'system' as const, content: msg.content }
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

      const messageWithDateTime = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] ${message}`

      let retryCount = 0
      const maxRetries = 2
      
      while (retryCount <= maxRetries) {
        try {
          const stream = await this.streamingLLM.stream([
            { role: 'system', content: agentConfig.systemPrompt },
            ...formattedHistory,
            { role: 'human', content: messageWithDateTime }
          ])

          for await (const chunk of stream) {
            if (chunk.content) {
              yield chunk.content.toString()
            }
          }
          break
        } catch (err: unknown) {
          const error = err as Error & { code?: number; status?: number }
          retryCount++
          
          console.error(`Streaming error details (attempt ${retryCount}/${maxRetries + 1}):`, {
            message: error?.message,
            code: error?.code,
            status: error?.status,
            error: err
          })
          
          if (retryCount > maxRetries) {
            if (error?.code === 408 || error?.status === 408) {
              yield 'The AI service timed out after multiple attempts. Please try again later.'
            } else if (error?.status === 400) {
              yield 'The AI provider is currently experiencing issues. Please try again in a moment.'
            } else if (error?.message) {
              yield `Streaming error: ${error.message}`
            } else {
              yield 'I apologize, but I encountered an error while processing your message. Please try again.'
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      yield 'I apologize, but I encountered an error while processing your message. Please try again.'
    }
  }
}

const aiAgent = new AIAgent()

export { aiAgent }
export default AIAgent
