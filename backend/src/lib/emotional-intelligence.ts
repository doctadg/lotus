/**
 * Emotional Intelligence Layer for Deep User Understanding
 * This module analyzes emotional patterns, triggers, and regulation strategies
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { EmotionalProfile, EmotionalTrigger, CopingMechanism } from './enhanced-memory-types'
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
      'X-Title': 'Emotional Intelligence Analysis',
    },
  },
})

const parser = new JsonOutputParser()

// Emotional analysis prompt
const emotionalAnalysisPrompt = PromptTemplate.fromTemplate(`
Analyze the conversation for emotional intelligence indicators. Look for emotional patterns, triggers, and regulation strategies.

Return ONLY valid JSON in this exact format:
{
  "emotionalState": {
    "currentMood": "optimistic|realistic|pessimistic|variable",
    "emotionalIntensity": 0.0-1.0,
    "emotionalStability": 0.0-1.0,
    "dominantEmotions": ["emotion1", "emotion2"]
  },
  "emotionalTriggers": [
    {
      "type": "topic|situation|person|time|environment|word|event",
      "trigger": "specific trigger",
      "typicalResponse": "positive|negative|neutral|mixed|anxious|excited",
      "intensity": 0.0-1.0,
      "frequency": "high|medium|low",
      "context": "context where trigger occurs"
    }
  ],
  "copingMechanisms": [
    {
      "trigger": "situation that triggers coping",
      "strategy": "coping strategy used",
      "effectiveness": 0.0-1.0,
      "category": "behavioral|cognitive|emotional|social",
      "description": "how the strategy works"
    }
  ],
  "emotionalVocabulary": ["emotional words and phrases used"],
  "emotionalRegulation": {
    "awareness": 0.0-1.0,
    "regulationStrategies": ["strategies used to manage emotions"],
    "emotionalIntelligence": 0.0-1.0,
    "impulseControl": 0.0-1.0
  },
  "empathyIndicators": {
    "level": 0.0-1.0,
    "evidence": ["evidence of empathetic responses"],
    "perspectiveTaking": 0.0-1.0
  },
  "stressIndicators": [
    {
      "indicator": "specific stress indicator",
      "level": 0.0-1.0,
      "frequency": "high|medium|low",
      "triggers": ["triggers for this stress"],
      "mitigation": ["mitigation strategies"]
    }
  ]
}

EMOTIONAL ANALYSIS GUIDELINES:
1. Identify emotional states and their intensity
2. Recognize emotional triggers and patterns
3. Note coping mechanisms and their effectiveness
4. Assess emotional vocabulary and expression
5. Evaluate emotional regulation strategies
6. Look for empathy and perspective-taking
7. Identify stress indicators and management
8. Consider context and frequency of patterns

CONVERSATION:
{conversation}

Return emotional analysis as JSON:
`)

// Real-time emotion detection prompt
const emotionDetectionPrompt = PromptTemplate.fromTemplate(`
Detect the emotional content of this message and identify any emotional triggers or patterns.

Return ONLY valid JSON in this exact format:
{
  "primaryEmotion": "joy|sadness|anger|fear|surprise|disgust|anticipation|trust|love|neutral",
  "emotionalIntensity": 0.0-1.0,
  "emotionalValence": "positive|negative|neutral|mixed",
  "triggers": ["identified emotional triggers"],
  "copingIndicators": ["any coping mechanisms mentioned"],
  "stressLevel": 0.0-1.0,
  "emotionalVocabulary": ["emotional words used"],
  "empathyLevel": 0.0-1.0,
  "selfAwareness": 0.0-1.0
}

MESSAGE: {message}

Return emotion detection as JSON:
`)

/**
 * Analyze emotional patterns from conversation
 */
export const analyzeEmotionalPatterns = maybeTraceable(async (
  userId: string,
  conversation: string
): Promise<any> => {
  return trackMemoryExtraction(async () => {
    console.log(`💭 [EMOTIONAL INTELLIGENCE] Starting emotional analysis for user: ${userId}`)
    
    try {
      const chain = emotionalAnalysisPrompt.pipe(llm).pipe(parser)
      
      const result = await groqCircuitBreaker.execute(
        async () => await chain.invoke({ conversation }),
        async () => {
          console.warn('Emotional analysis fallback: returning empty result')
          return {}
        }
      )

      if (result && Object.keys(result).length > 0) {
        await storeEmotionalProfile(userId, result)
        console.log(`✅ [EMOTIONAL INTELLIGENCE] Stored emotional profile for user: ${userId}`)
      }

      return result

    } catch (error) {
      console.error('❌ [EMOTIONAL INTELLIGENCE] Error analyzing emotional patterns:', error)
      return {}
    }
  })
}, {
  name: "analyzeEmotionalPatterns",
  tags: ["emotional", "intelligence", "analysis"],
  metadata: { 
    operation: "emotional_pattern_analysis",
    service: "mirror_system" 
  }
})

/**
 * Detect emotions in real-time from a single message
 */
export const detectEmotions = maybeTraceable(async (
  userId: string,
  message: string
): Promise<any> => {
  return trackMemoryExtraction(async () => {
    try {
      const chain = emotionDetectionPrompt.pipe(llm).pipe(parser)
      
      const result = await groqCircuitBreaker.execute(
        async () => await chain.invoke({ message }),
        async () => ({
          primaryEmotion: 'neutral',
          emotionalIntensity: 0.1,
          emotionalValence: 'neutral',
          triggers: [],
          copingIndicators: [],
          stressLevel: 0.1,
          emotionalVocabulary: [],
          empathyLevel: 0.5,
          selfAwareness: 0.5
        })
      )

      // Store emotional triggers if detected
      if (result.triggers && result.triggers.length > 0) {
        await storeEmotionalTriggers(userId, result.triggers, result)
      }

      return result

    } catch (error) {
      console.error('Error detecting emotions:', error)
      return {
        primaryEmotion: 'neutral',
        emotionalIntensity: 0.1,
        emotionalValence: 'neutral',
        triggers: [],
        copingIndicators: [],
        stressLevel: 0.1,
        emotionalVocabulary: [],
        empathyLevel: 0.5,
        selfAwareness: 0.5
      }
    }
  })
}, {
  name: "detectEmotions",
  tags: ["emotional", "detection", "realtime"],
  metadata: { 
    operation: "realtime_emotion_detection",
    service: "mirror_system" 
  }
})

/**
 * Store emotional profile in database
 */
async function storeEmotionalProfile(userId: string, analysis: any): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "emotional_profiles" (
        id, "userId", "baseline_mood", "emotional_triggers", "coping_mechanisms",
        "stress_indicators", "emotional_vocabulary", "empathy_level", "emotional_regulation",
        "last_updated", "created_at", "updated_at"
      ) VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${analysis.emotionalState?.currentMood},
        ${JSON.stringify(analysis.emotionalTriggers || [])}::jsonb,
        ${JSON.stringify(analysis.copingMechanisms || [])}::jsonb,
        ${JSON.stringify(analysis.stressIndicators || [])}::jsonb,
        ${analysis.emotionalVocabulary || []},
        ${analysis.empathyIndicators?.level},
        ${JSON.stringify(analysis.emotionalRegulation || {})}::jsonb,
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT ("userId") 
      DO UPDATE SET
        "baseline_mood" = COALESCE(EXCLUDED.baseline_mood, "emotional_profiles"."baseline_mood"),
        "emotional_triggers" = EXCLUDED."emotional_triggers",
        "coping_mechanisms" = EXCLUDED."coping_mechanisms",
        "stress_indicators" = EXCLUDED."stress_indicators",
        "emotional_vocabulary" = EXCLUDED."emotional_vocabulary",
        "empathy_level" = COALESCE(EXCLUDED.empathy_level, "emotional_profiles"."empathy_level"),
        "emotional_regulation" = EXCLUDED."emotional_regulation",
        "last_updated" = NOW(),
        "updated_at" = NOW()
    `
  } catch (error) {
    console.error('Error storing emotional profile:', error)
  }
}

/**
 * Store emotional triggers
 */
async function storeEmotionalTriggers(userId: string, triggers: string[], emotionData: any): Promise<void> {
  try {
    for (const trigger of triggers) {
      await prisma.$executeRaw`
        INSERT INTO "emotional_triggers" (
          id, "userId", "trigger_type", "trigger", "typical_response",
          "intensity", "frequency", "context", "created_at"
        ) VALUES (
          gen_random_uuid()::text,
          ${userId},
          'word',
          ${trigger},
          ${emotionData.emotionalValence},
          ${emotionData.emotionalIntensity},
          'medium',
          'detected in message',
          NOW()
        )
        ON CONFLICT DO NOTHING
      `
    }
  } catch (error) {
    console.error('Error storing emotional triggers:', error)
  }
}

/**
 * Get emotional profile for a user
 */
export const getEmotionalProfile = maybeTraceable(async (
  userId: string
): Promise<EmotionalProfile | null> => {
  try {
    const profile = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "userId" as "userId",
        "baseline_mood" as "baselineMood",
        "emotional_triggers" as "emotionalTriggers",
        "coping_mechanisms" as "copingMechanisms",
        "stress_indicators" as "stressIndicators",
        "emotional_vocabulary" as "emotionalVocabulary",
        "empathy_level" as "empathyLevel",
        "emotional_regulation" as "emotionalRegulation",
        "last_updated" as "lastUpdated",
        "created_at" as "createdAt",
        "updated_at" as "updatedAt"
      FROM "emotional_profiles"
      WHERE "userId" = ${userId}
      LIMIT 1
    `

    if (profile.length === 0) {
      return null
    }

    const p = profile[0]
    return {
      id: p.id,
      userId: p.userId,
      baselineMood: p.baselineMood,
      emotionalTriggers: p.emotionalTriggers || [],
      copingMechanisms: p.copingMechanisms || [],
      stressIndicators: p.stressIndicators || [],
      emotionalVocabulary: p.emotionalVocabulary || [],
      empathyLevel: p.empathyLevel,
      emotionalRegulation: p.emotionalRegulation || {},
      lastUpdated: new Date(p.lastUpdated),
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }

  } catch (error) {
    console.error('Error getting emotional profile:', error)
    return null
  }
}, {
  name: "getEmotionalProfile",
  tags: ["emotional", "profile", "retrieval"],
  metadata: { 
    operation: "emotional_profile_retrieval",
    service: "mirror_system" 
  }
})

/**
 * Analyze emotional triggers for a user
 */
export const analyzeEmotionalTriggers = maybeTraceable(async (
  userId: string
): Promise<{
  commonTriggers: string[]
  triggerPatterns: any[]
  emotionalResponses: any[]
  copingStrategies: string[]
}> => {
  try {
    const profile = await getEmotionalProfile(userId)
    
    if (!profile) {
      return {
        commonTriggers: [],
        triggerPatterns: [],
        emotionalResponses: [],
        copingStrategies: []
      }
    }

    const triggers = profile.emotionalTriggers || []
    const coping = profile.copingMechanisms || []

    // Analyze trigger patterns
    const triggerTypes = triggers.reduce((acc: any, trigger: any) => {
      const type = trigger.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const commonTriggers = triggers
      .map((t: any) => t.trigger)
      .filter((trigger: string, index: number, arr: string[]) => arr.indexOf(trigger) === index)
      .slice(0, 10)

    const copingStrategies = coping
      .map((c: any) => c.strategy)
      .filter((strategy: string, index: number, arr: string[]) => arr.indexOf(strategy) === index)

    return {
      commonTriggers,
      triggerPatterns: Object.entries(triggerTypes).map(([type, count]) => ({
        type,
        frequency: count as number,
        percentage: Math.round((count as number / triggers.length) * 100)
      })),
      emotionalResponses: triggers.map((t: any) => ({
        trigger: t.trigger,
        response: t.typicalResponse,
        intensity: t.intensity
      })),
      copingStrategies
    }

  } catch (error) {
    console.error('Error analyzing emotional triggers:', error)
    return {
      commonTriggers: [],
      triggerPatterns: [],
      emotionalResponses: [],
      copingStrategies: []
    }
  }
}, {
  name: "analyzeEmotionalTriggers",
  tags: ["emotional", "triggers", "analysis"],
  metadata: { 
    operation: "emotional_trigger_analysis",
    service: "mirror_system" 
  }
})

/**
 * Get emotional intelligence summary
 */
export const getEmotionalIntelligenceSummary = maybeTraceable(async (
  userId: string
): Promise<{
  emotionalAwareness: number
  regulationAbility: number
  empathyLevel: number
  stressManagement: number
  overallEQ: number
  recommendations: string[]
}> => {
  try {
    const profile = await getEmotionalProfile(userId)
    
    if (!profile) {
      return {
        emotionalAwareness: 0.5,
        regulationAbility: 0.5,
        empathyLevel: 0.5,
        stressManagement: 0.5,
        overallEQ: 0.5,
        recommendations: ['More conversation needed to analyze emotional patterns']
      }
    }

    const regulation = profile.emotionalRegulation || {}
    const triggers = profile.emotionalTriggers || []
    const coping = profile.copingMechanisms || []

    const emotionalAwareness = regulation.awareness || 0.5
    const regulationAbility = regulation.emotionalIntelligence || 0.5
    const empathyLevel = profile.empathyLevel || 0.5
    
    // Calculate stress management based on coping mechanisms
    const stressManagement = coping.length > 0 
      ? Math.min(coping.reduce((sum: number, c: any) => sum + (c.effectiveness || 0.5), 0) / coping.length, 1.0)
      : 0.5

    const overallEQ = (emotionalAwareness + regulationAbility + empathyLevel + stressManagement) / 4

    // Generate recommendations
    const recommendations: string[] = []
    
    if (emotionalAwareness < 0.6) {
      recommendations.push('Practice identifying and naming your emotions')
    }
    if (regulationAbility < 0.6) {
      recommendations.push('Explore different emotional regulation techniques')
    }
    if (empathyLevel < 0.6) {
      recommendations.push('Practice perspective-taking and active listening')
    }
    if (stressManagement < 0.6) {
      recommendations.push('Develop more coping strategies for stress management')
    }
    if (triggers.length > 10) {
      recommendations.push('Consider working with a therapist to understand emotional triggers')
    }

    return {
      emotionalAwareness,
      regulationAbility,
      empathyLevel,
      stressManagement,
      overallEQ,
      recommendations
    }

  } catch (error) {
    console.error('Error getting emotional intelligence summary:', error)
    return {
      emotionalAwareness: 0.5,
      regulationAbility: 0.5,
      empathyLevel: 0.5,
      stressManagement: 0.5,
      overallEQ: 0.5,
      recommendations: ['Error analyzing emotional intelligence']
    }
  }
}, {
  name: "getEmotionalIntelligenceSummary",
  tags: ["emotional", "intelligence", "summary"],
  metadata: { 
    operation: "emotional_intelligence_summary",
    service: "mirror_system" 
  }
})