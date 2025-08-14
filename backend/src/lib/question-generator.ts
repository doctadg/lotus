/**
 * Dynamic Question Generator
 * Uses memories to generate contextual questions for the user
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { adaptiveMemory } from './adaptive-memory'
import { groqCircuitBreaker } from './circuit-breaker'
import { traceable } from 'langsmith/traceable'

const llm = new ChatOpenAI({
  model: 'openai/gpt-oss-20b',
  temperature: 0.3,
  apiKey: process.env.OPENROUTER_API_KEY,
  maxRetries: 3,
  timeout: 30000,
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
You are a helpful assistant that generates personalized conversation starters based on a user's interests and context.

Based on the user's memories and context below, generate 4 engaging questions or conversation starters that would be interesting to them.

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "text": "A specific question or prompt",
      "category": "technical|creative|personal|general",
      "reasoning": "Why this question is relevant to the user"
    }}
  ]
}}

RULES:
1. Make questions specific and actionable
2. Use the user's interests, skills, and preferences from their memories
3. Vary the categories and types of questions
4. Keep questions concise (under 50 characters when possible)
5. Make them conversation starters, not yes/no questions
6. If no memories are available, generate general interesting questions

USER MEMORIES:
{memories}

USER CONTEXT:
{userContext}

Generate 4 personalized questions as JSON:
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
    // Get user memories and context
    console.log(`🧠 [QUESTION_GEN] Retrieving user memories and context`)
    const memoryResult = await adaptiveMemory.retrieveAdaptiveMemories(
      userId, 
      "generate personalized questions", // Generic query to get diverse memories
      undefined
    )

    console.log(`📚 [QUESTION_GEN] Found ${memoryResult.memories.length} memories`)

    // If we have no meaningful memories, use fallback questions
    if (memoryResult.memories.length === 0) {
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

    const contextText = memoryResult.context ? JSON.stringify(memoryResult.context, null, 2) : 'None'

    console.log(`🎨 [QUESTION_GEN] Generating personalized questions using AI`)
    
    const maxRetries = 2
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const chain = questionGenerationPrompt.pipe(llm).pipe(parser)
        
        const result = await groqCircuitBreaker.execute(
          async () => await chain.invoke({
            memories: memoriesText,
            userContext: contextText
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
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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