/**
 * Timeout protection utilities for serverless environments
 * Prevents functions from exceeding Vercel's 30-second limit
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class TimeoutProtectedExecutor {
  private readonly DEFAULT_TIMEOUT = 25000 // 25 seconds (5s buffer for Vercel's 30s limit)
  
  /**
   * Execute a function with timeout protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT,
    timeoutMessage: string = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(timeoutMessage))
        }, timeoutMs)
      })
    ])
  }

  /**
   * Execute a streaming operation with timeout protection
   */
  async *executeStream<T>(
    operation: () => AsyncGenerator<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): AsyncGenerator<T> {
    const generator = operation()
    let timeoutId: NodeJS.Timeout | null = null

    try {
      while (true) {
        // Reset timeout for each chunk
        if (timeoutId) clearTimeout(timeoutId)
        
        timeoutId = setTimeout(() => {
          throw new TimeoutError('Stream chunk timed out')
        }, Math.min(timeoutMs, 10000)) // 10s max per chunk

        const result = await Promise.race([
          generator.next(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new TimeoutError('Chunk timeout')), 10000)
          })
        ])

        if (timeoutId) clearTimeout(timeoutId)

        if (result.done) {
          break
        }

        yield result.value
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  /**
   * Execute multiple operations in parallel with individual timeouts
   */
  async executeParallel<T>(
    operations: Array<{
      operation: () => Promise<T>
      timeout?: number
      fallback?: () => Promise<T>
    }>
  ): Promise<Array<T | null>> {
    const promises = operations.map(async ({ operation, timeout, fallback }) => {
      try {
        return await this.execute(operation, timeout)
      } catch (error) {
        if (error instanceof TimeoutError && fallback) {
          try {
            return await fallback()
          } catch (fallbackError) {
            console.error('Fallback operation failed:', fallbackError)
            return null
          }
        }
        console.error('Operation failed:', error)
        return null
      }
    })

    return Promise.all(promises)
  }
}

// Circuit breaker pattern for repeated failures
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        if (fallback) {
          return fallback()
        }
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      if (fallback) {
        return fallback()
      }
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }
}

// Global instances
export const timeoutExecutor = new TimeoutProtectedExecutor()
export const groqCircuitBreaker = new CircuitBreaker(5, 60000)
export const searchCircuitBreaker = new CircuitBreaker(3, 30000)
export const memoryCircuitBreaker = new CircuitBreaker(5, 60000)

// Utility functions for common operations
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  return timeoutExecutor.execute(operation, timeoutMs)
}

export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  return timeoutExecutor.execute(operation, timeoutMs).catch(async (error) => {
    if (error instanceof TimeoutError) {
      console.warn('Operation timed out, using fallback')
      return fallback()
    }
    throw error
  })
}

// Safe fetch with timeout
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  return timeoutExecutor.execute(
    () => fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs)
    }),
    timeoutMs
  )
}

// Safe database operation with timeout
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  return timeoutExecutor.execute(operation, timeoutMs)
}