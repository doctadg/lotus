/**
 * Simple response cache for common queries to improve speed
 */

interface CachedResponse {
  response: string
  timestamp: number
  hitCount: number
  queryType: string
}

class ResponseCache {
  private cache = new Map<string, CachedResponse>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
  }

  private isCommonQuery(query: string): { isCommon: boolean; type: string; response?: string } {
    const normalized = this.normalizeQuery(query)
    
    // Common greetings
    const greetings = [
      { pattern: /^(hi|hello|hey|yo|sup|howdy|greetings?)$/, response: 'Hello! How can I help you today?' },
      { pattern: /^(good\s+(morning|afternoon|evening|day|night))$/, response: 'Good day! What can I assist you with?' },
      { pattern: /^(what'?s\s+up|whats?\s+up|wassup|wazzup)$/, response: 'Hey! What can I help you with?' },
      { pattern: /^(how'?s\s+it\s+going|how\s+are\s+you)$/, response: "I'm doing well, thanks for asking! How can I assist you?" }
    ]
    
    for (const greeting of greetings) {
      if (greeting.pattern.test(normalized)) {
        return { isCommon: true, type: 'greeting', response: greeting.response }
      }
    }
    
    // Common simple questions
    const simpleQuestions = [
      { pattern: /^(what\s+is\s+your\s+name|who\s+are\s+you)$/, response: "I'm an AI assistant here to help you with your questions and tasks." },
      { pattern: /^(how\s+do\s+you\s+work|what\s+can\s+you\s+do)$/, response: "I can help answer questions, search for information, and assist with various tasks using my knowledge and available tools." },
      { pattern: /^(thank\s+you|thanks)$/, response: "You're welcome! Is there anything else I can help you with?" },
      { pattern: /^(bye|goodbye|see\s+you|later)$/, response: "Goodbye! Feel free to come back anytime you need help." }
    ]
    
    for (const question of simpleQuestions) {
      if (question.pattern.test(normalized)) {
        return { isCommon: true, type: 'simple_question', response: question.response }
      }
    }
    
    return { isCommon: false, type: 'unknown' }
  }

  get(query: string): CachedResponse | null {
    // First check if it's a common query
    const commonQuery = this.isCommonQuery(query)
    if (commonQuery.isCommon && commonQuery.response) {
      return {
        response: commonQuery.response,
        timestamp: Date.now(),
        hitCount: 1,
        queryType: commonQuery.type
      }
    }
    
    // Then check the cache
    const normalized = this.normalizeQuery(query)
    const cached = this.cache.get(normalized)
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      cached.hitCount++
      return cached
    }
    
    // Remove expired entries
    if (cached) {
      this.cache.delete(normalized)
    }
    
    return null
  }

  set(query: string, response: string, queryType: string = 'unknown'): void {
    // Don't cache very long responses or very short ones
    if (response.length < 10 || response.length > 1000) {
      return
    }
    
    // Don't cache responses that contain errors or are placeholders
    if (response.includes('error') || response.includes('Error') || response.includes('I apologize')) {
      return
    }
    
    const normalized = this.normalizeQuery(query)
    
    // Limit cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldest = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]
      if (oldest) {
        this.cache.delete(oldest[0])
      }
    }
    
    this.cache.set(normalized, {
      response,
      timestamp: Date.now(),
      hitCount: 1,
      queryType
    })
  }

  getStats() {
    const totalEntries = this.cache.size
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0)
    const avgHits = totalEntries > 0 ? totalHits / totalEntries : 0
    
    return {
      totalEntries,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100,
      cacheSize: this.cache.size
    }
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }
}

export const responseCache = new ResponseCache()