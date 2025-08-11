import { config } from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents'
import { DynamicTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import agentConfig from '../../config/agent-prompts.json'

config({ path: path.join(process.cwd(), '.env') })

const webSearchTool = new DynamicTool({
  name: 'web_search',
  description: 'Search the web for current information',
  func: async (query: string) => {
    try {
      return `Web search results for "${query}": This is a placeholder response. Integrate with a real search API for production use.`
    } catch (error) {
      return `Error performing web search: ${error}`
    }
  }
})

class AIAgent {
  private llm: ChatOpenAI
  private streamingLLM: ChatOpenAI
  private agent: AgentExecutor | null = null
  private tools = [webSearchTool]

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable.')
    }

    this.llm = new ChatOpenAI({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b',
      temperature: agentConfig.modelConfig.temperature,
      maxTokens: agentConfig.modelConfig.maxTokens,
      apiKey: apiKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
          'X-Title': 'AI Chat App',
        },
      },
    })

    this.streamingLLM = new ChatOpenAI({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b',
      temperature: agentConfig.modelConfig.temperature,
      maxTokens: agentConfig.modelConfig.maxTokens,
      streaming: true,
      apiKey: apiKey,
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
  }

  async processMessage(
    message: string,
    chatHistory: Array<{ role: string; content: string }> = []
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

      const result = await this.agent!.invoke({
        input: message,
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

      const stream = await this.streamingLLM.stream([
        { role: 'system', content: agentConfig.systemPrompt },
        ...formattedHistory,
        { role: 'human', content: message }
      ])

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content.toString()
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      yield 'I apologize, but I encountered an error while processing your message. Please try again.'
    }
  }
}

export const aiAgent = new AIAgent()