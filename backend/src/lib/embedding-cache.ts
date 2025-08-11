/**
 * Embedding cache implementation for improved performance
 * Supports both in-memory caching and Redis (when available)
 */

import crypto from 'crypto'

interface CacheEntry {
  embedding: number[]
  timestamp: number
  ttl: number
}

// In-memory cache as fallback
class InMemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 1000 // Maximum number of cached embeddings
  private defaultTtl = 60 * 60 * 1000 // 1 hour in milliseconds

  set(key: string, embedding: number[], ttl?: number): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    })
  }

  get(key: string): number[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.embedding
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key)
      }
    })

    toDelete.forEach(key => this.cache.delete(key))

    // If still too many entries, remove oldest ones
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2))
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }
}

// Redis cache implementation (when available)
class RedisCache {
  private redis: any = null
  private defaultTtl = 3600 // 1 hour in seconds

  constructor() {
    // Try to initialize Redis connection
    this.initRedis()
  }

  private async initRedis() {
    try {
      // Skip Redis if no URL is provided
      if (!process.env.REDIS_URL) {
        console.log('No REDIS_URL provided, using in-memory cache only')
        return
      }

      // Only try to use Redis if it's available and installed
      const Redis = await import('redis').catch(() => {
        console.log('Redis module not found, using in-memory cache only')
        return null
      })
      if (!Redis) return

      this.redis = Redis.createClient({
        url: process.env.REDIS_URL
      })

      await this.redis.connect()
      console.log('Redis cache connected successfully')
    } catch (error) {
      console.warn('Redis cache initialization failed, using in-memory cache:', error)
      this.redis = null
    }
  }

  async set(key: string, embedding: number[], ttl?: number): Promise<void> {
    if (!this.redis) return

    try {
      const value = JSON.stringify(embedding)
      await this.redis.setEx(key, ttl || this.defaultTtl, value)
    } catch (error) {
      console.error('Redis cache set error:', error)
    }
  }

  async get(key: string): Promise<number[] | null> {
    if (!this.redis) return null

    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis cache get error:', error)
      return null
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Redis cache delete error:', error)
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.flushAll()
    } catch (error) {
      console.error('Redis cache clear error:', error)
    }
  }

  isConnected(): boolean {
    return this.redis && this.redis.isOpen
  }
}

// Main cache class that combines both strategies
export class EmbeddingCache {
  private inMemoryCache = new InMemoryCache()
  private redisCache = new RedisCache()

  /**
   * Generate a cache key for the given text
   */
  private generateKey(text: string, model?: string): string {
    const content = `${model || 'default'}:${text}`
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Set embedding in cache
   */
  async set(text: string, embedding: number[], model?: string, ttl?: number): Promise<void> {
    const key = this.generateKey(text, model)

    // Always cache in memory for immediate access
    this.inMemoryCache.set(key, embedding, ttl)

    // Also cache in Redis if available
    if (this.redisCache.isConnected()) {
      await this.redisCache.set(key, embedding, ttl ? Math.floor(ttl / 1000) : undefined)
    }
  }

  /**
   * Get embedding from cache
   */
  async get(text: string, model?: string): Promise<number[] | null> {
    const key = this.generateKey(text, model)

    // Try in-memory cache first
    let embedding = this.inMemoryCache.get(key)
    if (embedding) return embedding

    // Try Redis cache if available
    if (this.redisCache.isConnected()) {
      embedding = await this.redisCache.get(key)
      if (embedding) {
        // Store in memory cache for faster future access
        this.inMemoryCache.set(key, embedding)
        return embedding
      }
    }

    return null
  }

  /**
   * Delete embedding from cache
   */
  async delete(text: string, model?: string): Promise<void> {
    const key = this.generateKey(text, model)
    
    this.inMemoryCache.delete(key)
    if (this.redisCache.isConnected()) {
      await this.redisCache.delete(key)
    }
  }

  /**
   * Clear all cached embeddings
   */
  async clear(): Promise<void> {
    this.inMemoryCache.clear()
    if (this.redisCache.isConnected()) {
      await this.redisCache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      inMemory: this.inMemoryCache.getStats(),
      redis: {
        connected: this.redisCache.isConnected()
      }
    }
  }
}

// Export singleton instance
export const embeddingCache = new EmbeddingCache()