/**
 * Simple metrics collection and monitoring for the memory system
 */

interface MetricData {
  timestamp: number
  value: number
  metadata?: Record<string, any>
}

interface TimingData {
  operation: string
  duration: number
  success: boolean
  timestamp: number
  metadata?: Record<string, any>
}

class SimpleMetrics {
  private counters = new Map<string, number>()
  private timings: TimingData[] = []
  private maxTimingEntries = 1000

  // Counter methods
  increment(metric: string, value: number = 1): void {
    const current = this.counters.get(metric) || 0
    this.counters.set(metric, current + value)
  }

  getCounter(metric: string): number {
    return this.counters.get(metric) || 0
  }

  // Timing methods
  startTimer(operation: string): () => void {
    const startTime = Date.now()
    
    return (success: boolean = true, metadata?: Record<string, any>) => {
      const duration = Date.now() - startTime
      this.recordTiming({
        operation,
        duration,
        success,
        timestamp: startTime,
        metadata
      })
    }
  }

  recordTiming(timing: TimingData): void {
    this.timings.push(timing)
    
    // Keep only the most recent entries
    if (this.timings.length > this.maxTimingEntries) {
      this.timings.splice(0, this.timings.length - this.maxTimingEntries)
    }
    
    // Update related counters
    this.increment(`${timing.operation}.total`)
    if (timing.success) {
      this.increment(`${timing.operation}.success`)
    } else {
      this.increment(`${timing.operation}.error`)
    }
  }

  // Analytics methods
  getAverageTime(operation: string, timeWindow?: number): number {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const relevantTimings = this.timings.filter(t => 
      t.operation === operation && t.timestamp > cutoff
    )
    
    if (relevantTimings.length === 0) return 0
    
    const total = relevantTimings.reduce((sum, t) => sum + t.duration, 0)
    return total / relevantTimings.length
  }

  getSuccessRate(operation: string, timeWindow?: number): number {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const relevantTimings = this.timings.filter(t => 
      t.operation === operation && t.timestamp > cutoff
    )
    
    if (relevantTimings.length === 0) return 1 // Assume 100% if no data
    
    const successCount = relevantTimings.filter(t => t.success).length
    return successCount / relevantTimings.length
  }

  getPercentile(operation: string, percentile: number, timeWindow?: number): number {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const relevantTimings = this.timings
      .filter(t => t.operation === operation && t.timestamp > cutoff)
      .map(t => t.duration)
      .sort((a, b) => a - b)
    
    if (relevantTimings.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * relevantTimings.length) - 1
    return relevantTimings[Math.max(0, index)]
  }

  // Report generation
  getHealthReport(): Record<string, any> {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    const operations = [...new Set(this.timings.map(t => t.operation))]
    
    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      counters: Object.fromEntries(this.counters),
      operations: {}
    }
    
    operations.forEach(op => {
      report.operations[op] = {
        total_requests: this.getCounter(`${op}.total`),
        success_requests: this.getCounter(`${op}.success`),
        error_requests: this.getCounter(`${op}.error`),
        success_rate: this.getSuccessRate(op, oneHour),
        avg_response_time_ms: Math.round(this.getAverageTime(op, oneHour)),
        p50_response_time_ms: Math.round(this.getPercentile(op, 50, oneHour)),
        p95_response_time_ms: Math.round(this.getPercentile(op, 95, oneHour)),
        p99_response_time_ms: Math.round(this.getPercentile(op, 99, oneHour))
      }
    })
    
    return report
  }

  // Reset methods
  reset(): void {
    this.counters.clear()
    this.timings = []
  }

  // Export for external monitoring systems
  exportMetrics(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      timings: this.timings.slice(-100) // Last 100 timing entries
    }
  }
}

// Global metrics instance
export const metrics = new SimpleMetrics()

// Helper functions for common operations
export function trackMemoryExtraction<T>(
  operation: () => Promise<T>
): Promise<T> {
  const timer = metrics.startTimer('memory_extraction')
  
  return operation()
    .then(result => {
      timer()
      return result
    })
    .catch(error => {
      timer()
      throw error
    })
}

export function trackEmbeddingGeneration<T>(
  operation: () => Promise<T>
): Promise<T> {
  const timer = metrics.startTimer('embedding_generation')
  
  return operation()
    .then(result => {
      timer()
      return result
    })
    .catch(error => {
      timer()
      throw error
    })
}

export function trackVectorSearch<T>(
  operation: () => Promise<T>
): Promise<T> {
  const timer = metrics.startTimer('vector_search')
  
  return operation()
    .then(result => {
      timer()
      return result
    })
    .catch(error => {
      timer()
      throw error
    })
}

// Cache hit/miss tracking
export function trackCacheAccess(hit: boolean): void {
  if (hit) {
    metrics.increment('embedding_cache.hits')
  } else {
    metrics.increment('embedding_cache.misses')
  }
}

// Health check endpoint data
export function getSystemHealth(): Record<string, any> {
  return {
    ...metrics.getHealthReport(),
    cache_stats: {
      hit_rate: getCacheHitRate()
    }
  }
}

function getCacheHitRate(): number {
  const hits = metrics.getCounter('embedding_cache.hits')
  const misses = metrics.getCounter('embedding_cache.misses')
  const total = hits + misses
  
  return total > 0 ? hits / total : 0
}