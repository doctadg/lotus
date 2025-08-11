import { OpenAIEmbeddings } from '@langchain/openai'
import { prisma } from './prisma'
import { embeddingCache } from './embedding-cache'
import { openaiEmbeddingsCircuitBreaker } from './circuit-breaker'
import { trackEmbeddingGeneration, trackVectorSearch, trackCacheAccess } from './metrics'

// Initialize OpenAI embeddings directly (not through OpenRouter)
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-ada-002'
})

export interface MemoryEmbedding {
  id: string
  content: string
  type: string
  metadata?: any
  similarity?: number
  createdAt: Date
}

/**
 * Generate embedding for a given text with caching and circuit breaker
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return trackEmbeddingGeneration(async () => {
    // First check cache
    const cachedEmbedding = await embeddingCache.get(text, 'text-embedding-ada-002')
    if (cachedEmbedding) {
      trackCacheAccess(true) // Cache hit
      return cachedEmbedding
    }
    
    trackCacheAccess(false) // Cache miss

    // Generate new embedding with circuit breaker protection
    try {
      const embedding = await openaiEmbeddingsCircuitBreaker.execute(
        async () => await embeddings.embedQuery(text),
        // Fallback: return null instead of throwing
        async () => {
          console.warn('Embeddings circuit breaker open, service degraded for:', text.substring(0, 50))
          return null
        }
      )

      if (embedding) {
        // Cache the result
        await embeddingCache.set(text, embedding, 'text-embedding-ada-002')
        return embedding
      } else {
        // Service is degraded, return a placeholder embedding or throw
        throw new Error('Embedding service temporarily unavailable')
      }
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error('Failed to generate embedding')
    }
  })
}

/**
 * Store embedding in database with pgvector support
 */
export async function storeEmbedding(
  userId: string,
  content: string,
  type: 'memory' | 'message' | 'preference',
  metadata?: any
): Promise<string> {
  try {
    const embedding = await generateEmbedding(content)
    
    // Store in database using raw SQL for pgvector
    const result = await prisma.$queryRaw`
      INSERT INTO user_embeddings (id, user_id, content, embedding, vector_embedding, type, metadata, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${content},
        ${embedding},
        ${embedding}::vector,
        ${type},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        NOW()
      )
      RETURNING id
    ` as Array<{ id: string }>
    
    return result[0].id
  } catch (error) {
    console.error('Error storing embedding:', error)
    throw new Error('Failed to store embedding')
  }
}

/**
 * Search for similar memories using vector similarity with enhanced error handling
 */
export async function searchSimilarMemories(
  userId: string,
  query: string,
  threshold: number = 0.7,
  limit: number = 10
): Promise<MemoryEmbedding[]> {
  return trackVectorSearch(async () => {
    try {
      // Validate inputs
      if (!userId || !query.trim()) {
        console.warn('Invalid search parameters:', { userId: !!userId, queryLength: query.length })
        return []
      }

      // Clamp threshold to valid range
      threshold = Math.max(0, Math.min(1, threshold))
      limit = Math.max(1, Math.min(100, limit)) // Reasonable limits

      let queryEmbedding: number[]
      try {
        queryEmbedding = await generateEmbedding(query)
      } catch (embeddingError) {
        console.warn('Embedding generation failed, using text search fallback immediately')
        throw embeddingError // Let it fall through to the fallback search
      }
      
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          content,
          type,
          metadata,
          1 - (vector_embedding <=> ${queryEmbedding}::vector) as similarity,
          created_at
        FROM user_embeddings
        WHERE user_id = ${userId}
        AND 1 - (vector_embedding <=> ${queryEmbedding}::vector) > ${threshold}
        ORDER BY vector_embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      ` as Array<{
        id: string
        content: string
        type: string
        metadata: any
        similarity: number
        created_at: Date
      }>
      
      return results.map(result => ({
        id: result.id,
        content: result.content,
        type: result.type,
        metadata: result.metadata,
        similarity: Math.max(0, Math.min(1, result.similarity)), // Ensure valid similarity range
        createdAt: result.created_at
      }))
    } catch (error) {
      console.error('Error searching similar memories:', error)
      
      // Try fallback search using traditional text search if vector search fails
      try {
        console.log('Attempting fallback text search')
        const fallbackResults = await prisma.userEmbedding.findMany({
          where: {
            userId,
            content: {
              contains: query,
              mode: 'insensitive'
            }
          },
          take: Math.min(limit, 5), // Limit fallback results
          orderBy: {
            createdAt: 'desc'
          }
        })

        return fallbackResults.map(result => ({
          id: result.id,
          content: result.content,
          type: result.type,
          metadata: result.metadata,
          similarity: 0.5, // Default similarity for text matches
          createdAt: result.createdAt
        }))
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError)
        return []
      }
    }
  })
}

/**
 * Update user context with conversation patterns
 */
export async function updateUserContext(
  userId: string,
  patterns: {
    communicationStyle?: string
    topicsOfInterest?: string[]
    expertiseAreas?: string[]
    preferredResponseStyle?: string
    timezone?: string
  }
): Promise<void> {
  try {
    const existingContext = await prisma.userContext.findFirst({
      where: { userId }
    })

    const conversationPattern = JSON.stringify({
      lastUpdated: new Date().toISOString(),
      patterns
    })

    if (existingContext) {
      await prisma.userContext.update({
        where: { id: existingContext.id },
        data: {
          conversationPattern,
          communicationStyle: patterns.communicationStyle,
          topicsOfInterest: patterns.topicsOfInterest || [],
          expertiseAreas: patterns.expertiseAreas || [],
          preferredResponseStyle: patterns.preferredResponseStyle,
          timezone: patterns.timezone
        }
      })
    } else {
      await prisma.userContext.create({
        data: {
          userId,
          conversationPattern,
          communicationStyle: patterns.communicationStyle,
          topicsOfInterest: patterns.topicsOfInterest || [],
          expertiseAreas: patterns.expertiseAreas || [],
          preferredResponseStyle: patterns.preferredResponseStyle,
          timezone: patterns.timezone
        }
      })
    }
  } catch (error) {
    console.error('Error updating user context:', error)
  }
}

/**
 * Store user memory with embedding
 */
export async function storeUserMemory(
  userId: string,
  type: 'preference' | 'fact' | 'context' | 'skill',
  category: string,
  key: string,
  value: string,
  confidence: number = 1.0,
  source: 'conversation' | 'explicit' | 'inferred' = 'conversation',
  messageId?: string
): Promise<void> {
  try {
    // Store the structured memory
    await prisma.userMemory.upsert({
      where: {
        userId_key: {
          userId,
          key
        }
      },
      update: {
        value,
        confidence,
        category,
        source,
        messageId
      },
      create: {
        userId,
        type,
        category,
        key,
        value,
        confidence,
        source,
        messageId
      }
    })

    // Also store as embedding for semantic search
    const embeddingContent = `${type}: ${key} - ${value} (${category})`
    await storeEmbedding(userId, embeddingContent, 'memory', {
      type,
      category,
      key,
      value,
      confidence,
      source
    })
  } catch (error) {
    console.error('Error storing user memory:', error)
  }
}