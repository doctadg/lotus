import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { DynamicTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import agentConfig from '../../config/agent-prompts.json'
import axios from 'axios'

// Web search tool implementation
const webSearchTool = new DynamicTool({
  name: 'web_search',
  description: 'Search the web for current information',
  func: async (query: string) => {
    try {
      // For now, we'll return a placeholder response
      // In production, integrate with a search API like SerpApi or Brave Search
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
    const baseConfig = {
      openAIApiKey: process.env.OPENROUTER_API_KEY,
      modelName: process.env.OPENROUTER_MODEL || 'qwen/qwen3-30b-a3b-instruct-2507',
      temperature: agentConfig.modelConfig.temperature,
      maxTokens: agentConfig.modelConfig.maxTokens,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'X-Title': 'AI Chat App'
        }
      }
    }

    this.llm = new ChatOpenAI(baseConfig)
    this.streamingLLM = new ChatOpenAI({
      ...baseConfig,
      streaming: true
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

    const agent = await createOpenAIFunctionsAgent({
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
    metadata?: any
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
            return ['human', msg.content]
          } else if (msg.role === 'assistant') {
            return ['ai', msg.content]
          }
          return ['system', msg.content]
        })

      // For streaming, we'll use the streaming LLM directly
      const prompt = `${agentConfig.systemPrompt}\n\nConversation History:\n${formattedHistory
        .map(([role, content]) => `${role}: ${content}`)
        .join('\n')}\n\nHuman: ${message}\nAssistant:`

      const stream = await this.streamingLLM.stream(prompt)
      
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      yield 'I apologize, but I encountered an error while processing your message. Please try again.'
    }
  }
}

export const aiAgent = new AIAgent()