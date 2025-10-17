/**
 * Distributed Rate Limiting for Serverless Environments
 * Uses Redis for cross-instance rate limiting
 */

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalLimit: number
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Redis key prefix
}

class DistributedRateLimiter {
  private redis: any = null
  private isRedisAvailable = false
  private fallbackCache = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Try to import and initialize Redis
      if (process.env.REDIS_URL) {
        const Redis = await import('redis')
        this.redis = Redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000
          }
        })

        this.redis.on('error', (err: any) => {
          console.warn('Redis connection error, falling back to memory:', err.message)
          this.isRedisAvailable = false
        })

        this.redis.on('connect', () => {
          console.log('Redis connected for distributed rate limiting')
          this.isRedisAvailable = true
        })

        await this.redis.connect()
      }
    } catch (error) {
      console.warn('Redis not available, using memory fallback for rate limiting:', error)
      this.isRedisAvailable = false
    }
  }

  /**
   * Check rate limit for a given identifier
   */
  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const { windowMs, maxRequests, keyPrefix = 'rate_limit' } = config
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - windowMs

    if (this.isRedisAvailable && this.redis) {
      return this.checkRedisLimit(key, windowMs, maxRequests, now)
    } else {
      return this.checkMemoryLimit(key, windowMs, maxRequests, now)
    }
  }

  private async checkRedisLimit(
    key: string,
    windowMs: number,
    maxRequests: number,
    now: number
  ): Promise<RateLimitResult> {
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      
      // Remove expired entries
      pipeline.zRemRangeByScore(key, 0, Date.now() - windowMs)
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` })
      
      // Count requests in window
      pipeline.zCard(key)
      
      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000) + 1)
      
      const results = await pipeline.exec()
      const count = results?.[2]?.[1] as number || 0
      
      return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetTime: now + windowMs,
        totalLimit: maxRequests
      }
    } catch (error) {
      console.error('Redis rate limit check failed, falling back to memory:', error)
      this.isRedisAvailable = false
      return this.checkMemoryLimit(key, windowMs, maxRequests, now)
    }
  }

  private checkMemoryLimit(
    key: string,
    windowMs: number,
    maxRequests: number,
    now: number
  ): RateLimitResult {
    const existing = this.fallbackCache.get(key)
    
    if (!existing || now > existing.resetTime) {
      // New window
      this.fallbackCache.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      
      return {
        allowed: 1 <= maxRequests,
        remaining: Math.max(0, maxRequests - 1),
        resetTime: now + windowMs,
        totalLimit: maxRequests
      }
    }

    // Increment counter
    const newCount = existing.count + 1
    this.fallbackCache.set(key, {
      count: newCount,
      resetTime: existing.resetTime
    })

    return {
      allowed: newCount <= maxRequests,
      remaining: Math.max(0, maxRequests - newCount),
      resetTime: existing.resetTime,
      totalLimit: maxRequests
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(identifier: string, keyPrefix: string = 'rate_limit'): Promise<void> {
    const key = `${keyPrefix}:${identifier}`

    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key)
      } catch (error) {
        console.error('Failed to reset Redis rate limit:', error)
      }
    }

    this.fallbackCache.delete(key)
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const { windowMs, maxRequests, keyPrefix = 'rate_limit' } = config
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()

    if (this.isRedisAvailable && this.redis) {
      try {
        // Count requests without adding new one
        await this.redis.zRemRangeByScore(key, 0, now - windowMs)
        const count = await this.redis.zCard(key)
        
        return {
          allowed: count < maxRequests,
          remaining: Math.max(0, maxRequests - count),
          resetTime: now + windowMs,
          totalLimit: maxRequests
        }
      } catch (error) {
        console.error('Redis status check failed:', error)
        this.isRedisAvailable = false
      }
    }

    // Fallback to memory
    const existing = this.fallbackCache.get(key)
    if (!existing || now > existing.resetTime) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + windowMs,
        totalLimit: maxRequests
      }
    }

    return {
      allowed: existing.count < maxRequests,
      remaining: Math.max(0, maxRequests - existing.count),
      resetTime: existing.resetTime,
      totalLimit: maxRequests
    }
  }

  /**
   * Cleanup expired entries (for memory fallback)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.fallbackCache.entries()) {
      if (now > value.resetTime) {
        this.fallbackCache.delete(key)
      }
    }
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    return {
      redisAvailable: this.isRedisAvailable,
      memoryEntries: this.fallbackCache.size,
      redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured'
    }
  }

  /**
   * Close Redis connection
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
export const distributedRateLimiter = new DistributedRateLimiter()

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  API_GENERAL: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  API_CHAT: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 chat messages per minute
  API_UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute
  
  // Heavy operations
  IMAGE_GENERATION: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 images per minute
  DEEP_RESEARCH: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 research queries per 5 minutes
  
  // Authentication
  AUTH_LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  AUTH_REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
} as const

// Convenience functions
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return distributedRateLimiter.checkLimit(identifier, config)
}

export async function checkApiRateLimit(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint]
  return checkRateLimit(`api:${endpoint}:${userId}`, config)
}

export async function resetRateLimit(
  identifier: string,
  keyPrefix: string = 'rate_limit'
): Promise<void> {
  return distributedRateLimiter.resetLimit(identifier, keyPrefix)
}

// Cleanup on interval
setInterval(() => {
  distributedRateLimiter.cleanup()
}, 5 * 60 * 1000) // Every 5 minutes

// Cleanup on process exit
process.on('beforeExit', async () => {
  await distributedRateLimiter.disconnect()
})