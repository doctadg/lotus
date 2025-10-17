import { PrismaClient } from '@prisma/client'
import { safeDbOperation, timeoutExecutor } from './timeout-protection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced database URL for serverless connection pooling
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) return baseUrl
  
  // Add connection pooling parameters for serverless
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}connection_limit=10&pool_timeout=20&connect_timeout=10`
}

// Configure Prisma with serverless optimizations
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn', 'query']
    : ['error'],
})

// Ensure proper cleanup on hot reload in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connection health check for serverless
export async function ensureDbConnection(): Promise<boolean> {
  try {
    await safeDbOperation(
      () => prisma.$queryRaw`SELECT 1`,
      5000 // 5 second timeout
    )
    return true
  } catch (error) {
    console.error('Database connection health check failed:', error)
    return false
  }
}

// Graceful disconnect with timeout
export async function disconnect(): Promise<void> {
  try {
    await timeoutExecutor.execute(
      () => prisma.$disconnect(),
      5000 // 5 second timeout
    )
  } catch (error) {
    console.error('Database disconnect failed:', error)
  }
}

// Auto-disconnect on function exit for serverless
process.on('beforeExit', async () => {
  await disconnect()
})

process.on('SIGINT', async () => {
  await disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnect()
  process.exit(0)
})

// Helper function to log slow queries in development
export async function withTiming<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return operation()
  }

  const startTime = Date.now()
  try {
    const result = await operation()
    const duration = Date.now() - startTime

    // Log slow queries
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation detected (${duration}ms): ${operationName}`)
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Operation failed after ${duration}ms: ${operationName}`)
    throw error
  }
}