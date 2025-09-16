type Key = string

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T> {
  private store = new Map<Key, CacheEntry<T>>()
  constructor(private ttlMs: number = 60_000, private maxEntries: number = 200) {}

  private prune() {
    const now = Date.now()
    for (const [k, v] of this.store) {
      if (v.expiresAt <= now) this.store.delete(k)
    }
    // Basic LRU eviction by size (Map maintains insertion order; delete oldest)
    while (this.store.size > this.maxEntries) {
      const firstKey = this.store.keys().next().value
      if (!firstKey) break
      this.store.delete(firstKey)
    }
  }

  get(key: Key): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: Key, value: T) {
    this.prune()
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}

export const memoryRetrievalCache = new TTLCache<any>(Number(process.env.MEMORY_CACHE_TTL_MS || 30_000), 300)

