/**
 * Intelligent Query Classifier for Optimal Search Strategy
 * Analyzes queries to determine the best search approach: none, light, deep, or comprehensive
 */

export type QueryType = 'greeting' | 'factual' | 'personal' | 'technical' | 'creative' | 'research' | 'general'

export interface QueryAnalysis {
  searchNeeded: boolean
  searchIntensity: 'none' | 'light' | 'moderate' | 'deep' | 'comprehensive'
  reasoning: string
  confidence: number
  queryType: QueryType
  factors: {
    hasCurrentInfoKeywords: boolean
    hasResearchKeywords: boolean
    hasFactualDataKeywords: boolean
    isComparison: boolean
    isHowTo: boolean
    isConceptual: boolean
    isCreative: boolean
    isGreeting: boolean
    queryComplexity: 'simple' | 'moderate' | 'complex'
    urgencyLevel: 'low' | 'medium' | 'high'
    specificityLevel: 'vague' | 'specific' | 'very_specific'
  }
  recommendedSources: number
  recommendedScraping: number
  personalizationLevel: 'none' | 'minimal' | 'moderate' | 'high'
}

export class QueryClassifier {
  // Greeting patterns - should NOT trigger search or heavy personalization
  private readonly greetingPatterns = [
    /^(hi|hello|hey|yo|sup|howdy|greetings?)[\s!?.]*$/i,
    /^(good\s+(morning|afternoon|evening|day|night))[\s!?.]*$/i,
    /^(what'?s\s+up|whats?\s+up|wassup|wazzup)[\s!?.]*$/i,
    /^(how'?s\s+it\s+going|how\s+are\s+you|how\s+do\s+you\s+do)[\s!?.]*$/i,
    /^(hola|bonjour|namaste|aloha)[\s!?.]*$/i,
    /^(welcome|welcome\s+back)[\s!?.]*$/i
  ]

  // Current information patterns
  private readonly currentInfoPatterns = [
    /\b(latest|recent|current|today|now|this (year|month|week)|2024|2025)\b/i,
    /\b(what'?s (new|happening)|breaking|trending|popular|viral)\b/i,
    /\b(news|update|updates|announcement|release|launched?)\b/i,
    /\b(stock|market|price|cost|pricing|rates?)\b/i,
    /\b(weather|temperature|forecast)\b/i,
    /\b(live|real[- ]?time|current(ly)?)\b/i
  ]

  // Research and analysis patterns
  private readonly researchPatterns = [
    /\b(research|study|analysis|report|survey|findings|investigation)\b/i,
    /\b(comprehensive|detailed|in[- ]?depth|thorough|complete|extensive)\b/i,
    /\b(compare|comparison|vs\.?|versus|pros? and cons?|advantages?|disadvantages?)\b/i,
    /\b(best|top|leading|recommended|popular|most)\b/i,
    /\b(industry|market|trend|landscape|overview)\b/i,
    /\b(explain|understand|learn|how does|why does|what are the)\b/i
  ]

  // Factual data patterns
  private readonly factualDataPatterns = [
    /\b(statistics|stats|data|numbers|figures|metrics)\b/i,
    /\b(how (much|many)|what (percentage|percent)|rate|ratio)\b/i,
    /\b(population|size|count|amount|quantity)\b/i,
    /\b(results|performance|sales|revenue|profit)\b/i,
    /\b(specifications?|specs|features|details)\b/i
  ]

  // How-to and tutorial patterns
  private readonly howToPatterns = [
    /\b(how to|guide|tutorial|instructions?|steps?|process)\b/i,
    /\b(setup|configure|install|create|build|make)\b/i,
    /\b(fix|solve|troubleshoot|debug|resolve)\b/i,
    /\b(learn|teach|show me|walk through)\b/i
  ]

  // Conceptual/knowledge patterns (usually don't need search)
  private readonly conceptualPatterns = [
    /\b(what is|definition|meaning|concept|theory|principle)\b/i,
    /\b(how does|why does|explain|clarify)\b/i,
    /\b(difference between|distinguish|contrast)\b/i,
    /\b(history|historical|background|origin)\b/i
  ]

  // Creative/subjective patterns (usually don't need search)
  private readonly creativePatterns = [
    /\b(write|create|generate|come up with|brainstorm)\b/i,
    /\b(story|poem|essay|article|content)\b/i,
    /\b(idea|suggestion|opinion|thought|perspective)\b/i,
    /\b(imagine|pretend|suppose|hypothetical)\b/i,
    /\b(creative|artistic|design|style)\b/i
  ]

  // Comparison patterns
  private readonly comparisonPatterns = [
    /\b(vs\.?|versus|compared? (to|with)|against)\b/i,
    /\b((better|worse|superior|inferior) than)\b/i,
    /\b(difference|similarities?|pros? and cons?)\b/i,
    /\b(which (is|are) (better|best|faster|cheaper))\b/i
  ]

  // Tech and coding patterns (often need current info)
  private readonly techPatterns = [
    /\b(API|framework|library|package|version|update)\b/i,
    /\b(bug|error|issue|problem|fix|solution)\b/i,
    /\b(documentation|docs|syntax|example|code)\b/i,
    /\b(install|setup|configure|deploy|host)\b/i
  ]

  // Urgency indicators
  private readonly urgencyPatterns = [
    /\b(urgent|asap|quickly|fast|immediate|now|emergency)\b/i,
    /\b(deadline|due|urgent|critical|important)\b/i,
    /\b(breaking|live|happening now|just announced)\b/i
  ]

  analyze(query: string, userContext?: any): QueryAnalysis {
    const lowerQuery = query.toLowerCase()
    const wordCount = query.split(/\s+/).length
    
    // Check if it's a greeting first
    const isGreeting = this.hasPatternMatch(query, this.greetingPatterns)
    
    // Analyze various factors
    const factors = {
      hasCurrentInfoKeywords: this.hasPatternMatch(query, this.currentInfoPatterns),
      hasResearchKeywords: this.hasPatternMatch(query, this.researchPatterns),
      hasFactualDataKeywords: this.hasPatternMatch(query, this.factualDataPatterns),
      isComparison: this.hasPatternMatch(query, this.comparisonPatterns),
      isHowTo: this.hasPatternMatch(query, this.howToPatterns),
      isConceptual: this.hasPatternMatch(query, this.conceptualPatterns),
      isCreative: this.hasPatternMatch(query, this.creativePatterns),
      isGreeting,
      queryComplexity: this.assessComplexity(query, wordCount),
      urgencyLevel: this.assessUrgency(query),
      specificityLevel: this.assessSpecificity(query)
    }

    // Determine query type
    const queryType = this.determineQueryType(query, factors)
    
    // Determine personalization level
    const personalizationLevel = this.determinePersonalizationLevel(queryType, query, factors)
    
    // Determine search strategy
    const searchDecision = this.determineSearchStrategy(query, factors, userContext, queryType)
    
    return {
      searchNeeded: searchDecision.searchNeeded,
      searchIntensity: searchDecision.intensity,
      reasoning: searchDecision.reasoning,
      confidence: searchDecision.confidence,
      queryType,
      factors,
      recommendedSources: searchDecision.sources,
      recommendedScraping: searchDecision.scraping,
      personalizationLevel
    }
  }

  private hasPatternMatch(query: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(query))
  }

  private assessComplexity(query: string, wordCount: number): 'simple' | 'moderate' | 'complex' {
    if (wordCount <= 3) return 'simple'
    if (wordCount <= 8) return 'moderate'
    return 'complex'
  }

  private assessUrgency(query: string): 'low' | 'medium' | 'high' {
    if (this.hasPatternMatch(query, this.urgencyPatterns)) return 'high'
    if (this.hasPatternMatch(query, this.currentInfoPatterns)) return 'medium'
    return 'low'
  }

  private assessSpecificity(query: string): 'vague' | 'specific' | 'very_specific' {
    const specificIndicators = [
      /\b(exactly|specifically|precisely|particular)\b/i,
      /\d{4}/, // Years
      /"[^"]+"/,  // Quoted terms
      /\b[A-Z]{2,}\b/, // Acronyms
      /\b\w+\.\w+\b/ // Domain names or specific terms
    ]
    
    const specificity = specificIndicators.filter(pattern => pattern.test(query)).length
    
    if (specificity >= 2) return 'very_specific'
    if (specificity >= 1) return 'specific'
    return 'vague'
  }

  private determineQueryType(query: string, factors: QueryAnalysis['factors']): QueryType {
    // Greetings are highest priority
    if (factors.isGreeting) return 'greeting'
    
    // Check other patterns
    const lowerQuery = query.toLowerCase()
    
    // Personal queries
    if (/\b(I|my|me|myself|I'm|I've|I'd|I'll)\b/i.test(query)) {
      return 'personal'
    }
    
    // Technical queries
    if (/\b(code|programming|API|bug|error|function|class|method|debug)\b/i.test(query)) {
      return 'technical'
    }
    
    // Research queries
    if (factors.hasResearchKeywords) {
      return 'research'
    }
    
    // Creative queries
    if (factors.isCreative) {
      return 'creative'
    }
    
    // Factual queries
    if (factors.hasFactualDataKeywords || factors.isConceptual) {
      return 'factual'
    }
    
    // Default
    return 'general'
  }

  private determinePersonalizationLevel(
    queryType: QueryType,
    query: string,
    factors: QueryAnalysis['factors']
  ): 'none' | 'minimal' | 'moderate' | 'high' {
    // Greetings get no personalization
    if (queryType === 'greeting') {
      return 'none'
    }
    
    // Factual and technical queries get minimal personalization
    if (queryType === 'factual' || queryType === 'technical') {
      return 'minimal'
    }
    
    // Personal queries get high personalization
    if (queryType === 'personal') {
      const personalIndicators = /\b(prefer|like|want|need|help me|my style|my preference)\b/i
      return personalIndicators.test(query) ? 'high' : 'moderate'
    }
    
    // Creative queries get moderate personalization
    if (queryType === 'creative') {
      return 'moderate'
    }
    
    // Research queries - depends on personal indicators
    if (queryType === 'research') {
      return /\b(I|my|me|for me)\b/i.test(query) ? 'moderate' : 'minimal'
    }
    
    // Default to minimal for general queries
    return 'minimal'
  }

  private determineSearchStrategy(
    query: string, 
    factors: QueryAnalysis['factors'], 
    userContext?: any,
    queryType?: QueryType
  ): {
    searchNeeded: boolean
    intensity: QueryAnalysis['searchIntensity']
    reasoning: string
    confidence: number
    sources: number
    scraping: number
  } {
    // Greetings NEVER need search
    if (factors.isGreeting || queryType === 'greeting') {
      return {
        searchNeeded: false,
        intensity: 'none',
        reasoning: 'Simple greeting - no search required',
        confidence: 1.0,
        sources: 0,
        scraping: 0
      }
    }
    
    // Creative or conceptual queries - usually no search needed
    if (factors.isCreative) {
      return {
        searchNeeded: false,
        intensity: 'none',
        reasoning: 'Creative/generative query - can be answered with internal knowledge',
        confidence: 0.9,
        sources: 0,
        scraping: 0
      }
    }

    // Historical conceptual queries (pre-2024) - usually no search needed
    if (factors.isConceptual && !factors.hasCurrentInfoKeywords) {
      const hasRecentYear = /\b(2024|2025)\b/.test(query)
      if (!hasRecentYear) {
        return {
          searchNeeded: false,
          intensity: 'none',
          reasoning: 'Conceptual/historical query - can be answered with existing knowledge',
          confidence: 0.85,
          sources: 0,
          scraping: 0
        }
      }
    }

    // Current information - definitely needs search
    if (factors.hasCurrentInfoKeywords || factors.urgencyLevel === 'high') {
      const intensity = factors.hasResearchKeywords ? 'deep' : 'moderate'
      return {
        searchNeeded: true,
        intensity,
        reasoning: 'Query requires current/real-time information',
        confidence: 0.95,
        sources: intensity === 'deep' ? 6 : 4,
        scraping: intensity === 'deep' ? 4 : 3
      }
    }

    // Research and analysis queries - comprehensive search
    if (factors.hasResearchKeywords && factors.queryComplexity === 'complex') {
      return {
        searchNeeded: true,
        intensity: 'comprehensive',
        reasoning: 'Complex research query requiring thorough analysis',
        confidence: 0.9,
        sources: 8,
        scraping: 5
      }
    }

    // Comparison queries - moderate to deep search
    if (factors.isComparison) {
      const intensity = factors.queryComplexity === 'complex' ? 'deep' : 'moderate'
      return {
        searchNeeded: true,
        intensity,
        reasoning: 'Comparison query requires current data from multiple sources',
        confidence: 0.85,
        sources: intensity === 'deep' ? 6 : 4,
        scraping: intensity === 'deep' ? 4 : 3
      }
    }

    // Factual data queries - light to moderate search
    if (factors.hasFactualDataKeywords) {
      return {
        searchNeeded: true,
        intensity: 'moderate',
        reasoning: 'Query requires current factual data and statistics',
        confidence: 0.8,
        sources: 4,
        scraping: 3
      }
    }

    // How-to queries - depends on specificity and tech content
    if (factors.isHowTo) {
      const hasTech = this.hasPatternMatch(query, this.techPatterns)
      if (hasTech || factors.specificityLevel === 'very_specific') {
        return {
          searchNeeded: true,
          intensity: 'moderate',
          reasoning: 'Technical how-to query may require current documentation/examples',
          confidence: 0.75,
          sources: 4,
          scraping: 3
        }
      } else {
        return {
          searchNeeded: false,
          intensity: 'none',
          reasoning: 'General how-to query can be answered with existing knowledge',
          confidence: 0.7,
          sources: 0,
          scraping: 0
        }
      }
    }

    // Default: assess based on complexity and user patterns
    if (factors.queryComplexity === 'complex' && factors.specificityLevel === 'very_specific') {
      return {
        searchNeeded: true,
        intensity: 'light',
        reasoning: 'Complex specific query - light search to verify and supplement knowledge',
        confidence: 0.6,
        sources: 3,
        scraping: 2
      }
    }

    // Simple queries - usually no search needed
    return {
      searchNeeded: false,
      intensity: 'none',
      reasoning: 'Simple query can be answered with existing knowledge',
      confidence: 0.8,
      sources: 0,
      scraping: 0
    }
  }

  // Quick utility methods for the agent
  shouldSearch(query: string, userContext?: any): boolean {
    return this.analyze(query, userContext).searchNeeded
  }

  getSearchStrategy(query: string, userContext?: any): {
    intensity: QueryAnalysis['searchIntensity']
    sources: number
    scraping: number
    reasoning: string
  } {
    const analysis = this.analyze(query, userContext)
    return {
      intensity: analysis.searchIntensity,
      sources: analysis.recommendedSources,
      scraping: analysis.recommendedScraping,
      reasoning: analysis.reasoning
    }
  }
}

export const queryClassifier = new QueryClassifier()