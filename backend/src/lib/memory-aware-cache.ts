/**
 * Memory-aware caching system for serverless environments
 * Monitors memory usage and automatically cleans up when approaching limits
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  size: number // Approximate size in bytes
  accessCount: number
  lastAccessed: number
}

interface MemoryStats {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
}

export class MemoryAwareCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private readonly MAX_MEMORY_MB = 128 // Vercel function limit
  private readonly MEMORY_THRESHOLD = 0.8 // 80% of max memory
  private readonly CLEANUP_INTERVAL = 30000 // 30 seconds
  private cleanupTimer: NodeJS.Timeout | null = null
  
  constructor(
    private ttlMs: number = 60_000,
    private maxEntries: number = 200
  ) {
    this.startCleanupTimer()
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performMaintenance()
    }, this.CLEANUP_INTERVAL)
  }

  private getMemoryStats(): MemoryStats {
    return process.memoryUsage()
  }

  private isMemoryPressure(): boolean {
    const stats = this.getMemoryStats()
    const heapUsedMB = stats.heapUsed / 1024 / 1024
    return heapUsedMB > (this.MAX_MEMORY_MB * this.MEMORY_THRESHOLD)
  }

  private estimateSize(value: T): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'string') return value.length * 2 // UTF-16
    if (typeof value === 'number') return 8
    if (typeof value === 'boolean') return 4
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2
      } catch {
        return 1024 // Default estimate for objects
      }
    }
    return 64 // Default estimate
  }

  private performMaintenance(): void {
    const now = Date.now()
    
    // Remove expired entries
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key)
      }
    }

    // Check memory pressure
    if (this.isMemoryPressure()) {
      this.aggressiveCleanup()
    }

    // Enforce max entries limit
    if (this.store.size > this.maxEntries) {
      this.evictLeastRecentlyUsed()
    }
  }

  private aggressiveCleanup(): void {
    // Remove entries with lowest access counts first
    const entries = Array.from(this.store.entries())
      .sort(([, a], [, b]) => {
        // Prioritize removing old and rarely accessed entries
        const scoreA = a.accessCount / (Date.now() - a.lastAccessed + 1)
        const scoreB = b.accessCount / (Date.now() - b.lastAccessed + 1)
        return scoreA - scoreB
      })

    // Remove bottom 50% of entries
    const toRemove = Math.floor(entries.length * 0.5)
    for (let i = 0; i < toRemove; i++) {
      this.store.delete(entries[i][0])
    }
  }

  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.store.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    const toRemove = entries.length - this.maxEntries
    for (let i = 0; i < toRemove; i++) {
      this.store.delete(entries[i][0])
    }
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (entry.expiresAt <= now) {
      this.store.delete(key)
      return undefined
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    return entry.value
  }

  set(key: string, value: T): void {
    this.performMaintenance()

    const now = Date.now()
    const size = this.estimateSize(value)

    // Check if single entry is too large
    if (size > 1024 * 1024) { // 1MB limit per entry
      console.warn(`Cache entry too large: ${key} (${size} bytes)`)
      return
    }

    this.store.set(key, {
      value,
      expiresAt: now + this.ttlMs,
      size,
      accessCount: 1,
      lastAccessed: now
    })
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  getStats() {
    const entries = Array.from(this.store.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const memoryStats = this.getMemoryStats()

    return {
      entries: this.store.size,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      avgAccessCount: entries.length > 0 ? totalAccess / entries.length : 0,
      memoryUsedMB: Math.round(memoryStats.heapUsed / 1024 / 1024 * 100) / 100,
      memoryTotalMB: Math.round(memoryStats.heapTotal / 1024 / 1024 * 100) / 100,
      memoryPressure: this.isMemoryPressure()
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// Create optimized cache instances for different use cases
export const memoryRetrievalCache = new MemoryAwareCache<any>(
  Number(process.env.MEMORY_CACHE_TTL_MS || 30_000),
  300 // Max entries for memory retrieval
)

export const responseCache = new MemoryAwareCache<string>(
  5 * 60 * 1000, // 5 minutes for responses
  100 // Max entries for responses
)

export const searchCache = new MemoryAwareCache<any>(
  10 * 60 * 1000, // 10 minutes for search results
  200 // Max entries for search
)

// Global cleanup on function exit
process.on('exit', () => {
  memoryRetrievalCache.destroy()
  responseCache.destroy()
  searchCache.destroy()
})