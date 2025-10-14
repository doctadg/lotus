/**
 * Enhanced Memory Types for Deep User Understanding
 * This file defines the types and interfaces for the advanced memory system
 * that aims to create a true mirror of the user.
 */

// Enhanced Memory Types
export type EnhancedMemoryType = 
  | 'preference' 
  | 'fact' 
  | 'context' 
  | 'skill' 
  | 'relationship' 
  | 'pattern' 
  | 'goal' 
  | 'value' 
  | 'belief'
  | 'emotion'
  | 'identity'
  | 'aspiration'

export type MemoryVerificationLevel = 
  | 'explicit' 
  | 'strong_inferred' 
  | 'weak_inferred' 
  | 'contradicted'
  | 'synthesized'

export type MemorySensitivity = 
  | 'public' 
  | 'private' 
  | 'sensitive' 
  | 'confidential'

export type SynthesisLevel = 
  | 'concrete' 
  | 'generalized' 
  | 'abstract'

export type ChangeFrequency = 
  | 'static' 
  | 'rarely' 
  | 'occasionally' 
  | 'frequently'

export type LifeDomain = 
  | 'work' 
  | 'personal' 
  | 'health' 
  | 'relationships' 
  | 'growth' 
  | 'finance' 
  | 'spiritual' 
  | 'creative'

// Enhanced Memory Interface
export interface EnhancedMemory {
  id: string
  userId: string
  type: EnhancedMemoryType
  category?: string
  key: string
  value: string
  confidence: number
  source: 'conversation' | 'explicit' | 'inferred' | 'synthesized'
  messageId?: string
  createdAt: Date
  updatedAt: Date
  
  // Enhanced fields
  relationships?: MemoryRelationship[]
  temporalDecay?: number
  accessFrequency: number
  emotionalWeight?: number
  verificationLevel: MemoryVerificationLevel
  validFrom: Date
  validUntil?: Date
  qualityScore?: number
  lastAccessed: Date
  accessCount: number
  synthesisLevel?: SynthesisLevel
  supportingMemories?: string[]
  contradictionCount: number
  lastVerified: Date
  expectedChangeFreq?: ChangeFrequency
  sensitivityLevel?: MemorySensitivity
  contextualRelevance?: number
  lifeDomain?: LifeDomain
}

// Memory Relationships
export interface MemoryRelationship {
  id: string
  sourceMemoryId: string
  targetMemoryId: string
  relationshipType: 'supports' | 'contradicts' | 'relates_to' | 'evolved_from' | 'depends_on' | 'generalizes' | 'specifies'
  strength: number
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

// Cognitive Patterns
export type ThinkingStyle = 'linear' | 'associative' | 'systematic' | 'creative' | 'analytical' | 'holistic'
export type DecisionMakingStyle = 'analytical' | 'intuitive' | 'collaborative' | 'independent' | 'deliberate' | 'impulsive'
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'experiential' | 'observational'
export type ProblemSolvingStyle = 'step_by_step' | 'holistic' | 'trial_and_error' | 'research_heavy' | 'collaborative'

export interface CognitivePattern {
  id: string
  userId: string
  patternType: 'thinking_style' | 'decision_making' | 'learning_style' | 'problem_solving' | 'communication_style' | 'creativity_style'
  patternValue: ThinkingStyle | DecisionMakingStyle | LearningStyle | ProblemSolvingStyle | string
  confidence: number
  evidence?: any
  lastObserved: Date
  observationCount: number
  strength: number
  context?: string
  createdAt: Date
  updatedAt: Date
}

// Emotional Intelligence
export interface EmotionalProfile {
  id: string
  userId: string
  baselineMood?: 'optimistic' | 'realistic' | 'pessimistic' | 'variable'
  emotionalTriggers: EmotionalTrigger[]
  copingMechanisms: CopingMechanism[]
  stressIndicators: StressPattern[]
  emotionalVocabulary: string[]
  empathyLevel?: number
  emotionalRegulation: EmotionalRegulation[]
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmotionalTrigger {
  type: 'topic' | 'situation' | 'person' | 'time' | 'environment' | 'word' | 'event'
  trigger: string
  typicalResponse: 'positive' | 'negative' | 'neutral' | 'mixed' | 'anxious' | 'excited'
  intensity: number
  frequency: number
  context?: string
}

export interface CopingMechanism {
  trigger: string
  strategy: string
  effectiveness: number
  usage: number
  category: 'behavioral' | 'cognitive' | 'emotional' | 'social'
}

export interface StressPattern {
  indicator: string
  level: number
  frequency: number
  triggers: string[]
  mitigation?: string[]
}

export interface EmotionalRegulation {
  emotion: string
  regulationStrategy: string
  successRate: number
  context: string[]
}

// Life Context
export interface LifeContext {
  id: string
  userId: string
  currentLifePhase?: 'student' | 'early_career' | 'mid_career' | 'senior' | 'retired' | 'transitioning' | 'gap_year' | 'entrepreneur'
  primaryRoles: Role[]
  lifeGoals: LifeGoal[]
  currentChallenges: Challenge[]
  supportSystem: SupportNetwork
  environmentalFactors: Environment[]
  timeConstraints: TimePattern[]
  financialContext: FinancialContext
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  type: 'professional' | 'personal' | 'family' | 'community' | 'creative' | 'educational'
  title: string
  responsibilities: string[]
  timeAllocation: number
  stressLevel: number
  satisfaction: number
  importance: number
}

export interface LifeGoal {
  domain: LifeDomain
  description: string
  priority: number
  timeframe: string
  progress: number
  milestones: string[]
  blockers?: string[]
}

export interface Challenge {
  domain: LifeDomain
  description: string
  severity: number
  duration: string
  impact: string[]
  copingStrategies?: string[]
}

export interface SupportNetwork {
  family: SupportPerson[]
  friends: SupportPerson[]
  professional: SupportPerson[]
  community: SupportPerson[]
}

export interface SupportPerson {
  name?: string
  relationship: string
  supportType: string[]
  availability: string
  reliability: number
}

export interface Environment {
  type: 'physical' | 'social' | 'digital' | 'cultural'
  description: string
  impact: 'positive' | 'negative' | 'neutral' | 'mixed'
  controllability: number
}

export interface TimePattern {
  activity: string
  typicalTimes: string[]
  duration: number
  frequency: string
  energyLevel: number
}

export interface FinancialContext {
  situation: 'stable' | 'growing' | 'declining' | 'uncertain' | 'transitioning'
  concerns: string[]
  goals: string[]
  stressLevel: number
  planningStyle: string
}

// Behavioral Patterns
export interface BehavioralPattern {
  id: string
  userId: string
  patternCategory: 'communication' | 'work' | 'learning' | 'social' | 'health' | 'creative'
  patternType: string
  patternData: any
  strength: number
  frequency?: number
  lastObserved: Date
  observationCount: number
  context?: string
  createdAt: Date
  updatedAt: Date
}

export interface CommunicationPattern {
  preferredTimes: string[]
  responseLatency: number
  messageLength: { min: number; max: number; average: number }
  initiationPattern: 'proactive' | 'reactive' | 'mixed'
  followupBehavior: string
  formalityLevel: number
  expressiveness: number
}

export interface WorkPattern {
  productivityCycles: ProductivityCycle[]
  focusDuration: { min: number; max: number; average: number }
  breakPatterns: BreakPattern[]
  contextSwitching: ContextSwitchPattern
  peakPerformanceTimes: string[]
  workStyle: string
}

export interface ProductivityCycle {
  startTime: string
  endTime: string
  intensity: number
  quality: number
  factors: string[]
}

export interface BreakPattern {
  frequency: number
  duration: number
  activities: string[]
  effectiveness: number
}

export interface ContextSwitchPattern {
  frequency: number
  cost: number
  triggers: string[]
  mitigation?: string[]
}

// Value System
export interface ValueSystem {
  id: string
  userId: string
  coreValues: Value[]
  ethicalPrinciples?: Principle[]
  beliefSystems?: BeliefSystem[]
  priorities?: Priority[]
  nonNegotiables: string[]
  growthAreas?: GrowthArea[]
  conflictResolution?: string
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

export interface Value {
  name: string
  importance: number
  manifestation: string[]
  triggers: string[]
  conflicts: string[]
  domain: LifeDomain
}

export interface Principle {
  name: string
  description: string
  application: string[]
  flexibility: number
}

export interface BeliefSystem {
  category: string
  beliefs: string[]
  strength: number
  origin: string
  flexibility: number
}

export interface Priority {
  area: string
  importance: number
  urgency: number
  satisfaction: number
}

export interface GrowthArea {
  area: string
  currentLevel: number
  targetLevel: number
  motivation: number
  plan?: string[]
}

// Self-Concept
export interface SelfConcept {
  id: string
  userId: string
  identityLabels: string[]
  selfPerception?: SelfPerception
  aspirationalSelf?: AspirationalSelf
  perceivedStrengths?: Strength[]
  perceivedWeaknesses?: Weakness[]
  growthMindset?: number
  selfAwareness?: number
  narrativeIdentity?: string
  confidenceLevel?: number
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
}

export interface SelfPerception {
  overall: string
  competencies: string[]
  personality: string[]
  roles: string[]
  potential: string
}

export interface AspirationalSelf {
  vision: string
  timeline: string
  steps: string[]
  obstacles: string[]
  motivation: string[]
}

export interface Strength {
  name: string
  description: string
  examples: string[]
  development: string
}

export interface Weakness {
  name: string
  description: string
  impact: string[]
  improvement?: string[]
}

// Temporal Evolution
export interface TemporalEvolution {
  id: string
  userId: string
  evolutionType: 'growth' | 'transition' | 'value_change' | 'skill_progress' | 'relationship_change' | 'identity_shift'
  domain: LifeDomain
  previousState?: any
  currentState?: any
  changeDate: Date
  confidence: number
  evidence?: any
  significance?: number
  createdAt: Date
}

// Reflective Insights
export interface ReflectiveInsight {
  id: string
  userId: string
  insightType: 'pattern' | 'contradiction' | 'growth' | 'blind_spot' | 'strength' | 'opportunity' | 'alignment'
  title: string
  description: string
  evidence?: any
  impact?: string
  suggestions: string[]
  confidence: number
  category?: LifeDomain
  isViewed: boolean
  userFeedback?: UserFeedback
  createdAt: Date
  updatedAt: Date
}

export interface UserFeedback {
  rating?: number
  accuracy?: number
  helpfulness?: number
  resonance?: number
  comments?: string
  actionTaken?: string
}

// Memory Quality Assessment
export interface MemoryQuality {
  relevanceScore: number
  freshnessScore: number
  consistencyScore: number
  specificityScore: number
  actionabilityScore: number
  verificationScore: number
  overallQuality: number
  assessmentDate: Date
}

// Mirror System State
export interface MirrorSystemState {
  completeness: number
  accuracy: number
  recency: number
  depth: number
  consistency: number
  lastUpdated: Date
  areasOfStrength: LifeDomain[]
  areasForImprovement: LifeDomain[]
  confidence: number
}

// User Mirror Profile
export interface UserMirrorProfile {
  userId: string
  basicInfo: {
    name?: string
    communicationStyle: string
    preferredInteraction: string
  }
  cognitiveProfile: CognitivePattern[]
  emotionalProfile: EmotionalProfile
  lifeContext: LifeContext
  behavioralPatterns: BehavioralPattern[]
  valueSystem: ValueSystem
  selfConcept: SelfConcept
  temporalEvolutions: TemporalEvolution[]
  reflectiveInsights: ReflectiveInsight[]
  systemState: MirrorSystemState
  lastUpdated: Date
}