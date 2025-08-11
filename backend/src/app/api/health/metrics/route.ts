import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/metrics'
import { groqCircuitBreaker, openaiEmbeddingsCircuitBreaker } from '@/lib/circuit-breaker'
import { embeddingCache } from '@/lib/embedding-cache'

export async function GET(request: NextRequest) {
  try {
    const systemHealth = getSystemHealth()
    
    // Add circuit breaker status
    const circuitBreakers = {
      groq: groqCircuitBreaker.getStats(),
      openai_embeddings: openaiEmbeddingsCircuitBreaker.getStats()
    }
    
    // Add cache statistics
    const cacheStats = embeddingCache.getStats()
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      circuit_breakers: circuitBreakers,
      cache: cacheStats,
      metrics: systemHealth
    }

    // Determine overall system health
    const groqHealthy = circuitBreakers.groq.state === 'closed'
    const embeddingsHealthy = circuitBreakers.openai_embeddings.state === 'closed'
    
    if (!groqHealthy || !embeddingsHealthy) {
      healthReport.status = 'degraded'
      return NextResponse.json(healthReport, { status: 503 }) // Service Unavailable
    }

    return NextResponse.json(healthReport, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Health check failed',
      uptime: process.uptime()
    }, { status: 500 })
  }
}