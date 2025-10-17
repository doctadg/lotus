/**
 * Adaptive Memory Retrieval System
 * Intelligently retrieves relevant memories based on query complexity and user context
 */

import { getRelevantMemories } from './memory-extractor'
import { getUserWithMemories } from './auth'
import { queryClassifier } from './query-classifier'
import { metrics } from './metrics'

export interface MemoryRetrievalStrategy {
  maxMemories: number
  confidenceThreshold: number
  diversityWeight: number
  recencyWeight: number
  reasoning: string
}

export interface AdaptiveMemoryResult {
  memories: Array<{
    type: string
    key: string
    value: string
    confidence: number
    similarity?: number
    relevanceScore?: number
  }>
  context: any
  strategy: MemoryRetrievalStrategy
  performance: {
    retrievalTime: number
    memoryCount: number
    userProfileTime: number
  }
  metadata: {
    totalAvailableMemories: number
    contextEnriched: boolean
  }
}

export class AdaptiveMemoryService {
  // Helper to check if query is a simple greeting
  private isGreeting(query: string): boolean {
    const greetingPatterns = [
      /^(hi|hello|hey|yo|sup|howdy|greetings?)[\s!?.]*$/i,
      /^(good\s+(morning|afternoon|evening|day|night))[\s!?.]*$/i,
      /^(what'?s\s+up|whats?\s+up|wassup|wazzup)[\s!?.]*$/i,
      /^(how'?s\s+it\s+going|how\s+are\s+you)[\s!?.]*$/i
    ]
    return greetingPatterns.some(pattern => pattern.test(query.trim()))
  }
  
  // Helper to check if we should skip memory retrieval entirely - expanded for speed
  private shouldSkipMemories(query: string, queryType?: string): boolean {
    // Skip for greetings
    if (this.isGreeting(query) || queryType === 'greeting') {
      return true
    }
    
    // Skip for very short queries (likely simple)
    if (query.trim().length < 15) {
      return true
    }
    
    // Skip for pure factual/definitional queries - expanded patterns
    const skipPatterns = [
      /^(what is|define|explain)\s+[\w\s]+$/i,     // Definitions
      /^(calculate|compute|solve|what'?s)\s+[\d\s\+\-\*\/\(\)\%]+$/i,  // Math
      /^(how to|tutorial for|guide to)\s+[\w\s]+$/i,  // Generic how-tos
      /\b(documentation|docs|syntax|api reference)\b/i,  // Technical docs
      /^(tell me about|describe)\s+(the\s+)?(concept|theory|principle)/i,  // Concepts
      /^(who|when|where|why)\s+(is|are|was|were)\s+/i,  // Simple factual questions
      /^(list|show|give)\s+me\s+/i,  // Simple list requests
      /\b(example|examples?)\b/i,  // Example requests
      /^(compare|difference)\s+/i  // Comparisons
    ]
    return skipPatterns.some(pattern => pattern.test(query))
  }
  
  async retrieveAdaptiveMemories(
    userId: string,
    query: string,
    userContext?: any
  ): Promise<AdaptiveMemoryResult> {
    const startTime = Date.now()
    const timer = metrics.startTimer('adaptive_memory_retrieval')

    try {
      console.log(`🧠 [ADAPTIVE_MEMORY] Starting adaptive retrieval for user: ${userId}`)
      
      // Step 1: Analyze query to determine memory strategy
      const queryAnalysis = queryClassifier.analyze(query, userContext)
      
      // Early exit for greetings and non-personal queries
      if (this.shouldSkipMemories(query, queryAnalysis.queryType)) {
        console.log(`⚡ [ADAPTIVE_MEMORY] Skipping memory retrieval for ${queryAnalysis.queryType} query`)
        timer(true, { skipped: true, reason: queryAnalysis.queryType })
        
        // For greetings, return minimal context only
        if (queryAnalysis.queryType === 'greeting') {
          const userProfile = await getUserWithMemories(userId).catch(() => null)
          return {
            memories: [],
            context: userProfile?.contexts?.[0] ? {
              communicationStyle: userProfile.contexts[0].communicationStyle
            } : null,
            strategy: {
              maxMemories: 0,
              confidenceThreshold: 1.0,
              diversityWeight: 0,
              recencyWeight: 0,
              reasoning: 'Greeting - no memories needed'
            },
            performance: {
              retrievalTime: Date.now() - startTime,
              memoryCount: 0,
              userProfileTime: 0
            },
            metadata: {
              totalAvailableMemories: userProfile?.memories?.length || 0,
              contextEnriched: false
            }
          }
        }
        
        // For other non-personal queries, return empty
        return {
          memories: [],
          context: null,
          strategy: {
            maxMemories: 0,
            confidenceThreshold: 1.0,
            diversityWeight: 0,
            recencyWeight: 0,
            reasoning: `${queryAnalysis.queryType} query - no personalization needed`
          },
          performance: {
            retrievalTime: Date.now() - startTime,
            memoryCount: 0,
            userProfileTime: 0
          },
          metadata: {
            totalAvailableMemories: 0,
            contextEnriched: false
          }
        }
      }
      
      // Check personalization level from query analysis
      if (queryAnalysis.personalizationLevel === 'none') {
        console.log(`🚫 [ADAPTIVE_MEMORY] No personalization needed for this query`)
        timer(true, { skipped: true, reason: 'no_personalization' })
        return {
          memories: [],
          context: null,
          strategy: {
            maxMemories: 0,
            confidenceThreshold: 1.0,
            diversityWeight: 0,
            recencyWeight: 0,
            reasoning: 'Query does not require personalization'
          },
          performance: {
            retrievalTime: Date.now() - startTime,
            memoryCount: 0,
            userProfileTime: 0
          },
          metadata: {
            totalAvailableMemories: 0,
            contextEnriched: false
          }
        }
      }
      
      const strategy = this.determineMemoryStrategy(query, queryAnalysis, userContext)
      
      console.log(`📋 [ADAPTIVE_MEMORY] Strategy:`, strategy)

      // Step 2: Retrieve user profile and memories in parallel
      const profileStart = Date.now()
      const [relevantMemories, userProfile] = await Promise.all([
        getRelevantMemories(userId, query, strategy.maxMemories * 2), // Get more for filtering
        getUserWithMemories(userId)
      ])
      const userProfileTime = Date.now() - profileStart

      console.log(`📚 [ADAPTIVE_MEMORY] Retrieved ${relevantMemories.length} candidate memories`)

      // Step 3: Apply intelligent filtering and ranking
      const filteredMemories = this.filterAndRankMemories(
        relevantMemories,
        query,
        strategy,
        userProfile
      )

      const retrievalTime = Date.now() - startTime
      timer(true, { 
        memory_count: filteredMemories.length,
        strategy_type: strategy.reasoning.split(' ')[0].toLowerCase()
      })

      console.log(`✅ [ADAPTIVE_MEMORY] Completed in ${retrievalTime}ms, returning ${filteredMemories.length} memories`)

      return {
        memories: filteredMemories,
        context: userProfile?.contexts?.[0] || null,
        strategy,
        performance: {
          retrievalTime,
          memoryCount: filteredMemories.length,
          userProfileTime
        },
        metadata: {
          totalAvailableMemories: userProfile?.memories?.length || 0,
          contextEnriched: !!userProfile?.contexts?.[0]
        }
      }

    } catch (error) {
      timer(false, { error: error instanceof Error ? error.message : 'unknown' })
      console.error('❌ [ADAPTIVE_MEMORY] Error:', error)
      throw error
    }
  }

  private determineMemoryStrategy(
    query: string,
    queryAnalysis: any,
    userContext?: any
  ): MemoryRetrievalStrategy {
    const queryLength = query.length
    const wordCount = query.split(/\s+/).length
    
    // Use personalization level from query analysis if available
    const personalizationLevel = queryAnalysis.personalizationLevel || 'minimal'
    
    // Base strategy on personalization level first
    if (personalizationLevel === 'none') {
      return {
        maxMemories: 0,
        confidenceThreshold: 1.0,
        diversityWeight: 0,
        recencyWeight: 0,
        reasoning: 'No personalization required'
      }
    }
    
    if (personalizationLevel === 'minimal') {
      return {
        maxMemories: 2,
        confidenceThreshold: 0.85,
        diversityWeight: 0.3,
        recencyWeight: 0.7,
        reasoning: 'Minimal personalization - focus on most relevant memories only'
      }
    }
    
    if (personalizationLevel === 'high') {
      return {
        maxMemories: 6,
        confidenceThreshold: 0.65,
        diversityWeight: 0.7,
        recencyWeight: 0.8,
        reasoning: 'High personalization - comprehensive user context'
      }
    }
    
    // Analyze query characteristics for moderate personalization
    const isPersonalQuery = /\b(I|my|me|myself|personal|preference)\b/i.test(query)
    const isTechnicalQuery = /\b(code|programming|API|technical|development)\b/i.test(query)
    const isCreativeQuery = /\b(write|create|design|brainstorm|idea)\b/i.test(query)
    const isFactualQuery = /\b(what|when|where|how much|statistics)\b/i.test(query)

    // Override for complex queries if needed
    if (queryAnalysis.factors.queryComplexity === 'complex' && isPersonalQuery) {
      return {
        maxMemories: 5,
        confidenceThreshold: 0.7,
        diversityWeight: 0.6,
        recencyWeight: 0.6,
        reasoning: 'Complex personal query - balanced memory retrieval'
      }
    }

    if (isPersonalQuery) {
      return {
        maxMemories: 4,
        confidenceThreshold: 0.75,
        diversityWeight: 0.5,
        recencyWeight: 0.8,
        reasoning: 'Personal query - focus on user preferences'
      }
    }

    if (isTechnicalQuery) {
      return {
        maxMemories: 3,
        confidenceThreshold: 0.8,
        diversityWeight: 0.6,
        recencyWeight: 0.5,
        reasoning: 'Technical query - limited technical context'
      }
    }

    if (isCreativeQuery) {
      return {
        maxMemories: 3,
        confidenceThreshold: 0.7,
        diversityWeight: 0.8,
        recencyWeight: 0.4,
        reasoning: 'Creative query - some preference context'
      }
    }

    if (isFactualQuery || queryAnalysis.factors.hasFactualDataKeywords) {
      return {
        maxMemories: 1,
        confidenceThreshold: 0.9,
        diversityWeight: 0.2,
        recencyWeight: 0.8,
        reasoning: 'Factual query - minimal personalization'
      }
    }

    // Simple queries
    if (queryAnalysis.factors.queryComplexity === 'simple' || wordCount <= 5) {
      return {
        maxMemories: 2,
        confidenceThreshold: 0.8,
        diversityWeight: 0.4,
        recencyWeight: 0.7,
        reasoning: 'Simple query - minimal context'
      }
    }

    // Default moderate strategy
    return {
      maxMemories: 3,
      confidenceThreshold: 0.75,
      diversityWeight: 0.5,
      recencyWeight: 0.6,
      reasoning: 'Moderate query - balanced but limited memory retrieval'
    }
  }

  private filterAndRankMemories(
    memories: Array<{
      type: string
      key: string
      value: string
      confidence: number
      similarity?: number
    }>,
    query: string,
    strategy: MemoryRetrievalStrategy,
    userProfile?: any
  ): Array<{
    type: string
    key: string
    value: string
    confidence: number
    similarity?: number
    relevanceScore: number
  }> {
    console.log(`🔍 [ADAPTIVE_MEMORY] Filtering ${memories.length} memories with strategy`)

    // Step 1: Filter by confidence threshold
    const confidenceFiltered = memories.filter(m => m.confidence >= strategy.confidenceThreshold)
    console.log(`✅ [ADAPTIVE_MEMORY] After confidence filter: ${confidenceFiltered.length} memories`)

    // Step 2: Calculate relevance scores
    const scoredMemories = confidenceFiltered.map(memory => {
      const relevanceScore = this.calculateRelevanceScore(memory, query, strategy, userProfile)
      return {
        ...memory,
        relevanceScore
      }
    })

    // Step 3: Sort by relevance score
    scoredMemories.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Step 4: Apply diversity filtering if needed
    const finalMemories = strategy.diversityWeight > 0.7 
      ? this.applyDiversityFilter(scoredMemories, strategy.maxMemories)
      : scoredMemories.slice(0, strategy.maxMemories)

    console.log(`🎯 [ADAPTIVE_MEMORY] Final selection: ${finalMemories.length} memories`)
    return finalMemories
  }

  private calculateRelevanceScore(
    memory: any,
    query: string,
    strategy: MemoryRetrievalStrategy,
    userProfile?: any
  ): number {
    let score = 0

    // Base confidence score (40% weight)
    score += memory.confidence * 0.4

    // Similarity score if available (30% weight)
    if (memory.similarity) {
      score += memory.similarity * 0.3
    } else {
      // Fallback: keyword matching
      const queryWords = query.toLowerCase().split(/\s+/)
      const memoryText = `${memory.key} ${memory.value}`.toLowerCase()
      const matchedWords = queryWords.filter(word => memoryText.includes(word))
      const keywordScore = matchedWords.length / queryWords.length
      score += keywordScore * 0.3
    }

    // Memory type relevance (20% weight)
    const typeRelevance = this.getTypeRelevance(memory.type, query)
    score += typeRelevance * 0.2

    // Recency bonus (10% weight) - if we had timestamps
    score += strategy.recencyWeight * 0.1

    return Math.min(1.0, score)
  }

  private getTypeRelevance(type: string, query: string): number {
    const lowerQuery = query.toLowerCase()
    
    switch (type) {
      case 'preference':
        return /\b(prefer|like|want|choose|option)\b/.test(lowerQuery) ? 1.0 : 0.5
      case 'skill':
        return /\b(know|can|able|experience|skill|expert)\b/.test(lowerQuery) ? 1.0 : 0.6
      case 'fact':
        return /\b(what|when|where|who|fact|information)\b/.test(lowerQuery) ? 1.0 : 0.7
      case 'context':
        return 0.8 // Context is generally useful
      default:
        return 0.6
    }
  }

  private applyDiversityFilter(
    memories: Array<any>,
    maxCount: number
  ): Array<any> {
    const selected: Array<any> = []
    const typesSeen = new Set<string>()
    const keysSeen = new Set<string>()

    // First pass: select highest scoring memory of each type
    for (const memory of memories) {
      if (selected.length >= maxCount) break
      
      if (!typesSeen.has(memory.type)) {
        selected.push(memory)
        typesSeen.add(memory.type)
        keysSeen.add(memory.key)
      }
    }

    // Second pass: fill remaining slots with highest scoring unique memories
    for (const memory of memories) {
      if (selected.length >= maxCount) break
      
      if (!keysSeen.has(memory.key)) {
        selected.push(memory)
        keysSeen.add(memory.key)
      }
    }

    return selected
  }

  // Quick check if user has relevant memories for this query type
  async hasRelevantMemories(userId: string, query: string): Promise<boolean> {
    try {
      const memories = await getRelevantMemories(userId, query, 1)
      return memories.length > 0 && memories[0].confidence > 0.5
    } catch {
      return false
    }
  }

  // Get memory statistics for performance monitoring
  getMemoryStats() {
    return {
      adaptiveRetrievals: metrics.getCounter('adaptive_memory_retrieval.total'),
      avgRetrievalTime: metrics.getAverageTime('adaptive_memory_retrieval'),
      successRate: metrics.getSuccessRate('adaptive_memory_retrieval')
    }
  }
}

export const adaptiveMemory = new AdaptiveMemoryService()