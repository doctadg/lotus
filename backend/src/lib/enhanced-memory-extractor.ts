/**
 * Enhanced Memory Extractor for Deep User Understanding
 * This module extracts and processes memories to create a true mirror of the user
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { 
  EnhancedMemory, 
  CognitivePattern, 
  EmotionalProfile, 
  BehavioralPattern,
  ValueSystem,
  SelfConcept,
  TemporalEvolution,
  ReflectiveInsight,
  MemoryRelationship,
  EnhancedMemoryType,
  MemoryVerificationLevel,
  MemorySensitivity,
  SynthesisLevel,
  ChangeFrequency,
  LifeDomain
} from './enhanced-memory-types'
import { prisma } from './prisma'
import { groqCircuitBreaker } from './circuit-breaker'
import { trackMemoryExtraction } from './metrics'
import { maybeTraceable } from './tracing'

const llm = new ChatOpenAI({
  model: 'openai/gpt-oss-20b',
  temperature: 0.1,
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  }
})

/**
 * Enhanced memory extraction prompt
 */
const enhancedMemoryExtractionPrompt = PromptTemplate.fromTemplate(`
You are an advanced memory extraction system designed to create a deep understanding of the user.
Extract comprehensive memories from the following conversation, focusing on creating a true mirror of the user.

Analyze the conversation for:
1. Explicit preferences and facts
2. Emotional states and triggers
3. Cognitive patterns and thinking styles
4. Values and beliefs
5. Behavioral patterns
6. Life contexts and situations
7. Goals and aspirations
8. Self-concept and identity elements

Conversation:
{conversation}

User Message:
{userMessage}

Assistant Response:
{assistantResponse}

Extract memories in the following JSON format:
{{
  "memories": [
    {{
      "type": "preference|fact|context|skill|relationship|pattern|goal|value|belief|emotion|identity|aspiration",
      "category": "personal|professional|health|relationships|financial|spiritual|educational|creative",
      "key": "specific memory key",
      "value": "detailed memory content",
      "confidence": 0.0-1.0,
      "verificationLevel": "explicit|strong_inferred|weak_inferred|contradicted|synthesized",
      "emotionalWeight": 0.0-1.0,
      "sensitivityLevel": "public|private|sensitive|confidential",
      "lifeDomain": "work|personal|health|relationships|financial|spiritual|educational|creative",
      "synthesisLevel": "concrete|generalized|abstract",
      "expectedChangeFreq": "static|rarely|occasionally|frequently",
      "contextualRelevance": 0.0-1.0,
      "relationships": [
        {{
          "type": "supports|contradicts|relates_to|causes|enables",
          "targetMemoryKey": "related memory key",
          "strength": 0.0-1.0
        }}
      ]
    }}
  ],
  "cognitivePatterns": [
    {{
      "patternType": "thinking_style|decision_making|learning_style|problem_solving|communication_style",
      "description": "detailed description of the pattern",
      "evidence": ["evidence from conversation"],
      "confidence": 0.0-1.0,
      "impact": "high|medium|low",
      "contexts": ["situations where pattern appears"]
    }}
  ],
  "emotionalProfile": {{
    "baselineMood": "typical emotional state",
    "emotionalTriggers": [
      {{
        "trigger": "what triggers the emotion",
        "emotion": "resulting emotion",
        "intensity": 0.0-1.0
      }}
    ],
    "copingMechanisms": [
      {{
        "mechanism": "how they cope",
        "effectiveness": 0.0-1.0,
        "contexts": ["when used"]
      }}
    ],
    "empathyLevel": 0.0-1.0,
    "emotionalRegulation": [
      {{
        "strategy": "regulation strategy",
        "frequency": "often|sometimes|rarely"
      }}
    ]
  }}
}}
`)

/**
 * Extract enhanced memories from conversation
 */
export const extractEnhancedMemories = maybeTraceable(
  'enhanced-memory-extraction',
  async (conversation: string, userMessage: string, assistantResponse: string) => {
    return trackMemoryExtraction('enhanced', async () => {
      try {
        const chain = enhancedMemoryExtractionPrompt.pipe(llm).pipe(new JsonOutputParser())
        
        const result = await groqCircuitBreaker.execute(async () => {
          return await chain.invoke({
            conversation,
            userMessage,
            assistantResponse
          })
        })

        return result
      } catch (error) {
        console.error('Error in enhanced memory extraction:', error)
        return {
          memories: [],
          cognitivePatterns: [],
          emotionalProfile: null
        }
      }
    })
  }
)

/**
 * Process and store enhanced memories
 */
export async function processEnhancedMemories(
  userId: string,
  extractionResult: any,
  messageId?: string
): Promise<EnhancedMemory[]> {
  const processedMemories: EnhancedMemory[] = []

  if (!extractionResult.memories) {
    return processedMemories
  }

  for (const memoryData of extractionResult.memories) {
    try {
      // Store basic memory using raw SQL for now
      const storedMemory = await prisma.$queryRaw`
        INSERT INTO "user_memories" (
          "id", "userId", "type", "category", "key", "value", 
          "confidence", "source", "messageId", "relationships",
          "temporalDecay", "accessCount", "emotionalWeight",
          "verificationLevel", "validFrom", "validUntil",
          "qualityScore", "lastAccessed", "synthesisLevel",
          "supportingMemories", "contradictionCount", "lastVerified",
          "expectedChangeFreq", "sensitivityLevel", "contextualRelevance",
          "lifeDomain", "createdAt", "updatedAt"
        ) VALUES (
          ${`memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
          ${userId},
          ${memoryData.type},
          ${memoryData.category || null},
          ${memoryData.key},
          ${memoryData.value},
          ${memoryData.confidence || 0.5},
          ${'conversation'},
          ${messageId || null},
          ${JSON.stringify(memoryData.relationships || [])},
          ${0.1},
          ${0},
          ${memoryData.emotionalWeight || 0.5},
          ${memoryData.verificationLevel || 'explicit'},
          ${new Date()},
          ${null},
          ${memoryData.confidence || 0.5},
          ${new Date()},
          ${memoryData.synthesisLevel || 'concrete'},
          ${JSON.stringify([])},
          ${0},
          ${new Date()},
          ${memoryData.expectedChangeFreq || 'occasionally'},
          ${memoryData.sensitivityLevel || 'private'},
          ${memoryData.contextualRelevance || 0.5},
          ${memoryData.lifeDomain || 'personal'},
          ${new Date()},
          ${new Date()}
        )
        RETURNING *
      ` as any[]

      if (storedMemory.length > 0) {
        const memory = storedMemory[0]
        processedMemories.push({
          id: memory.id,
          userId: memory.userId,
          type: memory.type as EnhancedMemoryType,
          category: memory.category || undefined,
          key: memory.key,
          value: memory.value,
          confidence: memory.confidence,
          source: memory.source as any,
          messageId: memory.messageId || undefined,
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt,
          relationships: memoryData.relationships,
          temporalDecay: memory.temporalDecay || undefined,
          accessFrequency: memory.accessCount || undefined,
          emotionalWeight: memory.emotionalWeight || undefined,
          verificationLevel: memory.verificationLevel as MemoryVerificationLevel,
          validFrom: memory.validFrom || undefined,
          validUntil: memory.validUntil || undefined,
          qualityScore: memory.qualityScore || undefined,
          lastAccessed: memory.lastAccessed,
          accessCount: memory.accessCount,
          synthesisLevel: memory.synthesisLevel as SynthesisLevel || undefined,
          supportingMemories: memory.supportingMemories,
          contradictionCount: memory.contradictionCount,
          lastVerified: memory.lastVerified,
          expectedChangeFreq: memory.expectedChangeFreq as ChangeFrequency || undefined,
          sensitivityLevel: memory.sensitivityLevel as MemorySensitivity || undefined,
          contextualRelevance: memory.contextualRelevance || undefined,
          lifeDomain: memory.lifeDomain as LifeDomain
        })
      }

    } catch (error) {
      console.error('Error processing enhanced memory:', error)
    }
  }

  return processedMemories
}

/**
 * Process cognitive patterns and store them
 */
async function processCognitivePatterns(
  userId: string,
  patterns: any[]
): Promise<CognitivePattern[]> {
  const processedPatterns: CognitivePattern[] = []

  for (const patternData of patterns) {
    try {
      await prisma.$queryRaw`
        INSERT INTO "cognitive_patterns" (
          "id", "userId", "patternType", "description", "evidence",
          "confidence", "firstObserved", "lastObserved", "frequency",
          "contexts", "impact", "createdAt", "updatedAt"
        ) VALUES (
          ${`pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
          ${userId},
          ${patternData.patternType},
          ${patternData.description},
          ${JSON.stringify(patternData.evidence || [])},
          ${patternData.confidence || 0.5},
          ${new Date()},
          ${new Date()},
          ${1},
          ${JSON.stringify(patternData.contexts || [])},
          ${patternData.impact || 'medium'},
          ${new Date()},
          ${new Date()}
        )
      `

      processedPatterns.push({
        id: patternData.id,
        userId,
        patternType: patternData.patternType,
        description: patternData.description,
        evidence: patternData.evidence || [],
        confidence: patternData.confidence || 0.5,
        firstObserved: new Date(),
        lastObserved: new Date(),
        frequency: 1,
        contexts: patternData.contexts || [],
        impact: patternData.impact || 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error processing cognitive pattern:', error)
    }
  }

  return processedPatterns
}

/**
 * Process emotional profile and store it
 */
async function processEmotionalProfile(
  userId: string,
  profileData: any
): Promise<EmotionalProfile | null> {
  if (!profileData) return null

  try {
    await prisma.$queryRaw`
      INSERT INTO "emotional_profiles" (
        "id", "userId", "baselineMood", "emotionalTriggers", "copingMechanisms",
        "stressIndicators", "emotionalVocabulary", "empathyLevel", "emotionalRegulation",
        "lastUpdated", "createdAt", "updatedAt"
      ) VALUES (
        ${`profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
        ${userId},
        ${profileData.baselineMood || null},
        ${JSON.stringify(profileData.emotionalTriggers || [])},
        ${JSON.stringify(profileData.copingMechanisms || [])},
        ${JSON.stringify(profileData.stressIndicators || [])},
        ${JSON.stringify(profileData.emotionalVocabulary || [])},
        ${profileData.empathyLevel || 0.5},
        ${JSON.stringify(profileData.emotionalRegulation || [])},
        ${new Date()},
        ${new Date()},
        ${new Date()}
      )
      ON CONFLICT ("userId") DO UPDATE SET
        "baselineMood" = EXCLUDED."baselineMood",
        "emotionalTriggers" = EXCLUDED."emotionalTriggers",
        "copingMechanisms" = EXCLUDED."copingMechanisms",
        "empathyLevel" = EXCLUDED."empathyLevel",
        "emotionalRegulation" = EXCLUDED."emotionalRegulation",
        "lastUpdated" = EXCLUDED."lastUpdated",
        "updatedAt" = EXCLUDED."updatedAt"
    `

    return {
      id: profileData.id,
      userId,
      baselineMood: profileData.baselineMood,
      emotionalTriggers: profileData.emotionalTriggers || [],
      copingMechanisms: profileData.copingMechanisms || [],
      stressIndicators: profileData.stressIndicators || [],
      emotionalVocabulary: profileData.emotionalVocabulary || [],
      empathyLevel: profileData.empathyLevel || 0.5,
      emotionalRegulation: profileData.emotionalRegulation || [],
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error processing emotional profile:', error)
    return null
  }
}

/**
 * Main function to process all enhanced memory data
 */
export async function processAllEnhancedData(
  userId: string,
  extractionResult: any,
  messageId?: string
): Promise<{
  memories: EnhancedMemory[]
  cognitivePatterns: CognitivePattern[]
  emotionalProfile: EmotionalProfile | null
}> {
  const memories = await processEnhancedMemories(userId, extractionResult, messageId)
  const cognitivePatterns = await processCognitivePatterns(userId, extractionResult.cognitivePatterns || [])
  const emotionalProfile = await processEmotionalProfile(userId, extractionResult.emotionalProfile)

  return {
    memories,
    cognitivePatterns,
    emotionalProfile
  }
}

/**
 * Get memory statistics for a user
 */
export async function getMemoryStatistics(userId: string): Promise<any> {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        type,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence,
        AVG(emotionalWeight) as avg_emotional_weight
      FROM "user_memories" 
      WHERE "userId" = ${userId}
      GROUP BY type
    ` as any[]

    const verificationStats = await prisma.$queryRaw`
      SELECT 
        "verificationLevel",
        COUNT(*) as count
      FROM "user_memories" 
      WHERE "userId" = ${userId}
      GROUP BY "verificationLevel"
    ` as any[]

    return {
      byType: stats,
      byVerificationLevel: verificationStats,
      totalMemories: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0)
    }
  } catch (error) {
    console.error('Error getting memory statistics:', error)
    return {
      byType: [],
      byVerificationLevel: [],
      totalMemories: 0
    }
  }
}