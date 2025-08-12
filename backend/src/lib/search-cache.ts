/**
 * Intelligent Search Result Caching System
 * Caches search results with smart invalidation and relevance scoring
 */

import { createHash } from 'crypto'

export interface CachedSearchResult {
  query: string
  queryHash: string
  result: string
  sources: number
  scrapedSites: number
  timestamp: number
  expiresAt: number
  hitCount: number
  lastAccessed: number
  tags: string[]
  relevanceScore: number
  searchIntensity: string
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  totalHits: number
  totalMisses: number
  cacheSize: number
  oldestEntry: number
  newestEntry: number
}

export class SearchCache {
  private cache = new Map<string, CachedSearchResult>()
  private maxEntries = 1000
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  }

  // TTL configuration based on query type
  private readonly ttlConfig = {
    breaking_news: 2 * 60 * 1000,      // 2 minutes
    current_prices: 3 * 60 * 1000,     // 3 minutes  
    weather: 5 * 60 * 1000,            // 5 minutes
    stock_market: 5 * 60 * 1000,       // 5 minutes
    research: 15 * 60 * 1000,          // 15 minutes
    comparison: 10 * 60 * 1000,        // 10 minutes
    factual: 30 * 60 * 1000,           // 30 minutes
    howto: 60 * 60 * 1000,             // 1 hour
    general: 10 * 60 * 1000            // 10 minutes
  }

  set(
    query: string, 
    result: string, 
    searchIntensity: string = 'moderate',
    sources: number = 3,
    scrapedSites: number = 2
  ): void {
    const queryHash = this.hashQuery(query)
    const now = Date.now()
    const ttl = this.calculateTTL(query, searchIntensity)
    const tags = this.extractTags(query)
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries) {
      this.evictOldEntries()
    }

    const cachedResult: CachedSearchResult = {
      query,
      queryHash,
      result,
      sources,
      scrapedSites,
      timestamp: now,
      expiresAt: now + ttl,
      hitCount: 0,
      lastAccessed: now,
      tags,
      relevanceScore: 1.0,
      searchIntensity
    }

    this.cache.set(queryHash, cachedResult)
    console.log(`📦 [CACHE] Stored result for query: "${query}" (TTL: ${ttl/1000}s, Tags: ${tags.join(', ')})`)
  }

  get(query: string, similarityThreshold: number = 0.8): CachedSearchResult | null {
    const queryHash = this.hashQuery(query)
    const now = Date.now()

    // Direct match first
    const directMatch = this.cache.get(queryHash)
    if (directMatch) {
      if (now > directMatch.expiresAt) {
        this.cache.delete(queryHash)
        this.stats.misses++
        console.log(`🗑️ [CACHE] Expired entry for: "${query}"`)
        return null
      }

      // Update access stats
      directMatch.hitCount++
      directMatch.lastAccessed = now
      this.stats.hits++
      console.log(`🎯 [CACHE] Direct hit for: "${query}" (hits: ${directMatch.hitCount})`)
      return directMatch
    }

    // Look for similar queries
    const similarResult = this.findSimilarResult(query, similarityThreshold)
    if (similarResult) {
      if (now > similarResult.expiresAt) {
        this.cache.delete(similarResult.queryHash)
        this.stats.misses++
        console.log(`🗑️ [CACHE] Expired similar entry for: "${query}"`)
        return null
      }

      // Update access stats
      similarResult.hitCount++
      similarResult.lastAccessed = now
      this.stats.hits++
      console.log(`📍 [CACHE] Similar hit for: "${query}" (original: "${similarResult.query}")`)
      return similarResult
    }

    this.stats.misses++
    console.log(`❌ [CACHE] Miss for: "${query}"`)
    return null
  }

  private hashQuery(query: string): string {
    // Normalize query for better cache hits
    const normalized = query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '') // Remove punctuation for better matching
    
    return createHash('sha256').update(normalized).digest('hex')
  }

  private calculateTTL(query: string, searchIntensity: string): number {
    const lowerQuery = query.toLowerCase()
    
    // Check for specific patterns
    if (/\b(breaking|live|happening now|just announced)\b/.test(lowerQuery)) {
      return this.ttlConfig.breaking_news
    }
    
    if (/\b(price|cost|stock|market|trading)\b/.test(lowerQuery)) {
      return this.ttlConfig.current_prices
    }
    
    if (/\b(weather|temperature|forecast)\b/.test(lowerQuery)) {
      return this.ttlConfig.weather
    }
    
    if (/\b(research|study|analysis|comprehensive)\b/.test(lowerQuery)) {
      return this.ttlConfig.research
    }
    
    if (/\b(vs|versus|compare|comparison)\b/.test(lowerQuery)) {
      return this.ttlConfig.comparison
    }
    
    if (/\b(how to|guide|tutorial|steps)\b/.test(lowerQuery)) {
      return this.ttlConfig.howto
    }
    
    if (/\b(statistics|data|facts|numbers)\b/.test(lowerQuery)) {
      return this.ttlConfig.factual
    }

    // Default based on search intensity
    switch (searchIntensity) {
      case 'comprehensive':
        return this.ttlConfig.research
      case 'deep':
        return this.ttlConfig.comparison
      case 'moderate':
        return this.ttlConfig.general
      case 'light':
        return this.ttlConfig.factual
      default:
        return this.defaultTTL
    }
  }

  private extractTags(query: string): string[] {
    const tags: string[] = []
    const lowerQuery = query.toLowerCase()
    
    // Topic tags
    if (/\b(tech|technology|software|AI|programming)\b/.test(lowerQuery)) tags.push('tech')
    if (/\b(business|market|economy|finance)\b/.test(lowerQuery)) tags.push('business')
    if (/\b(science|research|study)\b/.test(lowerQuery)) tags.push('science')
    if (/\b(news|current|latest|breaking)\b/.test(lowerQuery)) tags.push('news')
    if (/\b(weather|climate)\b/.test(lowerQuery)) tags.push('weather')
    if (/\b(sports|game|match)\b/.test(lowerQuery)) tags.push('sports')
    if (/\b(health|medical|medicine)\b/.test(lowerQuery)) tags.push('health')
    
    // Query type tags
    if (/\b(price|cost|pricing)\b/.test(lowerQuery)) tags.push('pricing')
    if (/\b(how to|guide|tutorial)\b/.test(lowerQuery)) tags.push('howto')
    if (/\b(vs|versus|compare)\b/.test(lowerQuery)) tags.push('comparison')
    if (/\b(review|rating|opinion)\b/.test(lowerQuery)) tags.push('review')
    
    return tags
  }

  private findSimilarResult(query: string, threshold: number): CachedSearchResult | null {
    const queryTags = this.extractTags(query)
    const queryWords = this.normalizeQuery(query).split(' ')
    
    let bestMatch: CachedSearchResult | null = null
    let bestScore = 0
    
    for (const cached of this.cache.values()) {
      // Skip expired entries
      if (Date.now() > cached.expiresAt) continue
      
      const similarity = this.calculateSimilarity(query, queryWords, queryTags, cached)
      
      if (similarity >= threshold && similarity > bestScore) {
        bestScore = similarity
        bestMatch = cached
      }
    }
    
    return bestMatch
  }

  private calculateSimilarity(
    query: string, 
    queryWords: string[], 
    queryTags: string[], 
    cached: CachedSearchResult
  ): number {
    const cachedWords = this.normalizeQuery(cached.query).split(' ')
    
    // Word overlap similarity
    const commonWords = queryWords.filter(word => 
      cachedWords.some(cw => cw.includes(word) || word.includes(cw))
    )
    const wordSimilarity = commonWords.length / Math.max(queryWords.length, cachedWords.length)
    
    // Tag overlap similarity
    const commonTags = queryTags.filter(tag => cached.tags.includes(tag))
    const tagSimilarity = commonTags.length / Math.max(queryTags.length, cached.tags.length)
    
    // Length similarity (prefer similar length queries)
    const lengthDiff = Math.abs(query.length - cached.query.length)
    const lengthSimilarity = Math.max(0, 1 - lengthDiff / Math.max(query.length, cached.query.length))
    
    // Weighted average (words are most important, then tags, then length)
    return (wordSimilarity * 0.6) + (tagSimilarity * 0.3) + (lengthSimilarity * 0.1)
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private evictOldEntries(): void {
    // Remove expired entries first
    const now = Date.now()
    let expiredCount = 0
    
    for (const [hash, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(hash)
        expiredCount++
      }
    }
    
    console.log(`🧹 [CACHE] Removed ${expiredCount} expired entries`)
    
    // If still too many entries, remove least recently used
    if (this.cache.size >= this.maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)
      
      const toRemove = entries.slice(0, Math.floor(this.maxEntries * 0.2)) // Remove 20%
      
      for (const [hash] of toRemove) {
        this.cache.delete(hash)
        this.stats.evictions++
      }
      
      console.log(`🧹 [CACHE] Evicted ${toRemove.length} LRU entries`)
    }
  }

  // Cache management methods
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0 }
    console.log('🗑️ [CACHE] Cleared all entries')
  }

  invalidateByTag(tag: string): void {
    let count = 0
    for (const [hash, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(hash)
        count++
      }
    }
    console.log(`🗑️ [CACHE] Invalidated ${count} entries with tag: ${tag}`)
  }

  invalidateByPattern(pattern: RegExp): void {
    let count = 0
    for (const [hash, entry] of this.cache.entries()) {
      if (pattern.test(entry.query)) {
        this.cache.delete(hash)
        count++
      }
    }
    console.log(`🗑️ [CACHE] Invalidated ${count} entries matching pattern`)
  }

  getStats(): CacheStats {
    const now = Date.now()
    const entries = Array.from(this.cache.values())
    const validEntries = entries.filter(entry => now <= entry.expiresAt)
    
    return {
      totalEntries: validEntries.length,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      cacheSize: JSON.stringify(Array.from(this.cache.values())).length,
      oldestEntry: validEntries.length > 0 ? Math.min(...validEntries.map(e => e.timestamp)) : 0,
      newestEntry: validEntries.length > 0 ? Math.max(...validEntries.map(e => e.timestamp)) : 0
    }
  }

  // Get cache entries for debugging
  getEntries(): CachedSearchResult[] {
    const now = Date.now()
    return Array.from(this.cache.values())
      .filter(entry => now <= entry.expiresAt)
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
  }
}

export const searchCache = new SearchCache()