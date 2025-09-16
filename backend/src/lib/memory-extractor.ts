import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { storeUserMemory, updateUserContext, storeEmbedding } from './embeddings'
import { memoryRetrievalCache } from './memory-cache'
import { groqCircuitBreaker } from './circuit-breaker'
import { trackMemoryExtraction } from './metrics'
import { maybeTraceable } from './tracing'

const llm = new ChatOpenAI({
  model: 'openai/gpt-oss-20b',
  temperature: 0.1,
  apiKey: process.env.OPENROUTER_API_KEY,
  maxRetries: 3,
  timeout: 30000,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
      'X-Title': 'AI Memory Extraction',
    },
  },
})

const parser = new JsonOutputParser()

// Enhanced template for extracting user memories from conversation - optimized for gpt-oss-20b
const memoryExtractionPrompt = PromptTemplate.fromTemplate(`
You are a memory extraction system. Analyze the conversation below and extract lasting user information.

Return ONLY valid JSON in this exact format:
{{
  "memories": [
    {{
      "type": "preference|fact|context|skill",
      "category": "personal|professional|interests|technical|communication",
      "key": "descriptive_key_name",
      "value": "the actual value or preference",
      "confidence": 0.0-1.0
    }}
  ],
  "context": {{
    "communicationStyle": "formal|casual|technical|friendly|professional",
    "topicsOfInterest": ["topic1", "topic2"],
    "expertiseAreas": ["area1", "area2"],
    "preferredResponseStyle": "detailed|concise|examples|step-by-step|conversational"
  }}
}}

EXTRACTION RULES:
1. Only extract information explicitly stated or strongly implied
2. Confidence levels: explicit=1.0, strongly implied=0.8, somewhat implied=0.6, weak=0.4
3. Extract persistent user attributes, NOT temporary states
4. Focus on: preferences, skills, job info, interests, communication patterns
5. Ignore: emotions, temporary states, opinions about current events
6. Use descriptive keys: "programming_language_preference", "job_title", "timezone"

CRITICAL - NEVER EXTRACT:
- The conversation itself or dialog exchanges
- What the user asked or said in this specific conversation
- What the assistant responded
- Any text containing "User:", "Assistant:", "Human:", "AI:"
- Requests, commands, or instructions (like "generate an image", "write code")
- Responses or outputs (like "here is the image", "I created")

ONLY EXTRACT FACTS ABOUT THE USER:
- Their persistent preferences (favorite color, preferred tools)
- Their background (job, skills, location)
- Their interests and expertise
- NOT what they asked for in this conversation

EXAMPLES OF WHAT TO EXTRACT:
User: "I prefer Python for data science projects"
→ Extract: {{"type": "preference", "key": "programming_language_preference", "value": "Python for data science"}}

User: "I work as a software engineer at Google"
→ Extract: {{"type": "fact", "key": "job_title", "value": "software engineer"}}

EXAMPLES OF WHAT NOT TO EXTRACT:
User: "Generate an image of a cat"
→ DO NOT extract the request itself

User: "Can you help me debug this code?"
→ DO NOT extract "user asked for debugging help"

CONVERSATION:
User: {userMessage}
Assistant: {assistantMessage}

Previous Context: {previousContext}

Extract ONLY persistent facts about the user, NOT the conversation content itself. Return as JSON:
`)

const contextAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the user's conversation patterns and return communication context as JSON.

Return ONLY valid JSON in this exact format:
{{
  "communicationStyle": "formal|casual|technical|friendly|professional",
  "topicsOfInterest": ["topic1", "topic2", "topic3"],
  "expertiseAreas": ["skill1", "skill2"],
  "preferredResponseStyle": "detailed|concise|examples|step-by-step|conversational",
  "patterns": {{
    "typical_question_types": ["code_help", "explanations", "troubleshooting"],
    "complexity_preference": "beginner|intermediate|advanced",
    "interaction_frequency": "frequent|occasional|rare"
  }}
}}

ANALYSIS RULES:
1. Base assessment on actual conversation patterns
2. Identify recurring themes and question types
3. Note technical depth and complexity preferences
4. Assess communication formality and style

CONVERSATION HISTORY:
{conversationHistory}

CURRENT CONTEXT:
{currentContext}

Return updated context as JSON:
`)

/**
 * Check if a text looks like a conversation exchange rather than a user fact/preference
 */
function isConversationExchange(text: string): boolean {
  if (!text) return false
  
  // Patterns that indicate conversation exchanges
  const conversationPatterns = [
    /\bUser:\s/i,
    /\bAssistant:\s/i,
    /\bHuman:\s/i,
    /\bAI:\s/i,
    /\bBot:\s/i,
    /^(You|I|We|They) (said|asked|responded|replied|answered|told|mentioned)/i,
    /^(Say|Tell|Ask|Write|Generate|Create|Make)/i,  // Commands
    /(Here is|Here's|This is) (the|a|an|your)/i,  // Response patterns
  ]
  
  return conversationPatterns.some(pattern => pattern.test(text))
}

export interface ExtractedMemory {
  type: 'preference' | 'fact' | 'context' | 'skill'
  category: string
  key: string
  value: string
  confidence: number
}

export interface UserContextUpdate {
  communicationStyle?: string
  topicsOfInterest?: string[]
  expertiseAreas?: string[]
  preferredResponseStyle?: string
  patterns?: any
}

/**
 * Extract memories from a single conversation exchange with enhanced error handling
 */
export const extractMemoriesFromConversation = maybeTraceable(async (
  userId: string,
  userMessage: string,
  assistantMessage: string,
  previousContext?: any,
  messageId?: string
): Promise<{ memories: ExtractedMemory[]; context: UserContextUpdate }> => {
  return trackMemoryExtraction(async () => {
    console.log(`🧠 [MEMORY TRACE] Starting memory extraction for user: ${userId}`)
    console.log(`📝 [MEMORY TRACE] User message length: ${userMessage.length}, Assistant message length: ${assistantMessage.length}`)
    
    const maxRetries = 3
    let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [MEMORY TRACE] Memory extraction attempt ${attempt}/${maxRetries}`)
      const chain = memoryExtractionPrompt.pipe(llm).pipe(parser)
      
      // Use circuit breaker to protect against Groq API failures
      const result = await groqCircuitBreaker.execute(
        async () => await chain.invoke({
          userMessage,
          assistantMessage,
          previousContext: previousContext ? JSON.stringify(previousContext) : 'None'
        }),
        async () => {
          console.warn('Memory extraction fallback: returning empty result due to API failure')
          return { memories: [], context: {} }
        }
      )

      // Validate the result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format: Expected object')
      }

      // Validate memories array
      if (result.memories && !Array.isArray(result.memories)) {
        console.warn('Invalid memories format, skipping memory storage')
        result.memories = []
      }

      // Store extracted memories with validation
      if (result.memories && Array.isArray(result.memories)) {
        console.log(`💾 [MEMORY TRACE] Storing ${result.memories.length} extracted memories`)
        for (const memory of result.memories) {
          // Validate memory structure
          if (!memory.type || !memory.key || !memory.value) {
            console.warn('⚠️ [MEMORY TRACE] Skipping invalid memory:', memory)
            continue
          }

          // Check if this looks like a conversation exchange
          if (isConversationExchange(memory.key) || isConversationExchange(memory.value)) {
            console.warn('🚫 [MEMORY TRACE] Skipping conversation-like memory:', {
              key: memory.key.substring(0, 50),
              value: memory.value.substring(0, 50)
            })
            continue
          }

          // Additional check: Skip if value contains newlines with dialog patterns
          if (memory.value.includes('\n') && 
              (memory.value.includes('User:') || memory.value.includes('Assistant:'))) {
            console.warn('🚫 [MEMORY TRACE] Skipping multi-line conversation memory')
            continue
          }

          // Ensure confidence is within valid range
          const confidence = Math.min(1.0, Math.max(0.0, memory.confidence || 0.5))
          
          console.log(`📋 [MEMORY TRACE] Storing memory: ${memory.key} = ${memory.value} (confidence: ${confidence})`)

          await storeUserMemory(
            userId,
            memory.type,
            memory.category || 'general',
            memory.key,
            memory.value,
            confidence,
            'conversation',
            messageId
          )
        }
        console.log(`✅ [MEMORY TRACE] Successfully stored ${result.memories.length} memories`)
      } else {
        console.log(`📭 [MEMORY TRACE] No memories to store`)
      }

      // Update user context with validation
      if (result.context && typeof result.context === 'object') {
        console.log(`🎯 [MEMORY TRACE] Updating user context:`, result.context)
        await updateUserContext(userId, result.context)
        console.log(`✅ [MEMORY TRACE] User context updated successfully`)
      } else {
        console.log(`🚫 [MEMORY TRACE] No context update needed`)
      }

      return {
        memories: result.memories || [],
        context: result.context || {}
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`❌ [MEMORY TRACE] Memory extraction attempt ${attempt}/${maxRetries} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 2^attempt seconds
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

    console.error('❌ [MEMORY TRACE] Memory extraction failed after all retries:', lastError?.message)
    return { memories: [], context: {} }
  })
}, { 
  name: "extractMemoriesFromConversation",
  tags: ["memory", "extraction", "lotus"],
  metadata: { 
    operation: "memory_extraction",
    service: "memory_service" 
  }
})

/**
 * Analyze conversation history to update user context with enhanced error handling
 */
export async function analyzeConversationHistory(
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  currentContext?: any
): Promise<UserContextUpdate> {
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const chain = contextAnalysisPrompt.pipe(llm).pipe(parser)
      
      const historyText = conversationHistory
        .slice(-10) // Last 10 messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      if (!historyText.trim()) {
        console.warn('Empty conversation history, skipping analysis')
        return {}
      }

      // Use circuit breaker for context analysis as well
      const result = await groqCircuitBreaker.execute(
        async () => await chain.invoke({
          conversationHistory: historyText,
          currentContext: currentContext ? JSON.stringify(currentContext) : 'None'
        }),
        async () => {
          console.warn('Context analysis fallback: returning empty result due to API failure')
          return {}
        }
      )

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid context analysis result format')
      }

      // Update user context with new analysis
      await updateUserContext(userId, result)

      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Context analysis attempt ${attempt}/${maxRetries} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  console.error('Conversation history analysis failed after all retries:', lastError?.message)
  return {}
}

/**
 * Process a message and extract memories in the background
 */
export const processMessageForMemories = maybeTraceable(async (
  userId: string,
  userMessage: string,
  assistantMessage: string,
  messageId?: string
): Promise<void> => {
  // Run memory extraction in the background (don't await)
  setImmediate(async () => {
    try {
      console.log(`🚀 [MEMORY TRACE] Starting background memory processing for user: ${userId}`)
      
      await extractMemoriesFromConversation(
        userId,
        userMessage,
        assistantMessage,
        undefined,
        messageId
      )

      // Also store the conversation as embeddings for semantic search
      console.log(`📊 [MEMORY TRACE] Storing conversation embedding`)
      await storeEmbedding(
        userId,
        `User: ${userMessage}\nAssistant: ${assistantMessage}`,
        'message',
        {
          userMessage,
          assistantMessage,
          messageId,
          timestamp: new Date().toISOString()
        }
      )
      console.log(`✅ [MEMORY TRACE] Background memory processing completed successfully`)
    } catch (error) {
      console.error('❌ [MEMORY TRACE] Background memory processing failed:', error)
    }
  })
}, {
  name: "processMessageForMemories",
  tags: ["memory", "background", "lotus"],
  metadata: { 
    operation: "background_memory_processing",
    service: "memory_service" 
  }
})

/**
 * Get relevant memories for a user query
 */
export const getRelevantMemories = maybeTraceable(async (
  userId: string,
  query: string,
  limit: number = 5
): Promise<Array<{
  type: string
  key: string
  value: string
  confidence: number
  similarity?: number
}>> => {
  try {
    // Short-TTL in-process cache to avoid repeated DB+embedding for similar prompts
    const cacheKey = `${userId}::${query.trim().toLowerCase()}::${limit}`
    const cached = memoryRetrievalCache.get(cacheKey)
    if (cached) {
      return cached
    }
    console.log(`🔍 [MEMORY TRACE] Searching memories for user ${userId}, query: "${query}", limit: ${limit}`)
    const { searchSimilarMemories } = await import('./embeddings')
    const { prisma } = await import('./prisma')

    // Run semantic vector search and structured lookup in parallel
    const [semanticResults, structuredMemories] = await Promise.all([
      searchSimilarMemories(userId, query, 0.7, limit),
      prisma.userMemory.findMany({
        where: {
          userId,
          OR: [
            { key: { contains: query, mode: 'insensitive' } },
            { value: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: { confidence: 'desc' },
        take: Math.min(limit, 5),
        select: { type: true, key: true, value: true, confidence: true },
      })
    ])
    console.log(`🧠 [MEMORY TRACE] Found ${semanticResults.length} semantic, ${structuredMemories.length} structured`)

    // Combine and deduplicate results
    const combined = [
      ...semanticResults.map(r => ({
        type: r.type,
        key: r.content,
        value: r.content,
        confidence: 1.0,
        similarity: r.similarity
      })),
      ...structuredMemories.map(m => ({
        type: m.type,
        key: m.key,
        value: m.value,
        confidence: m.confidence
      }))
    ]

    // Filter out any conversation-like memories before returning
    const filtered = combined.filter(memory => {
      // Skip if the value looks like a conversation
      if (isConversationExchange(memory.value)) {
        console.log(`🚫 [MEMORY TRACE] Filtering out conversation-like memory from results`)
        return false
      }
      // Skip if value contains dialog patterns
      if (memory.value.includes('\n') && 
          (memory.value.includes('User:') || memory.value.includes('Assistant:'))) {
        console.log(`🚫 [MEMORY TRACE] Filtering out multi-line conversation from results`)
        return false
      }
      return true
    })
    
    const finalResults = filtered.slice(0, limit)
    memoryRetrievalCache.set(cacheKey, finalResults)
    console.log(`📊 [MEMORY TRACE] Returning ${finalResults.length} filtered results (removed ${combined.length - filtered.length} conversation-like memories)`)
    return finalResults
  } catch (error) {
    console.error('❌ [MEMORY TRACE] Error getting relevant memories:', error)
    return []
  }
}, {
  name: "getRelevantMemories",
  tags: ["memory", "search", "lotus"],
  metadata: { 
    operation: "memory_search",
    service: "memory_service" 
  }
})
