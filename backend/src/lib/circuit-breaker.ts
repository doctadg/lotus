/**
 * Circuit Breaker pattern implementation for handling API failures gracefully
 */

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open', 
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerOptions {
  failureThreshold: number // Number of failures to trigger open state
  resetTimeout: number // Time in ms before attempting to close circuit
  monitoringWindow: number // Time window for failure tracking
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount: number = 0
  private lastFailureTime: number = 0
  private successCount: number = 0
  private failureTimes: number[] = []

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN
        console.log('Circuit breaker transitioning to HALF_OPEN state')
      } else {
        console.log('Circuit breaker is OPEN, using fallback')
        if (fallback) {
          return await fallback()
        }
        throw new Error('Circuit breaker is open and no fallback provided')
      }
    }

    try {
      const result = await operation()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      
      if (fallback) {
        console.log('Operation failed, using fallback')
        return await fallback()
      }
      
      throw error
    }
  }

  private recordSuccess(): void {
    this.failureCount = 0
    this.successCount++
    this.failureTimes = []
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED
      console.log('Circuit breaker closed successfully')
    }
  }

  private recordFailure(): void {
    const now = Date.now()
    this.failureCount++
    this.lastFailureTime = now
    this.failureTimes.push(now)

    // Clean up old failure times outside monitoring window
    const cutoff = now - this.options.monitoringWindow
    this.failureTimes = this.failureTimes.filter(time => time > cutoff)

    if (this.failureTimes.length >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN
      console.error(`Circuit breaker opened after ${this.failureCount} failures`)
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime > this.options.resetTimeout
  }

  public getState(): CircuitBreakerState {
    return this.state
  }

  public getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      recentFailures: this.failureTimes.length
    }
  }

  public reset(): void {
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.failureTimes = []
    console.log('Circuit breaker manually reset')
  }
}

// Global circuit breakers for different services
export const groqCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringWindow: 300000 // 5 minutes
})

export const openaiEmbeddingsCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5, // Allow more failures before opening
  resetTimeout: 60000, // 1 minute
  monitoringWindow: 300000 // 5 minutes - longer window
})