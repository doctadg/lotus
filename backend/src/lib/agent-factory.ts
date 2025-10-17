/**
 * Simple Agent Factory for Next.js Vercel Serverless
 * Optimized for cold starts and minimal memory usage
 */

import { timeoutExecutor } from './timeout-protection'
import { memoryRetrievalCache } from './memory-aware-cache'

interface SimpleAgent {
  processMessage: (message: string, options?: any) => Promise<any>
  streamMessage: (message: string, options?: any) => AsyncGenerator<any>
  lastUsed: number
}

class ServerlessAgentFactory {
  private static instance: ServerlessAgentFactory
  private agentCache: SimpleAgent | null = null
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private warmupStarted = false

  private constructor() {
    // Start warmup after a short delay
    setTimeout(() => this.backgroundWarmup(), 2000)
  }

  static getInstance(): ServerlessAgentFactory {
    if (!ServerlessAgentFactory.instance) {
      ServerlessAgentFactory.instance = new ServerlessAgentFactory()
    }
    return ServerlessAgentFactory.instance
  }

  /**
   * Get or create an agent instance
   */
  async getAgent(): Promise<SimpleAgent> {
    // Check if we have a cached agent
    if (this.agentCache && (Date.now() - this.agentCache.lastUsed) < this.CACHE_TTL) {
      this.agentCache.lastUsed = Date.now()
      return this.agentCache
    }

    // Create new agent
    const agent = await this.createAgent()
    this.agentCache = agent
    return agent
  }

  /**
   * Create a lightweight agent instance
   */
  private async createAgent(): Promise<SimpleAgent> {
    return timeoutExecutor.execute(async () => {
      // Import the default AIAgent export
      const agentModule = await import('./agent')
      const AIAgent = agentModule.default
      
      const agent = new AIAgent()
      
      // Agent will initialize on first use
      
      return {
        processMessage: (message: string, options?: any) => 
          agent.processMessage(message, options),
        streamMessage: (message: string, options?: any) => 
          agent.streamMessage(message, options),
        lastUsed: Date.now()
      }
    }, 15000) // 15 second timeout for agent creation
  }

  /**
   * Background warmup to reduce cold starts
   */
  private async backgroundWarmup(): Promise<void> {
    if (this.warmupStarted) return
    this.warmupStarted = true

    try {
      console.log('🔥 [AGENT_FACTORY] Starting background warmup...')
      const startTime = Date.now()
      
      // Pre-warm caches
      memoryRetrievalCache.getStats()
      
      // Create a warm agent instance
      await this.createAgent()
      
      const duration = Date.now() - startTime
      console.log(`✅ [AGENT_FACTORY] Background warmup completed in ${duration}ms`)
    } catch (error) {
      console.error('❌ [AGENT_FACTORY] Background warmup failed:', error)
    }
  }

  /**
   * Force warmup (can be called from API routes)
   */
  async forceWarmup(): Promise<{ success: boolean; duration: number }> {
    const startTime = Date.now()
    try {
      await this.createAgent()
      return { success: true, duration: Date.now() - startTime }
    } catch (error) {
      console.error('❌ [AGENT_FACTORY] Force warmup failed:', error)
      return { success: false, duration: Date.now() - startTime }
    }
  }

  /**
   * Get factory statistics
   */
  getStats() {
    return {
      hasCachedAgent: !!this.agentCache,
      agentAge: this.agentCache ? Date.now() - this.agentCache.lastUsed : 0,
      memoryUsage: process.memoryUsage(),
      cacheStats: memoryRetrievalCache.getStats(),
      warmupStarted: this.warmupStarted
    }
  }

  /**
   * Cleanup for serverless environment
   */
  cleanup(): void {
    this.agentCache = null
    memoryRetrievalCache.clear()
  }
}

// Export singleton
export const agentFactory = ServerlessAgentFactory.getInstance()

// Convenience functions for API routes
export async function getServerlessAgent() {
  return agentFactory.getAgent()
}

export async function warmupAgent() {
  return agentFactory.forceWarmup()
}

export function getAgentStats() {
  return agentFactory.getStats()
}

// Cleanup on function exit
process.on('beforeExit', () => {
  agentFactory.cleanup()
})