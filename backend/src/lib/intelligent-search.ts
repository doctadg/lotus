/**
 * Intelligent Search Service with Query Classification and Caching
 * Optimizes search decisions and performance using ML-driven insights
 */

import { queryClassifier, QueryAnalysis } from './query-classifier'
import { searchCache } from './search-cache'
import { searchHiveService } from './searchhive'
import { metrics } from './metrics'

export interface SearchOptions {
  forceSearch?: boolean
  maxCacheAge?: number
  userId?: string
  userContext?: any
  progressCallback?: (event: any) => void
}

export interface SearchResult {
  content: string
  fromCache: boolean
  searchStrategy: {
    analysis: QueryAnalysis
    executed: boolean
    cacheHit: boolean
    actualSources?: number
    actualScraping?: number
  }
  performance: {
    totalTime: number
    analysisTime: number
    cacheCheckTime: number
    searchTime?: number
  }
  metadata: {
    queryHash: string
    cacheStats?: any
  }
}

export class IntelligentSearchService {
  // Track recent queries to avoid duplication
  private recentQueries = new Map<string, { result: string; timestamp: number; hash: string }>()
  private readonly RECENT_QUERY_WINDOW = 10 * 60 * 1000 // Increased to 10 minutes
  private readonly MAX_RECENT_QUERIES = 50 // Increased cache size
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now()
    const timer = metrics.startTimer('intelligent_search')

    try {
      // Step 0: Check for recent duplicate queries first (increased window)
      const recentResult = this.checkRecentQueries(query)
      if (recentResult && !options.forceSearch) {
        console.log(`🔄 [INTELLIGENT_SEARCH] Found recent identical/similar query, returning cached result`)
        timer(true, { recent_hit: true })
        return {
          content: recentResult.result,
          fromCache: true,
          searchStrategy: {
            analysis: queryClassifier.analyze(query, options.userContext),
            executed: false,
            cacheHit: true
          },
          performance: {
            totalTime: Date.now() - startTime,
            analysisTime: 0,
            cacheCheckTime: 0
          },
          metadata: {
            queryHash: recentResult.hash,
            cacheStats: searchCache.getStats()
          }
        }
      }
      
      // Step 1: Analyze the query
      console.log(`🧠 [INTELLIGENT_SEARCH] Analyzing query: "${query}"`)
      const analysisStart = Date.now()
      
      const analysis = queryClassifier.analyze(query, options.userContext)
      const analysisTime = Date.now() - analysisStart
      
      console.log(`📊 [INTELLIGENT_SEARCH] Analysis result:`, {
        queryType: analysis.queryType,
        searchNeeded: analysis.searchNeeded,
        intensity: analysis.searchIntensity,
        reasoning: analysis.reasoning,
        confidence: analysis.confidence,
        personalizationLevel: analysis.personalizationLevel,
        sources: analysis.recommendedSources,
        scraping: analysis.recommendedScraping
      })

      // Step 2: Check cache unless forced to search (with lower threshold)
      const cacheStart = Date.now()
      let cachedResult = null
      
      if (!options.forceSearch) {
        console.log(`🔍 [INTELLIGENT_SEARCH] Checking cache with similarity threshold 0.60...`)
        cachedResult = searchCache.get(query, 0.60) // Lowered further for better cache hits
        
        // If cache hit, check if it's still fresh enough for this query type
        if (cachedResult && options.maxCacheAge) {
          const age = Date.now() - cachedResult.timestamp
          if (age > options.maxCacheAge) {
            console.log(`⏰ [INTELLIGENT_SEARCH] Cache entry too old (${age}ms > ${options.maxCacheAge}ms)`)
            cachedResult = null
          }
        }
      }
      
      const cacheCheckTime = Date.now() - cacheStart

      // Step 3: Return cached result if available and no forced search
      if (cachedResult && !options.forceSearch) {
        const totalTime = Date.now() - startTime
        timer(true, { cached: true, query_analysis: analysis.searchIntensity })
        
        console.log(`✅ [INTELLIGENT_SEARCH] Cache hit! Returning cached result (age: ${Date.now() - cachedResult.timestamp}ms)`)
        
        // Emit cache hit event for progress tracking
        options.progressCallback?.({
          type: 'cache_hit',
          content: `Found recent search results in cache - no need to search again`,
          metadata: {
            cacheAge: Date.now() - cachedResult.timestamp,
            originalQuery: cachedResult.query,
            hitCount: cachedResult.hitCount
          }
        })
        
        return {
          content: cachedResult.result,
          fromCache: true,
          searchStrategy: {
            analysis,
            executed: false,
            cacheHit: true
          },
          performance: {
            totalTime,
            analysisTime,
            cacheCheckTime
          },
          metadata: {
            queryHash: cachedResult.queryHash,
            cacheStats: searchCache.getStats()
          }
        }
      }

      // Step 4: Execute search if needed
      let searchResult = ''
      let searchTime = 0
      let actualSources = 0
      let actualScraping = 0

      if (analysis.searchNeeded || options.forceSearch) {
        console.log(`🔍 [INTELLIGENT_SEARCH] Executing ${analysis.searchIntensity} search...`)
        const searchStart = Date.now()

        // Emit search decision reasoning
        options.progressCallback?.({
          type: 'search_decision',
          content: `${analysis.reasoning} - executing ${analysis.searchIntensity} search`,
          metadata: {
            intensity: analysis.searchIntensity,
            expectedSources: analysis.recommendedSources,
            expectedScraping: analysis.recommendedScraping,
            confidence: analysis.confidence
          }
        })

        // Choose search method based on analysis
        if (analysis.searchIntensity === 'comprehensive' || analysis.searchIntensity === 'deep') {
          // Use smart search for comprehensive/deep queries with controlled parallelization
          console.log(`🧠 [INTELLIGENT_SEARCH] Using smart search for ${analysis.searchIntensity} query`)
          searchResult = await searchHiveService.performSmartSearch(
            query,
            'deep',
            options.progressCallback
          )
          actualSources = 8 // More realistic estimate for controlled search
          actualScraping = 5
        } else if (analysis.searchIntensity === 'light' || analysis.recommendedSources <= 3) {
          // Use simple search for light intensity
          searchResult = await searchHiveService.performSimpleSearch(
            query,
            options.progressCallback
          )
          actualSources = 2
          actualScraping = 2
        } else {
          // Use intelligent parameters based on analysis
          const maxResults = analysis.recommendedSources
          const scrapeCount = analysis.recommendedScraping

          searchResult = await searchHiveService.performSearchAndScrape(
            query,
            maxResults,
            scrapeCount,
            options.progressCallback
          )
          actualSources = maxResults
          actualScraping = scrapeCount
        }
        
        searchTime = Date.now() - searchStart
        
        // Cache the result for future use
        searchCache.set(
          query,
          searchResult,
          analysis.searchIntensity,
          actualSources,
          actualScraping
        )
        
        // Also store in recent queries
        this.storeRecentQuery(query, searchResult)
        
        console.log(`✅ [INTELLIGENT_SEARCH] Search completed in ${searchTime}ms, cached for future use`)
      } else {
        console.log(`🧠 [INTELLIGENT_SEARCH] No search needed - using internal knowledge`)
        
        // Emit no search decision
        options.progressCallback?.({
          type: 'no_search_decision',
          content: analysis.reasoning,
          metadata: {
            confidence: analysis.confidence,
            factors: analysis.factors
          }
        })
        
        searchResult = `Based on the query analysis, this can be answered with existing knowledge. ${analysis.reasoning}`
      }

      const totalTime = Date.now() - startTime
      timer(true, { 
        cached: false, 
        search_executed: analysis.searchNeeded || options.forceSearch,
        query_analysis: analysis.searchIntensity 
      })

      return {
        content: searchResult,
        fromCache: false,
        searchStrategy: {
          analysis,
          executed: analysis.searchNeeded || !!options.forceSearch,
          cacheHit: false,
          actualSources,
          actualScraping
        },
        performance: {
          totalTime,
          analysisTime,
          cacheCheckTime,
          searchTime: searchTime > 0 ? searchTime : undefined
        },
        metadata: {
          queryHash: searchCache.get(query)?.queryHash || 'not_cached',
          cacheStats: searchCache.getStats()
        }
      }

    } catch (error) {
      timer(false, { error: error instanceof Error ? error.message : 'unknown' })
      console.error('❌ [INTELLIGENT_SEARCH] Error:', error)
      throw error
    }
  }

  // Utility methods for the agent
  analyzeQuery(query: string, userContext?: any): QueryAnalysis {
    return queryClassifier.analyze(query, userContext)
  }

  shouldSearch(query: string, userContext?: any): boolean {
    return queryClassifier.shouldSearch(query, userContext)
  }

  getSearchStrategy(query: string, userContext?: any) {
    return queryClassifier.getSearchStrategy(query, userContext)
  }

  // Cache management
  clearCache(): void {
    searchCache.clear()
  }

  getCacheStats() {
    return searchCache.getStats()
  }

  invalidateCacheByTag(tag: string): void {
    searchCache.invalidateByTag(tag)
  }

  // Performance and monitoring
  getPerformanceMetrics() {
    return {
      cacheStats: searchCache.getStats(),
      searchMetrics: metrics.exportMetrics(),
      systemHealth: {
        avgSearchTime: metrics.getAverageTime('intelligent_search'),
        searchSuccessRate: metrics.getSuccessRate('intelligent_search'),
        cacheHitRate: searchCache.getStats().hitRate
      }
    }
  }

  // Progressive search strategy - start light and escalate if needed
  async progressiveSearch(
    query: string, 
    options: SearchOptions = {},
    qualityThreshold: number = 0.7
  ): Promise<SearchResult> {
    console.log(`🔄 [PROGRESSIVE_SEARCH] Starting progressive search for: "${query}"`)
    
    // Start with light search
    const lightResult = await this.search(query, {
      ...options,
      forceSearch: true
    })
    
    // Assess quality of light search result
    const quality = this.assessResultQuality(lightResult.content)
    console.log(`📊 [PROGRESSIVE_SEARCH] Light search quality: ${(quality * 100).toFixed(1)}%`)
    
    if (quality >= qualityThreshold) {
      console.log(`✅ [PROGRESSIVE_SEARCH] Light search sufficient`)
      return lightResult
    }
    
    // If quality is insufficient, escalate to comprehensive search
    console.log(`⬆️ [PROGRESSIVE_SEARCH] Escalating to comprehensive search`)
    options.progressCallback?.({
      type: 'search_escalation',
      content: 'Initial search results insufficient - performing deeper analysis',
      metadata: {
        initialQuality: quality,
        threshold: qualityThreshold,
        escalationType: 'comprehensive'
      }
    })
    
    // Force comprehensive search
    const analysis = queryClassifier.analyze(query, options.userContext)
    analysis.searchIntensity = 'comprehensive'
    analysis.recommendedSources = 8
    analysis.recommendedScraping = 5
    
    const comprehensiveResult = await searchHiveService.performComprehensiveSearch(
      query,
      options.progressCallback
    )
    
    // Cache the better result
    searchCache.set(query, comprehensiveResult, 'comprehensive', 8, 5)
    
    return {
      content: comprehensiveResult,
      fromCache: false,
      searchStrategy: {
        analysis,
        executed: true,
        cacheHit: false,
        actualSources: 8,
        actualScraping: 5
      },
      performance: lightResult.performance,
      metadata: lightResult.metadata
    }
  }

  private assessResultQuality(content: string): number {
    if (!content || content.length < 100) return 0
    
    let score = 0
    
    // Length-based scoring
    if (content.length > 500) score += 0.3
    if (content.length > 1000) score += 0.2
    if (content.length > 2000) score += 0.1
    
    // Source diversity (count ## headers which indicate sources)
    const sourceCount = (content.match(/##\s+\d+\./g) || []).length
    if (sourceCount >= 3) score += 0.3
    if (sourceCount >= 5) score += 0.1
    
    // Content indicators
    if (content.includes('Credits used')) score += 0.1
    if (!content.includes('Error') && !content.includes('error')) score += 0.1
    if (content.includes('http')) score += 0.1 // Has links
    
    return Math.min(1.0, score)
  }
  
  // Check for recent duplicate/similar queries
  private checkRecentQueries(query: string): { result: string; hash: string } | null {
    const now = Date.now()
    const normalized = this.normalizeQuery(query)
    
    // Clean up old entries first
    for (const [key, data] of this.recentQueries) {
      if (now - data.timestamp > this.RECENT_QUERY_WINDOW) {
        this.recentQueries.delete(key)
      }
    }
    
    // Check for exact match
    const exactMatch = this.recentQueries.get(normalized)
    if (exactMatch && (now - exactMatch.timestamp < this.RECENT_QUERY_WINDOW)) {
      console.log(`🎯 [INTELLIGENT_SEARCH] Exact recent query match found`)
      return { result: exactMatch.result, hash: exactMatch.hash }
    }
    
    // Check for similar queries
    for (const [recentQuery, data] of this.recentQueries) {
      if (this.areSimilarQueries(normalized, recentQuery, 0.85)) {
        console.log(`📍 [INTELLIGENT_SEARCH] Similar recent query found: "${recentQuery}"`)
        return { result: data.result, hash: data.hash }
      }
    }
    
    return null
  }
  
  // Store recent query for deduplication
  private storeRecentQuery(query: string, result: string, hash?: string): void {
    const normalized = this.normalizeQuery(query)
    
    // Limit the size of recent queries
    if (this.recentQueries.size >= this.MAX_RECENT_QUERIES) {
      // Remove oldest entry
      const oldest = Array.from(this.recentQueries.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]
      if (oldest) {
        this.recentQueries.delete(oldest[0])
      }
    }
    
    this.recentQueries.set(normalized, {
      result,
      timestamp: Date.now(),
      hash: hash || this.hashQuery(query)
    })
  }
  
  // Normalize query for comparison
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
  }
  
  // Hash query for cache key
  private hashQuery(query: string): string {
    // Simple hash for query caching - not cryptographically secure but sufficient
    let hash = 0
    const str = this.normalizeQuery(query)
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
  
  // Check if two queries are similar
  private areSimilarQueries(query1: string, query2: string, threshold: number = 0.7): boolean {
    const words1 = query1.split(' ')
    const words2 = query2.split(' ')
    
    // Calculate word overlap
    const commonWords = words1.filter(word => words2.includes(word))
    const similarity = (commonWords.length * 2) / (words1.length + words2.length)
    
    return similarity >= threshold
  }
}

export const intelligentSearch = new IntelligentSearchService()