/**
 * Mirror System - Creating a True Reflection of the User
 * This module integrates all components to create a comprehensive mirror of the user
 */

import { 
  UserMirrorProfile, 
  MirrorSystemState, 
  ReflectiveInsight,
  LifeDomain,
  CognitivePattern,
  EmotionalProfile
} from './enhanced-memory-types'
import { extractCognitivePatterns, getDominantCognitivePatterns } from './cognitive-pattern-extractor'
import { analyzeEmotionalPatterns, getEmotionalIntelligenceSummary, getEmotionalProfile } from './emotional-intelligence'
import { getRelevantMemories } from './memory-extractor'
import { prisma } from './prisma'
import { trackMemoryExtraction } from './metrics'
import { maybeTraceable } from './tracing'

/**
 * Main Mirror System class
 */
export class MirrorSystem {
  
  /**
   * Get complete user mirror profile
   */
  async getUserMirrorProfile(userId: string): Promise<UserMirrorProfile> {
    console.log(`🪞 [MIRROR SYSTEM] Generating mirror profile for user: ${userId}`)
    
    try {
      // Get all components in parallel
      const [
        basicInfo,
        cognitivePatterns,
        emotionalProfile,
        emotionalIntelligence,
        memories,
        systemState
      ] = await Promise.all([
        this.getBasicUserInfo(userId),
        this.getCognitiveProfile(userId),
        this.getEmotionalProfile(userId),
        this.getEmotionalIntelligenceSummary(userId),
        this.getRelevantMemories(userId),
        this.calculateSystemState(userId)
      ])

      const profile: UserMirrorProfile = {
        userId,
        basicInfo: {
          name: basicInfo?.name || undefined,
          communicationStyle: basicInfo?.communicationStyle || 'balanced',
          preferredInteraction: basicInfo?.preferredInteraction || 'collaborative'
        },
        cognitiveProfile: cognitivePatterns,
        emotionalProfile: emotionalProfile || {
          id: '',
          userId,
          baselineMood: undefined,
          emotionalTriggers: [],
          copingMechanisms: [],
          stressIndicators: [],
          emotionalVocabulary: [],
          empathyLevel: 0.5,
          emotionalRegulation: [],
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        lifeContext: {
          id: '',
          userId,
          contextType: 'general',
          title: 'Life Overview',
          description: 'General life context',
          status: 'active',
          impact: 'medium',
          associatedMemories: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        behavioralPatterns: [], // TODO: Implement behavioral patterns
        valueSystem: {
          id: '',
          userId,
          coreValues: [],
          ethicalPrinciples: [],
          beliefSystems: [],
          priorities: [],
          nonNegotiables: [],
          growthAreas: [],
          conflictResolution: undefined,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }, // TODO: Implement value system
        selfConcept: {
          id: '',
          userId,
          identityLabels: [],
          selfPerception: undefined,
          aspirationalSelf: undefined,
          perceivedStrengths: [],
          perceivedWeaknesses: [],
          growthMindset: 0.5,
          selfAwareness: 0.5,
          narrativeIdentity: undefined,
          confidenceLevel: 0.5,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }, // TODO: Implement self-concept
        temporalEvolutions: [], // TODO: Implement temporal evolution
        reflectiveInsights: [], // TODO: Implement reflective insights
        systemState,
        lastUpdated: new Date()
      }

      console.log(`✅ [MIRROR SYSTEM] Generated complete mirror profile for user: ${userId}`)
      return profile

    } catch (error) {
      console.error('❌ [MIRROR SYSTEM] Error generating mirror profile:', error)
      throw error
    }
  }

  /**
   * Process conversation and update mirror
   */
  async processConversationForMirror(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<void> {
    console.log(`🔄 [MIRROR SYSTEM] Processing conversation for mirror update: ${userId}`)
    
    try {
      // Process different aspects in parallel
      await Promise.all([
        // Extract cognitive patterns from conversation
        extractCognitivePatterns(userId, conversationHistory).catch(error => {
          console.error('Error extracting cognitive patterns:', error)
        }),
        
        // Analyze emotional patterns
        analyzeEmotionalPatterns(userId, `User: ${userMessage}\nAssistant: ${assistantMessage}`).catch(error => {
          console.error('Error analyzing emotional patterns:', error)
        }),
        
        // Extract memories (existing system)
        this.extractMemories(userId, userMessage, assistantMessage).catch(error => {
          console.error('Error extracting memories:', error)
        })
      ])

      console.log(`✅ [MIRROR SYSTEM] Updated mirror for user: ${userId}`)

    } catch (error) {
      console.error('❌ [MIRROR SYSTEM] Error processing conversation:', error)
    }
  }

  /**
   * Generate reflective insights
   */
  async generateReflectiveInsights(userId: string): Promise<ReflectiveInsight[]> {
    console.log(`💡 [MIRROR SYSTEM] Generating reflective insights for user: ${userId}`)
    
    try {
      const insights: ReflectiveInsight[] = []
      
      // Get user data for analysis
      const [cognitivePatterns, emotionalProfile, memories] = await Promise.all([
        getDominantCognitivePatterns(userId),
        getEmotionalProfile(userId),
        getRelevantMemories(userId, 'life goals personality values', 20)
      ])

      // Generate cognitive insights
      if (cognitivePatterns.thinkingStyle) {
        insights.push({
          id: `insight_${Date.now()}_cognitive`,
          userId,
          insightType: 'pattern',
          title: 'Thinking Style Pattern',
          description: `You tend to think in a ${cognitivePatterns.thinkingStyle.value} manner with ${Math.round(cognitivePatterns.thinkingStyle.confidence * 100)}% confidence.`,
          evidence: [{ type: 'cognitive_analysis', data: cognitivePatterns.thinkingStyle }],
          impact: 'Understanding your thinking style can help optimize learning and problem-solving approaches.',
          suggestions: this.getThinkingStyleSuggestions(cognitivePatterns.thinkingStyle.value),
          confidence: cognitivePatterns.thinkingStyle.confidence,
          category: 'personal',
          isViewed: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      // Generate emotional insights
      if (emotionalProfile) {
        const emotionalSummary = await this.getEmotionalIntelligenceSummary(userId)
        
        if (emotionalSummary.overallEQ < 0.6) {
          insights.push({
            id: `insight_${Date.now()}_emotional`,
            userId,
            insightType: 'growth',
            title: 'Emotional Intelligence Growth Opportunity',
            description: `Your emotional intelligence score is ${Math.round(emotionalSummary.overallEQ * 100)}%. There's room for growth in emotional awareness and regulation.`,
            evidence: [{ type: 'emotional_analysis', data: emotionalSummary }],
            impact: 'Improving emotional intelligence can enhance relationships and decision-making.',
            suggestions: emotionalSummary.recommendations,
            confidence: 0.8,
            category: 'growth',
            isViewed: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }

      // Generate memory-based insights
      if (memories.length > 5) {
        const memoryCategories = memories.reduce((acc: any, memory) => {
          acc[memory.type] = (acc[memory.type] || 0) + 1
          return acc
        }, {})

        const dominantCategory = Object.entries(memoryCategories)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]

        if (dominantCategory) {
          insights.push({
            id: `insight_${Date.now()}_memory`,
            userId,
            insightType: 'pattern',
            title: 'Memory Pattern Insight',
            description: `You have shared most about ${dominantCategory[0]} topics (${dominantCategory[1]} memories).`,
            evidence: [{ type: 'memory_analysis', data: memoryCategories }],
            impact: 'This suggests areas of importance or focus in your life.',
            suggestions: this.getMemoryCategorySuggestions(dominantCategory[0] as string),
            confidence: 0.7,
            category: 'personal',
            isViewed: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }

      // Store insights
      await this.storeReflectiveInsights(insights)

      console.log(`💡 [MIRROR SYSTEM] Generated ${insights.length} reflective insights for user: ${userId}`)
      return insights

    } catch (error) {
      console.error('❌ [MIRROR SYSTEM] Error generating reflective insights:', error)
      return []
    }
  }

  /**
   * Get mirror system completeness and accuracy metrics
   */
  async getMirrorSystemMetrics(userId: string): Promise<{
    completeness: number
    accuracy: number
    recency: number
    depth: number
    consistency: number
    overallConfidence: number
    dataPoints: {
      memories: number
      cognitivePatterns: number
      emotionalDataPoints: number
      conversations: number
    }
  }> {
    try {
      // Get counts of different data types
      const [memoryCount, cognitiveCount, emotionalProfile] = await Promise.all([
        prisma.userMemory.count({ where: { userId } }),
        prisma.$queryRaw`SELECT COUNT(*) as count FROM "cognitive_patterns" WHERE "userId" = ${userId}` as any[],
        getEmotionalProfile(userId)
      ])

      const memories = memoryCount
      const cognitivePatterns = parseInt(cognitiveCount[0]?.count || '0')
      const emotionalDataPoints = emotionalProfile ? 1 : 0

      // Calculate metrics
      const completeness = Math.min(
        (memories / 50) * 0.4 +      // 40% weight on memories
        (cognitivePatterns / 10) * 0.3 + // 30% weight on cognitive patterns
        (emotionalDataPoints / 1) * 0.3,  // 30% weight on emotional data
        1.0
      )

      const recency = await this.calculateRecencyScore(userId)
      const depth = await this.calculateDepthScore(userId)
      const consistency = await this.calculateConsistencyScore(userId)
      
      const accuracy = (consistency + depth) / 2
      const overallConfidence = (completeness + accuracy + recency) / 3

      return {
        completeness,
        accuracy,
        recency,
        depth,
        consistency,
        overallConfidence,
        dataPoints: {
          memories,
          cognitivePatterns,
          emotionalDataPoints,
          conversations: Math.floor(memories / 2) // Estimate
        }
      }

    } catch (error) {
      console.error('Error calculating mirror system metrics:', error)
      return {
        completeness: 0.5,
        accuracy: 0.5,
        recency: 0.5,
        depth: 0.5,
        consistency: 0.5,
        overallConfidence: 0.5,
        dataPoints: {
          memories: 0,
          cognitivePatterns: 0,
          emotionalDataPoints: 0,
          conversations: 0
        }
      }
    }
  }

  // Private helper methods

  private async getBasicUserInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    const context = await prisma.userContext.findFirst({
      where: { userId },
      select: { 
        communicationStyle: true,
        preferredResponseStyle: true 
      }
    })

    return {
      name: user?.name,
      communicationStyle: context?.communicationStyle || 'friendly',
      preferredInteraction: context?.preferredResponseStyle || 'balanced'
    }
  }

  private async getCognitiveProfile(userId: string): Promise<CognitivePattern[]> {
    return await extractCognitivePatterns(userId, [])
  }

  private async getEmotionalProfile(userId: string): Promise<EmotionalProfile | null> {
    return await getEmotionalProfile(userId)
  }

  private async getEmotionalIntelligenceSummary(userId: string) {
    return await getEmotionalIntelligenceSummary(userId)
  }

  private async getRelevantMemories(userId: string) {
    return await getRelevantMemories(userId, 'personal preferences goals values', 50)
  }

  private async calculateSystemState(userId: string): Promise<MirrorSystemState> {
    const metrics = await this.getMirrorSystemMetrics(userId)
    
    return {
      completeness: metrics.completeness,
      accuracy: metrics.accuracy,
      recency: metrics.recency,
      depth: metrics.depth,
      consistency: metrics.consistency,
      lastUpdated: new Date(),
      areasOfStrength: this.calculateStrengths(metrics),
      areasForImprovement: this.calculateImprovements(metrics),
      confidence: metrics.overallConfidence
    }
  }

  private async calculateRecencyScore(userId: string): Promise<number> {
    const recentMemory = await prisma.userMemory.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })

    if (!recentMemory) return 0.0

    const daysSinceLastUpdate = (Date.now() - recentMemory.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, 1 - (daysSinceLastUpdate / 30)) // Decay over 30 days
  }

  private async calculateDepthScore(userId: string): Promise<number> {
    // Calculate depth based on variety of memory types and detail level
    const memoryTypes = await prisma.userMemory.groupBy({
      by: ['type'],
      where: { userId },
      _count: true
    })

    const typeVariety = memoryTypes.length / 8 // 8 is max number of types
    const avgConfidence = memoryTypes.reduce((sum, type) => sum + 0.7, 0) / Math.max(memoryTypes.length, 1) // Simplified
    
    return (typeVariety + avgConfidence) / 2
  }

  private async calculateConsistencyScore(userId: string): Promise<number> {
    // Simplified consistency calculation
    // In a full implementation, this would check for contradictions
    return 0.8 // Placeholder
  }

  private calculateStrengths(metrics: any): LifeDomain[] {
    const strengths: LifeDomain[] = []
    
    if (metrics.dataPoints.memories > 20) strengths.push('personal')
    if (metrics.dataPoints.cognitivePatterns > 5) strengths.push('growth')
    if (metrics.dataPoints.emotionalDataPoints > 0) strengths.push('relationships')
    
    return strengths
  }

  private calculateImprovements(metrics: any): LifeDomain[] {
    const improvements: LifeDomain[] = []
    
    if (metrics.dataPoints.memories < 10) improvements.push('personal')
    if (metrics.dataPoints.cognitivePatterns < 3) improvements.push('growth')
    if (metrics.dataPoints.emotionalDataPoints === 0) improvements.push('relationships')
    
    return improvements
  }

  private getThinkingStyleSuggestions(style: string): string[] {
    const suggestions: Record<string, string[]> = {
      linear: [
        'Try mind mapping for creative problems',
        'Practice brainstorming without immediate structure',
        'Explore associative thinking techniques'
      ],
      analytical: [
        'Practice intuitive decision-making',
        'Try solving problems with incomplete data',
        'Develop trust in gut feelings'
      ],
      creative: [
        'Use structured frameworks for ideas',
        'Practice step-by-step planning',
        'Develop analytical thinking skills'
      ],
      systematic: [
        'Allow for flexibility in plans',
        'Practice spontaneous decision-making',
        'Embrace uncertainty and change'
      ]
    }
    
    return suggestions[style] || ['Continue developing your thinking style']
  }

  private getMemoryCategorySuggestions(category: string): string[] {
    const suggestions: Record<string, string[]> = {
      preference: [
        'Explore why these preferences matter to you',
        'Consider how preferences align with values',
        'Reflect on preference evolution over time'
      ],
      skill: [
        'Set learning goals for skill development',
        'Find opportunities to apply these skills',
        'Consider teaching others to solidify knowledge'
      ],
      goal: [
        'Break down goals into actionable steps',
        'Review progress regularly',
        'Align goals with core values'
      ],
      fact: [
        'Look for patterns in factual information',
        'Consider how facts connect to bigger picture',
        'Reflect on significance of these facts'
      ]
    }
    
    return suggestions[category] || ['Continue exploring this area of your life']
  }

  private async storeReflectiveInsights(insights: ReflectiveInsight[]): Promise<void> {
    for (const insight of insights) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "reflective_insights" (
            id, "userId", "insight_type", "title", "description", "evidence",
            "impact", "suggestions", "confidence", "category", "is_viewed",
            "created_at", "updated_at"
          ) VALUES (
            ${insight.id},
            ${insight.userId},
            ${insight.insightType},
            ${insight.title},
            ${insight.description},
            ${JSON.stringify(insight.evidence)}::jsonb,
            ${insight.impact},
            ${insight.suggestions},
            ${insight.confidence},
            ${insight.category},
            ${insight.isViewed},
            NOW(),
            NOW()
          )
        `
      } catch (error) {
        console.error('Error storing reflective insight:', error)
      }
    }
  }

  private async extractMemories(userId: string, userMessage: string, assistantMessage: string): Promise<void> {
    // Use existing memory extraction system
    const { processMessageForMemories } = await import('./memory-extractor')
    await processMessageForMemories(userId, userMessage, assistantMessage)
  }
}

// Export singleton instance
export const mirrorSystem = new MirrorSystem()

/**
 * Convenience function to get user mirror profile
 */
export const getUserMirror = maybeTraceable(async (userId: string): Promise<UserMirrorProfile> => {
  return await mirrorSystem.getUserMirrorProfile(userId)
}, {
  name: "getUserMirror",
  tags: ["mirror", "profile", "user"],
  metadata: { 
    operation: "get_user_mirror_profile",
    service: "mirror_system" 
  }
})

/**
 * Convenience function to process conversation for mirror
 */
export const processConversationForMirror = maybeTraceable(async (
  userId: string,
  userMessage: string,
  assistantMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<void> => {
  return await mirrorSystem.processConversationForMirror(userId, userMessage, assistantMessage, conversationHistory)
}, {
  name: "processConversationForMirror",
  tags: ["mirror", "conversation", "processing"],
  metadata: { 
    operation: "process_conversation_for_mirror",
    service: "mirror_system" 
  }
})

/**
 * Convenience function to generate reflective insights
 */
export const generateUserInsights = maybeTraceable(async (userId: string): Promise<ReflectiveInsight[]> => {
  return await mirrorSystem.generateReflectiveInsights(userId)
}, {
  name: "generateUserInsights",
  tags: ["mirror", "insights", "reflection"],
  metadata: { 
    operation: "generate_user_insights",
    service: "mirror_system" 
  }
})