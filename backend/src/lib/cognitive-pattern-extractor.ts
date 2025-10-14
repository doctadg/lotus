/**
 * Cognitive Pattern Extractor for Deep User Understanding
 * This module extracts cognitive patterns from conversations to understand how users think
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { CognitivePattern, ThinkingStyle, DecisionMakingStyle, LearningStyle, ProblemSolvingStyle } from './enhanced-memory-types'
import { prisma } from './prisma'
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
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://mky-backend.vercel.app',
      'X-Title': 'Cognitive Pattern Extraction',
    },
  },
})

const parser = new JsonOutputParser()

// Cognitive pattern analysis prompt
const cognitivePatternAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the conversation for cognitive patterns that reveal how the user thinks and processes information.

Return ONLY valid JSON in this exact format:
{
  "thinkingStyle": {
    "value": "linear|associative|systematic|creative|analytical|holistic",
    "confidence": 0.0-1.0,
    "evidence": ["evidence from conversation"],
    "indicators": ["specific indicators of this thinking style"]
  },
  "decisionMakingStyle": {
    "value": "analytical|intuitive|collaborative|independent|deliberate|impulsive",
    "confidence": 0.0-1.0,
    "evidence": ["evidence from conversation"],
    "factors": ["factors that influence their decisions"]
  },
  "learningStyle": {
    "value": "visual|auditory|kinesthetic|reading|experiential|observational",
    "confidence": 0.0-1.0,
    "evidence": ["evidence from conversation"],
    "preferences": ["learning preferences observed"]
  },
  "problemSolvingStyle": {
    "value": "step_by_step|holistic|trial_and_error|research_heavy|collaborative",
    "confidence": 0.0-1.0,
    "evidence": ["evidence from conversation"],
    "approach": ["problem-solving approach observed"]
  },
  "communicationStyle": {
    "value": "formal|casual|technical|friendly|professional|expressive",
    "confidence": 0.0-1.0,
    "evidence": ["evidence from conversation"],
    "characteristics": ["communication characteristics"]
  }
}

ANALYSIS GUIDELINES:
1. Look for patterns in how they structure their thoughts
2. Identify decision-making approaches
3. Recognize learning preferences from how they ask questions
4. Note problem-solving strategies
5. Observe communication patterns and style
6. Provide specific evidence from the conversation
7. Assign confidence based on clarity of evidence

CONVERSATION HISTORY:
{conversationHistory}

Return cognitive pattern analysis as JSON:
`)

/**
 * Extract cognitive patterns from conversation history
 */
export const extractCognitivePatterns = maybeTraceable(async (
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<CognitivePattern[]> => {
  return trackMemoryExtraction(async () => {
    console.log(`🧠 [COGNITIVE PATTERNS] Starting pattern extraction for user: ${userId}`)
    
    try {
      const chain = cognitivePatternAnalysisPrompt.pipe(llm).pipe(parser)
      
      const historyText = conversationHistory
        .slice(-20) // Last 20 messages for pattern analysis
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      if (!historyText.trim()) {
        console.warn('Empty conversation history, skipping cognitive pattern analysis')
        return []
      }

      const result = await groqCircuitBreaker.execute(
        async () => await chain.invoke({ conversationHistory: historyText }),
        async () => {
          console.warn('Cognitive pattern analysis fallback: returning empty result')
          return {}
        }
      )

      const patterns: any[] = []
      
      // Convert the result to cognitive pattern format
      Object.entries(result).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object' && value.value) {
          patterns.push({
            patternType: key,
            patternValue: value.value,
            confidence: value.confidence || 0.5,
            evidence: value.evidence || [],
            context: [
              ...(value.indicators || []),
              ...(value.factors || []),
              ...(value.preferences || []),
              ...(value.characteristics || [])
            ].filter(Boolean).join(', ')
          })
        }
      })

      console.log(`📊 [COGNITIVE PATTERNS] Extracted ${patterns.length} patterns`)

      // Store patterns in database using raw SQL for now
      await storeCognitivePatterns(userId, patterns)

      return patterns.map((p, index) => ({
        id: `cognitive_${userId}_${index}_${Date.now()}`,
        userId,
        patternType: p.patternType,
        patternValue: p.patternValue,
        confidence: p.confidence,
        evidence: p.evidence,
        lastObserved: new Date(),
        observationCount: 1,
        strength: p.confidence,
        context: p.context,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

    } catch (error) {
      console.error('❌ [COGNITIVE PATTERNS] Error extracting patterns:', error)
      return []
    }
  })
}, {
  name: "extractCognitivePatterns",
  tags: ["cognitive", "patterns", "extraction"],
  metadata: { 
    operation: "cognitive_pattern_extraction",
    service: "mirror_system" 
  }
})

/**
 * Store cognitive patterns in database using raw SQL
 */
async function storeCognitivePatterns(userId: string, patterns: any[]): Promise<void> {
  for (const pattern of patterns) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "cognitive_patterns" (
          id, "userId", "pattern_type", "pattern_value", "confidence", 
          "evidence", "last_observed", "observation_count", "strength", "context",
          "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid()::text,
          ${userId},
          ${pattern.patternType},
          ${pattern.patternValue},
          ${pattern.confidence},
          ${JSON.stringify(pattern.evidence)}::jsonb,
          NOW(),
          1,
          ${pattern.confidence},
          ${pattern.context},
          NOW(),
          NOW()
        )
        ON CONFLICT ("userId", "pattern_type", "pattern_value") 
        DO UPDATE SET
          "confidence" = GREATEST("cognitive_patterns"."confidence", EXCLUDED.confidence),
          "evidence" = EXCLUDED.evidence,
          "last_observed" = NOW(),
          "observation_count" = "cognitive_patterns"."observation_count" + 1,
          "strength" = LEAST("cognitive_patterns"."strength" * 1.1, 1.0),
          "context" = EXCLUDED.context,
          "updated_at" = NOW()
      `
    } catch (error) {
      console.error('Error storing cognitive pattern:', error)
    }
  }
}

/**
 * Get cognitive patterns for a user
 */
export const getCognitivePatterns = maybeTraceable(async (
  userId: string
): Promise<CognitivePattern[]> => {
  try {
    const patterns = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "userId" as "userId",
        "pattern_type" as "patternType",
        "pattern_value" as "patternValue",
        confidence,
        evidence,
        "last_observed" as "lastObserved",
        "observation_count" as "observationCount",
        strength,
        context,
        "created_at" as "createdAt",
        "updated_at" as "updatedAt"
      FROM "cognitive_patterns"
      WHERE "userId" = ${userId}
      ORDER BY strength DESC, "last_observed" DESC
    `

    return patterns.map(p => ({
      ...p,
      lastObserved: new Date(p.lastObserved),
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }))

  } catch (error) {
    console.error('Error getting cognitive patterns:', error)
    return []
  }
}, {
  name: "getCognitivePatterns",
  tags: ["cognitive", "patterns", "retrieval"],
  metadata: { 
    operation: "cognitive_pattern_retrieval",
    service: "mirror_system" 
  }
})

/**
 * Analyze thinking style from a single message
 */
export const analyzeThinkingStyle = maybeTraceable(async (
  userId: string,
  message: string
): Promise<ThinkingStyle | null> => {
  try {
    // Simple pattern matching for thinking styles
    const patterns = {
      linear: /\b(first|then|next|finally|step|order|sequence|in order)\b/i,
      associative: /\b(reminds me|similar to|like|connected|related|association)\b/i,
      systematic: /\b(system|organize|structure|framework|methodical|process)\b/i,
      creative: /\b(imagine|create|design|innovate|brainstorm|artistic)\b/i,
      analytical: /\b(analyze|break down|examine|evaluate|logical|reason)\b/i,
      holistic: /\b(big picture|overall|whole|complete|comprehensive)\b/i
    }

    let detectedStyle: ThinkingStyle | null = null
    let maxMatches = 0

    Object.entries(patterns).forEach(([style, pattern]) => {
      const matches = (message.match(pattern) || []).length
      if (matches > maxMatches) {
        maxMatches = matches
        detectedStyle = style as ThinkingStyle
      }
    })

    if (detectedStyle && maxMatches > 0) {
      // Store this observation
      await storeCognitivePatterns(userId, [{
        patternType: 'thinking_style',
        patternValue: detectedStyle,
        confidence: Math.min(maxMatches * 0.3, 0.8),
        evidence: [`Detected in message: "${message.substring(0, 100)}..."`],
        context: 'Single message analysis'
      }])
    }

    return detectedStyle

  } catch (error) {
    console.error('Error analyzing thinking style:', error)
    return null
  }
}, {
  name: "analyzeThinkingStyle",
  tags: ["cognitive", "thinking_style", "analysis"],
  metadata: { 
    operation: "thinking_style_analysis",
    service: "mirror_system" 
  }
})

/**
 * Get user's dominant cognitive patterns
 */
export const getDominantCognitivePatterns = maybeTraceable(async (
  userId: string
): Promise<{
  thinkingStyle?: { value: string; confidence: number }
  decisionMakingStyle?: { value: string; confidence: number }
  learningStyle?: { value: string; confidence: number }
  problemSolvingStyle?: { value: string; confidence: number }
  communicationStyle?: { value: string; confidence: number }
}> => {
  try {
    const patterns = await getCognitivePatterns(userId)
    
    const result: any = {}
    
    // Group by pattern type and find the strongest for each type
    const grouped = patterns.reduce((acc: any, pattern: CognitivePattern) => {
      if (!acc[pattern.patternType]) {
        acc[pattern.patternType] = []
      }
      acc[pattern.patternType].push(pattern)
      return acc
    }, {} as Record<string, CognitivePattern[]>)

    Object.entries(grouped).forEach(([type, typePatterns]: [string, any]) => {
      if (typePatterns && typePatterns.length > 0) {
        const strongest = typePatterns.reduce((max: CognitivePattern, pattern: CognitivePattern) => 
          pattern.strength > max.strength ? pattern : max
        )
        
        result[type] = {
          value: strongest.patternValue,
          confidence: strongest.confidence
        }
      }
    })

    return result

  } catch (error) {
    console.error('Error getting dominant cognitive patterns:', error)
    return {}
  }
}, {
  name: "getDominantCognitivePatterns",
  tags: ["cognitive", "patterns", "dominant"],
  metadata: { 
    operation: "dominant_cognitive_patterns",
    service: "mirror_system" 
  }
})