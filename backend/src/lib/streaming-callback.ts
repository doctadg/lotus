import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { AgentAction, AgentFinish } from '@langchain/core/agents'
import { ChainValues } from '@langchain/core/utils/types'
import { LLMResult } from '@langchain/core/outputs'
import { BaseMessage } from '@langchain/core/messages'

export interface StreamingEvent {
  type: string
  content?: string
  metadata?: any
}

export class StreamingCallbackHandler extends BaseCallbackHandler {
  name = 'StreamingCallbackHandler'
  private eventQueue: StreamingEvent[] = []
  private eventCallback: ((event: StreamingEvent) => void) | null = null
  private currentTool: string | null = null

  constructor() {
    super()
  }

  setEventCallback(callback: (event: StreamingEvent) => void) {
    this.eventCallback = callback
    // Flush any queued events
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()
      if (event) {
        callback(event)
      }
    }
  }

  private emitEvent(event: StreamingEvent) {
    console.log('🎯 [CALLBACK] Emitting event:', event.type, event.metadata)
    if (this.eventCallback) {
      this.eventCallback(event)
    } else {
      this.eventQueue.push(event)
    }
  }

  // Chain lifecycle
  async handleChainStart(chain: any, inputs: ChainValues, runId: string, parentRunId?: string) {
    console.log('🔗 [CALLBACK] Chain start:', chain.name || 'Unknown')
    this.emitEvent({
      type: 'thinking_stream',
      content: 'Analyzing your query and determining the best approach...',
      metadata: {
        phase: 'chain_start',
        chainName: chain.name,
        timestamp: Date.now()
      }
    })
  }

  async handleChainEnd(outputs: ChainValues) {
    console.log('🔗 [CALLBACK] Chain end')
    this.emitEvent({
      type: 'thinking_stream',
      content: 'Finalizing response...',
      metadata: {
        phase: 'chain_end',
        timestamp: Date.now()
      }
    })
  }

  // LLM lifecycle
  async handleLLMStart(
    llm: any,
    prompts: string[],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>
  ) {
    console.log('🧠 [CALLBACK] LLM start:', llm.name)
    
    // Check if this is about tools by looking at the prompt
    const promptText = prompts.join(' ')
    const isToolDecision = promptText.includes('web_search') || promptText.includes('comprehensive_search')
    const isInitialThinking = promptText.includes('[CURRENT DATE & TIME]')
    const hasUserQuery = promptText.length > 500 // Likely contains user query
    
    let content = 'Processing your query...'
    let phase = 'llm_thinking'
    
    if (isInitialThinking && hasUserQuery) {
      content = 'Analyzing your question and determining the best approach to provide accurate information...'
      phase = 'initial_analysis'
    } else if (isToolDecision) {
      content = 'Evaluating whether I need to search for current information or if I can answer from my knowledge...'
      phase = 'tool_consideration'
    } else if (promptText.includes('tool_calls')) {
      content = 'Processing search results and synthesizing information...'
      phase = 'information_synthesis'
    }
    
    this.emitEvent({
      type: 'thinking_stream',
      content,
      metadata: {
        phase,
        model: llm.name,
        reasoning: 'Determining optimal response strategy based on query complexity and information requirements',
        timestamp: Date.now()
      }
    })
  }

  async handleLLMEnd(output: LLMResult) {
    console.log('🧠 [CALLBACK] LLM end')
    // Don't emit here as it might be too noisy
  }

  // Agent lifecycle
  async handleAgentAction(action: AgentAction) {
    console.log('🤖 [CALLBACK] Agent action:', action.tool, action.toolInput)
    
    // Determine reasoning based on tool and query
    const isWebSearch = action.tool === 'web_search'
    const isComprehensive = action.tool === 'comprehensive_search'
    const query = action.toolInput.toLowerCase()
    
    let reasoning = ''
    let strategy = ''
    
    // Analyze why this search might be needed
    const needsCurrentInfo = query.includes('latest') || query.includes('recent') || query.includes('current') || 
                            query.includes('2024') || query.includes('2025') || query.includes('today')
    const needsFactualData = query.includes('price') || query.includes('cost') || query.includes('stats') ||
                            query.includes('data') || query.includes('numbers')
    const needsComparison = query.includes('vs') || query.includes('compare') || query.includes('versus') ||
                           query.includes('better') || query.includes('best')
    
    if (isWebSearch || isComprehensive) {
      
      if (needsCurrentInfo) {
        reasoning = 'This query requires current, up-to-date information that may have changed since my training data cutoff'
      } else if (needsFactualData) {
        reasoning = 'I need to gather accurate, current data and statistics to provide precise information'
      } else if (needsComparison) {
        reasoning = 'A comprehensive comparison requires gathering the latest information about all options'
      } else {
        reasoning = 'I want to supplement my knowledge with current information to provide the most accurate response'
      }
      
      strategy = isComprehensive ? 'deep_research' : 'targeted_search'
    }
    
    // Emit enhanced thinking stream
    this.emitEvent({
      type: 'thinking_stream',
      content: `I need to search for current information. ${reasoning}`,
      metadata: {
        phase: 'tool_decision',
        tool: action.tool,
        reasoning,
        decision_factors: {
          needs_current_info: needsCurrentInfo,
          needs_factual_data: needsFactualData,
          needs_comparison: needsComparison
        },
        timestamp: Date.now()
      }
    })
    
    // Emit search planning event with enhanced context
    if (action.tool === 'web_search' || action.tool === 'comprehensive_search') {
      this.emitEvent({
        type: 'search_planning',
        content: `Planning ${action.tool === 'comprehensive_search' ? 'comprehensive' : 'targeted'} search strategy for: "${action.toolInput}"`,
        metadata: {
          tool: action.tool,
          query: action.toolInput,
          strategy,
          search_scope: isComprehensive ? 'extensive' : 'focused',
          expected_sources: isComprehensive ? '8+ websites' : '3-5 websites',
          reasoning,
          timestamp: Date.now()
        }
      })
    }

    // Emit enhanced agent thought
    this.emitEvent({
      type: 'agent_thought',
      content: `Initiating ${action.tool.replace('_', ' ')} to gather the most current and relevant information`,
      metadata: {
        tool: action.tool,
        input: action.toolInput,
        reasoning,
        confidence: 'high',
        timestamp: Date.now()
      }
    })
  }

  async handleAgentEnd(finish: AgentFinish) {
    console.log('🤖 [CALLBACK] Agent finish')
    this.emitEvent({
      type: 'context_synthesis',
      content: 'Synthesizing all gathered information into a comprehensive response',
      metadata: {
        phase: 'synthesis',
        timestamp: Date.now()
      }
    })
  }

  // Tool lifecycle
  async handleToolStart(
    tool: any,
    input: string,
    runId: string,
    parentRunId?: string
  ) {
    console.log('🔧 [CALLBACK] Tool start:', tool.name, input)
    
    // Emit search start event
    if (tool.name === 'web_search' || tool.name === 'comprehensive_search') {
      this.emitEvent({
        type: 'search_start',
        content: `Starting ${tool.name} search`,
        metadata: {
          tool: tool.name,
          query: input,
          phase: 'initializing',
          timestamp: Date.now()
        }
      })
    }

    // Track current tool for result emission
    this.currentTool = tool.name

    // Emit tool call event
    this.emitEvent({
      type: 'tool_call',
      content: tool.name,
      metadata: {
        tool: tool.name,
        status: 'executing',
        description: `Executing ${tool.name} search`,
        query: input,
        timestamp: Date.now()
      }
    })

    // Emit search progress
    if (tool.name === 'web_search' || tool.name === 'comprehensive_search') {
      // Fast progress updates for better responsiveness
      setTimeout(() => {
        this.emitEvent({
          type: 'search_progress',
          content: 'Searching web sources...',
          metadata: {
            tool: tool.name,
            phase: 'searching',
            progress: 30,
            timestamp: Date.now()
          }
        })
      }, 50)

      setTimeout(() => {
        this.emitEvent({
          type: 'search_progress',
          content: 'Analyzing results...',
          metadata: {
            tool: tool.name,
            phase: 'analyzing',
            progress: 60,
            timestamp: Date.now()
          }
        })
      }, 100)
    }
  }

  async handleToolEnd(output: string, runId?: string, parentRunId?: string) {
    console.log('🔧 [CALLBACK] Tool end, output length:', output.length)
    
    // Analyze the search results
    const sourcesCount = (output.match(/##\s+\d+\./g) || []).length
    const hasRecent = output.toLowerCase().includes('2024') || output.toLowerCase().includes('2025')
    const hasCredits = output.includes('Credits used')
    const hasError = output.includes('Error') || output.includes('error')
    
    let qualityAssessment = ''
    let informationDensity = 'low'
    
    if (output.length > 2000 && sourcesCount >= 3) {
      qualityAssessment = 'Excellent - comprehensive information from multiple high-quality sources'
      informationDensity = 'very_high'
    } else if (output.length > 1000 && sourcesCount >= 2) {
      qualityAssessment = 'Good - solid information from reliable sources'
      informationDensity = 'high'
    } else if (output.length > 500) {
      qualityAssessment = 'Moderate - basic information gathered'
      informationDensity = 'moderate'
    } else {
      qualityAssessment = 'Limited - minimal information retrieved'
      informationDensity = 'low'
    }
    
    // Emit enhanced search result analysis
    this.emitEvent({
      type: 'search_result_analysis',
      content: `Analyzing ${sourcesCount} sources and ${(output.length / 1000).toFixed(1)}k characters of information...`,
      metadata: {
        tool: this.currentTool,
        resultSize: output.length,
        sourcesCount,
        hasRecentData: hasRecent,
        quality: qualityAssessment,
        informationDensity,
        analysis: {
          content_richness: output.length > 1000 ? 'rich' : 'basic',
          source_diversity: sourcesCount > 3 ? 'diverse' : 'limited',
          recency: hasRecent ? 'current' : 'general'
        },
        timestamp: Date.now()
      }
    })

    // Emit enhanced tool result event
    this.emitEvent({
      type: 'tool_result',
      content: `${qualityAssessment} - Ready to synthesize comprehensive response`,
      metadata: {
        tool: this.currentTool,
        status: hasError ? 'error' : 'complete',
        result_size: output.length,
        sources_analyzed: sourcesCount,
        quality_score: Math.min(100, Math.floor((output.length * sourcesCount) / 100)),
        information_density: informationDensity,
        synthesis_readiness: output.length > 500 ? 'high' : 'moderate',
        timestamp: Date.now()
      }
    })

    // Reset current tool when finished
    this.currentTool = null
  }

  async handleToolError(err: any, runId?: string, parentRunId?: string) {
    console.error('🔧 [CALLBACK] Tool error:', err)
    this.emitEvent({
      type: 'tool_result',
      content: 'Tool encountered an error',
      metadata: {
        status: 'error',
        error: err.message || 'Unknown error',
        timestamp: Date.now()
      }
    })
  }

  // Retriever lifecycle (for memory access)
  async handleRetrieverStart(
    retriever: any,
    query: string,
    runId: string,
    parentRunId?: string
  ) {
    console.log('🔍 [CALLBACK] Retriever start:', retriever.name)
    this.emitEvent({
      type: 'memory_access',
      content: 'Searching relevant memories and context',
      metadata: {
        phase: 'searching',
        query: query,
        timestamp: Date.now()
      }
    })
  }

  async handleRetrieverEnd(
    documents: any[],
    runId?: string,
    parentRunId?: string
  ) {
    console.log('🔍 [CALLBACK] Retriever end, docs:', documents.length)
    this.emitEvent({
      type: 'memory_access',
      content: `Found ${documents.length} relevant memories`,
      metadata: {
        phase: 'complete',
        count: documents.length,
        timestamp: Date.now()
      }
    })
  }

  // Text/Token streaming (for real-time response generation)
  async handleLLMNewToken(token: string) {
    // We'll handle this separately in the main streaming logic
    // to avoid double-streaming
  }

  async handleText(text: string) {
    console.log('📝 [CALLBACK] Text:', text.substring(0, 100))
    // Emit thinking stream for intermediate reasoning
    if (text.includes('thinking') || text.includes('analyzing') || text.includes('considering')) {
      this.emitEvent({
        type: 'thinking_stream',
        content: text,
        metadata: {
          phase: 'reasoning',
          timestamp: Date.now()
        }
      })
    }
  }
}
