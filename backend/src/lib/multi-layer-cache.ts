/**
 * Multi-Layer Caching Strategy for Serverless Environments
 * L1: In-memory (fastest, per-instance)
 * L2: Redis (shared across instances) 
 * L3: Database (persistent)
 */

import { memoryRetrievalCache, responseCache, searchCache } from './memory-aware-cache'
import { distributedRateLimiter } from './distributed-rate-limit'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  version?: number // Cache version for invalidation
  layers?: ('l1' | 'l2' | 'l3')[] // Which layers to use
}

class MultiLayerCache {
  private redis: any = null
  private isRedisAvailable = false
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    try {
      if (process.env.REDIS_URL) {
        const Redis = await import('redis')
        this.redis = Redis.createClient({
          url: process.env.REDIS_URL,
          socket: { connectTimeout: 5000 }
        })

        this.redis.on('error', () => {
          this.isRedisAvailable = false
        })

        this.redis.on('connect', () => {
          this.isRedisAvailable = true
        })

        await this.redis.connect()
      }
    } catch (error) {
      this.isRedisAvailable = false
    }
  }

  /**
   * Get data from cache, trying layers in order
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { ttl = this.DEFAULT_TTL, version = 1, layers = ['l1', 'l2', 'l3'] } = options

    // L1: In-memory cache
    if (layers.includes('l1')) {
      const l1Result = this.getFromL1<T>(key, version)
      if (l1Result !== null) {
        return l1Result
      }
    }

    // L2: Redis cache
    if (layers.includes('l2') && this.isRedisAvailable) {
      try {
        const l2Result = await this.getFromL2<T>(key, version)
        if (l2Result !== null) {
          // Promote to L1
          this.setToL1(key, l2Result, ttl, version)
          return l2Result
        }
      } catch (error) {
        console.warn('L2 cache read failed:', error)
      }
    }

    // L3: Database cache (if implemented)
    if (layers.includes('l3')) {
      try {
        const l3Result = await this.getFromL3<T>(key)
        if (l3Result !== null) {
          // Promote to L2 and L1
          if (this.isRedisAvailable) {
            await this.setToL2(key, l3Result, ttl, version)
          }
          this.setToL1(key, l3Result, ttl, version)
          return l3Result
        }
      } catch (error) {
        console.warn('L3 cache read failed:', error)
      }
    }

    return null
  }

  /**
   * Set data in cache layers
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = this.DEFAULT_TTL, version = 1, layers = ['l1', 'l2', 'l3'] } = options

    // L1: In-memory cache
    if (layers.includes('l1')) {
      this.setToL1(key, data, ttl, version)
    }

    // L2: Redis cache
    if (layers.includes('l2') && this.isRedisAvailable) {
      try {
        await this.setToL2(key, data, ttl, version)
      } catch (error) {
        console.warn('L2 cache write failed:', error)
      }
    }

    // L3: Database cache
    if (layers.includes('l3')) {
      try {
        await this.setToL3(key, data, ttl)
      } catch (error) {
        console.warn('L3 cache write failed:', error)
      }
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<void> {
    // L1: In-memory
    memoryRetrievalCache.delete(key)
    responseCache.delete(key)
    searchCache.delete(key)

    // L2: Redis
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(`cache:${key}`)
      } catch (error) {
        console.warn('L2 cache delete failed:', error)
      }
    }

    // L3: Database (if implemented)
    await this.deleteFromL3(key)
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    // L1: In-memory
    memoryRetrievalCache.clear()
    responseCache.clear()
    searchCache.clear()

    // L2: Redis
    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys('cache:*')
        if (keys.length > 0) {
          await this.redis.del(keys)
        }
      } catch (error) {
        console.warn('L2 cache clear failed:', error)
      }
    }

    // L3: Database
    await this.clearL3()
  }

  // L1: In-memory cache methods
  private getFromL1<T>(key: string, version: number): T | null {
    const cacheKey = `v${version}:${key}`
    
    // Try response cache first
    const responseResult = responseCache.get(cacheKey)
    if (responseResult) {
      return responseResult as T
    }

    // Try memory cache
    const memoryResult = memoryRetrievalCache.get(cacheKey)
    if (memoryResult) {
      return memoryResult as T
    }

    // Try search cache
    const searchResult = searchCache.get(cacheKey)
    if (searchResult) {
      return searchResult as T
    }

    return null
  }

  private setToL1<T>(key: string, data: T, ttl: number, version: number): void {
    const cacheKey = `v${version}:${key}`
    
    // Determine which cache to use based on data type
    if (typeof data === 'string' && data.length < 1000) {
      responseCache.set(cacheKey, data)
    } else if (this.isSearchResult(data)) {
      searchCache.set(cacheKey, data)
    } else {
      memoryRetrievalCache.set(cacheKey, data)
    }
  }

  // L2: Redis cache methods
  private async getFromL2<T>(key: string, version: number): Promise<T | null> {
    const cacheKey = `cache:v${version}:${key}`
    const result = await this.redis.get(cacheKey)
    
    if (result) {
      const entry: CacheEntry<T> = JSON.parse(result)
      if (Date.now() - entry.timestamp < entry.ttl) {
        return entry.data
      }
      // Expired, remove it
      await this.redis.del(cacheKey)
    }
    
    return null
  }

  private async setToL2<T>(key: string, data: T, ttl: number, version: number): Promise<void> {
    const cacheKey = `cache:v${version}:${key}`
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version
    }
    
    await this.redis.setEx(cacheKey, Math.ceil(ttl / 1000), JSON.stringify(entry))
  }

  // L3: Database cache methods (placeholder)
  private async getFromL3<T>(key: string): Promise<T | null> {
    // Implement database caching if needed
    // For now, return null to skip L3
    return null
  }

  private async setToL3<T>(key: string, data: T, ttl: number): Promise<void> {
    // Implement database caching if needed
  }

  private async deleteFromL3(key: string): Promise<void> {
    // Implement database cache deletion if needed
  }

  private async clearL3(): Promise<void> {
    // Implement database cache clearing if needed
  }

  private isSearchResult(data: any): boolean {
    return data && typeof data === 'object' && 'content' in data && 'sources' in data
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      l1: {
        memory: memoryRetrievalCache.getStats(),
        response: responseCache.getStats(),
        search: searchCache.getStats()
      },
      l2: {
        available: this.isRedisAvailable,
        url: process.env.REDIS_URL ? 'configured' : 'not configured'
      },
      l3: {
        available: false // Not implemented
      }
    }
  }

  /**
   * Warm up cache with common data
   */
  async warmup(): Promise<void> {
    console.log('🔥 [MULTI_CACHE] Starting cache warmup...')
    
    // Pre-populate with common responses
    const commonResponses = [
      { key: 'greeting:hello', data: 'Hello! How can I help you today?' },
      { key: 'greeting:hi', data: 'Hi! What can I help you with?' },
      { key: 'help:what_can_you_do', data: 'I can help answer questions, search for information, and assist with various tasks.' }
    ]

    for (const { key, data } of commonResponses) {
      await this.set(key, data, { ttl: 10 * 60 * 1000 }) // 10 minutes
    }

    console.log('✅ [MULTI_CACHE] Cache warmup completed')
  }

  /**
   * Close connections
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit()
      } catch (error) {
        console.error('Error closing Redis connection:', error)
      }
    }
  }
}

// Create singleton instance
export const multiLayerCache = new MultiLayerCache()

// Convenience functions
export async function getCached<T>(key: string, options?: CacheOptions): Promise<T | null> {
  return multiLayerCache.get(key, options)
}

export async function setCached<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
  return multiLayerCache.set(key, data, options)
}

export async function deleteCached(key: string): Promise<void> {
  return multiLayerCache.delete(key)
}

export async function clearCache(): Promise<void> {
  return multiLayerCache.clear()
}

// Auto-warmup on module import
setTimeout(() => {
  multiLayerCache.warmup().catch(error => {
    console.error('Multi-layer cache warmup failed:', error)
  })
}, 3000)

// Cleanup on process exit
process.on('beforeExit', async () => {
  await multiLayerCache.disconnect()
})