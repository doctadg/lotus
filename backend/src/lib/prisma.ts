import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma with optimizations for better performance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error'],
})

// Ensure proper cleanup on hot reload in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add connection management for serverless environments
export async function disconnect() {
  await prisma.$disconnect()
}

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