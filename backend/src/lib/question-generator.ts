/**
 * Dynamic Question Generator
 * Uses memories to generate contextual questions for the user
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { adaptiveMemory } from './adaptive-memory'
import { prisma } from './prisma'
import { groqCircuitBreaker } from './circuit-breaker'
import { traceable } from 'langsmith/traceable'

// Use a faster model for question generation
const llm = new ChatOpenAI({
  model: 'openai/gpt-3.5-turbo', // Faster model for quick generation
  temperature: 0.3,
  apiKey: process.env.OPENROUTER_API_KEY,
  maxRetries: 2, // Reduced retries
  timeout: 10000, // Reduced timeout
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://lotus-backend.vercel.app',
      'X-Title': 'AI Question Generation',
    },
  },
})

const parser = new JsonOutputParser()

const questionGenerationPrompt = PromptTemplate.fromTemplate(`
You generate the next things the user is likely to ask the assistant, based on their RECENT memories and overall context.

Produce 4 concise first-person prompts/requests the user would type to the assistant (not the assistant asking the user questions).

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "text": "A specific first-person prompt/request",
      "category": "technical|creative|personal|general",
      "reasoning": "Why this is relevant now based on recent memories"
    }}
  ]
}}

RULES:
1. Write from the user's perspective addressing the assistant (e.g., "Summarize my last meeting notes", "Draft a follow-up email to Sam").
2. NEVER ask the user questions about themselves (avoid "What is your...", "Do you...").
3. Prefer recent memories; tie suggestions to recent topics, tasks, people, or tools when possible.
4. Be specific and actionable; avoid vague or yes/no prompts.
5. Vary categories and keep to <= 80 characters when possible.
6. If no memories are available, generate generally useful prompts.

RECENT MEMORIES (prioritize):
{recentMemories}

ALL MEMORIES (fallback/context):
{memories}

USER CONTEXT:
{userContext}

Generate exactly 4 personalized prompts as JSON:
`)

const fallbackQuestions: GeneratedQuestion[] = [
  {
    text: "Explain quantum computing",
    category: "technical",
    reasoning: "General technical interest"
  },
  {
    text: "Write a haiku about coding",
    category: "creative",
    reasoning: "Creative technical expression"
  },
  {
    text: "Compare React vs Vue",
    category: "technical",
    reasoning: "Web development comparison"
  },
  {
    text: "Plan a weekend trip",
    category: "personal",
    reasoning: "Personal planning assistance"
  }
]

export interface GeneratedQuestion {
  text: string
  category: 'technical' | 'creative' | 'personal' | 'general'
  reasoning: string
}

export interface QuestionGenerationResult {
  questions: GeneratedQuestion[]
  isPersonalized: boolean
  source: 'memories' | 'fallback'
}

/**
 * Generate dynamic questions based on user memories and context
 */
export const generateDynamicQuestions = traceable(async (
  userId: string
): Promise<QuestionGenerationResult> => {
  console.log(`🎯 [QUESTION_GEN] Generating dynamic questions for user: ${userId}`)

  try {
    // Run memory retrieval in parallel for faster loading
    const [memoryResult, recentRaw] = await Promise.all([
      // Get adaptive memories
      adaptiveMemory.retrieveAdaptiveMemories(
        userId,
        "generate personalized questions",
        undefined
      ),
      // Get recent memories directly
      prisma.userMemory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8, // Reduced to speed up
        select: { type: true, key: true, value: true, confidence: true }
      })
    ])

    console.log(`📚 [QUESTION_GEN] Found ${memoryResult.memories.length} adaptive + ${recentRaw.length} recent memories`)

    // Filter out conversation-like entries
    const recentFiltered = recentRaw.filter(m => {
      const v = `${m.key} ${m.value}`
      if (/\b(User|Assistant|Human|AI|Bot):\s/i.test(v)) return false
      if (/^(You|I|We|They) (said|asked|responded|replied|answered|told|mentioned)/i.test(v)) return false
      return true
    })

    // If we have no meaningful memories, use fallback questions
    if (memoryResult.memories.length === 0 && recentFiltered.length === 0) {
      console.log(`📭 [QUESTION_GEN] No memories found, using fallback questions`)
      return {
        questions: fallbackQuestions,
        isPersonalized: false,
        source: 'fallback'
      }
    }

    // Format memories for the prompt
    const memoriesText = memoryResult.memories
      .map(memory => `- ${memory.key}: ${memory.value} (type: ${memory.type}, confidence: ${memory.confidence})`)
      .join('\n')

    const recentMemoriesText = recentFiltered
      .map(memory => `- ${memory.key}: ${memory.value} (type: ${memory.type}, confidence: ${memory.confidence})`)
      .join('\n') || 'None'

    const contextText = memoryResult.context ? JSON.stringify(memoryResult.context, null, 2) : 'None'

    console.log(`🎨 [QUESTION_GEN] Generating personalized questions using AI`)
    
    // Skip AI generation if we have very few memories - use smart fallback
    if (memoryResult.memories.length < 3 && recentFiltered.length < 2) {
      console.log(`⚡ [QUESTION_GEN] Using smart fallback for sparse memories`)
      return {
        questions: fallbackQuestions,
        isPersonalized: false,
        source: 'fallback'
      }
    }

    const maxRetries = 1 // Reduced retries for faster response
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const chain = questionGenerationPrompt.pipe(llm).pipe(parser)

        const result = await groqCircuitBreaker.execute(
          async () => await chain.invoke({
            memories: memoriesText.slice(0, 1500), // Limit context size
            recentMemories: recentMemoriesText.slice(0, 1000),
            userContext: contextText.slice(0, 500)
          }),
          async () => {
            console.warn('Question generation fallback: using fallback questions due to API failure')
            return { questions: fallbackQuestions }
          }
        )

        // Validate result structure
        if (!result || !Array.isArray(result.questions)) {
          throw new Error('Invalid response format: Expected questions array')
        }

        // Validate each question
        const validQuestions = result.questions
          .filter(q => q.text && q.category && q.reasoning)
          .slice(0, 4) // Ensure we only return 4 questions

        if (validQuestions.length === 0) {
          throw new Error('No valid questions generated')
        }

        console.log(`✅ [QUESTION_GEN] Generated ${validQuestions.length} personalized questions`)
        return {
          questions: validQuestions,
          isPersonalized: true,
          source: 'memories'
        }

      } catch (error) {
        console.error(`❌ [QUESTION_GEN] Attempt ${attempt}/${maxRetries} failed:`, error)
        if (attempt === maxRetries) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // This should never be reached due to the throw above, but TypeScript needs it
    throw new Error('All attempts failed')

  } catch (error) {
    console.error('❌ [QUESTION_GEN] Question generation failed, using fallback:', error)
    return {
      questions: fallbackQuestions,
      isPersonalized: false,
      source: 'fallback'
    }
  }
}, {
  name: "generateDynamicQuestions",
  tags: ["questions", "personalization", "lotus"],
  metadata: { 
    operation: "question_generation",
    service: "question_service" 
  }
})

/**
 * Get icon mapping for question categories
 */
export function getQuestionIcon(category: string): string {
  switch (category) {
    case 'technical':
      return 'Search'
    case 'creative':
      return 'Sparkles'
    case 'personal':
      return 'MessageCircle'
    case 'general':
    default:
      return 'Plus'
  }
}

/**
 * Generate questions with caching for better performance
 */
const questionCache = new Map<string, { questions: QuestionGenerationResult; timestamp: number }>()
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes - increased cache duration

export const getCachedDynamicQuestions = async (userId: string): Promise<QuestionGenerationResult> => {
  const cacheKey = `questions_${userId}`
  const cached = questionCache.get(cacheKey)
  
  // Check if cache is still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`💨 [QUESTION_GEN] Using cached questions for user: ${userId}`)
    return cached.questions
  }

  // Generate new questions
  const questions = await generateDynamicQuestions(userId)
  
  // Cache the result
  questionCache.set(cacheKey, {
    questions,
    timestamp: Date.now()
  })

  return questions
}

/**
 * Clear question cache for a user (useful when their memories are updated)
 */
export const clearQuestionCache = (userId: string): void => {
  const cacheKey = `questions_${userId}`
  questionCache.delete(cacheKey)
  console.log(`🧹 [QUESTION_GEN] Cleared question cache for user: ${userId}`)
}
