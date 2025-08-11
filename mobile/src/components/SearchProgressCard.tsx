import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated'
import { Search, Database, Globe, CheckCircle, AlertCircle } from 'lucide-react-native'

interface SearchStep {
  id: string
  type: 'planning' | 'start' | 'progress' | 'analysis' | 'complete'
  tool: 'web_search' | 'comprehensive_search'
  content: string
  url?: string
  progress?: number
  quality?: 'high' | 'moderate' | 'basic'
  timestamp: number
  metadata?: any
}

interface SearchProgressCardProps {
  steps: SearchStep[]
  isActive: boolean
  onComplete?: () => void
}

const TOOL_CONFIG = {
  web_search: {
    icon: Search,
    label: 'Web Search',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)'
  },
  comprehensive_search: {
    icon: Database,
    label: 'Deep Research',
    color: '#3B82F6', 
    backgroundColor: 'rgba(59, 130, 246, 0.1)'
  }
}

const getStepIcon = (step: SearchStep) => {
  switch (step.type) {
    case 'planning':
      return Search
    case 'start':
      return Globe
    case 'progress':
      return Globe
    case 'analysis':
      return Database
    case 'complete':
      return CheckCircle
    default:
      return Search
  }
}

const getStepColor = (step: SearchStep, isActive: boolean = false) => {
  if (step.type === 'complete') return '#10B981'
  if (isActive) return '#F59E0B'
  return '#6B7280'
}

export const SearchProgressCard: React.FC<SearchProgressCardProps> = ({
  steps,
  isActive,
  onComplete
}) => {
  const fadeAnim = useSharedValue(0)
  const slideAnim = useSharedValue(-20)
  const pulseAnim = useSharedValue(0)
  const progressAnim = useSharedValue(0)
  
  const [currentStep, setCurrentStep] = useState<SearchStep | null>(null)
  const [completedSteps, setCompletedSteps] = useState<SearchStep[]>([])
  
  useEffect(() => {
    // Initial animation
    fadeAnim.value = withTiming(1, { duration: 300 })
    slideAnim.value = withSpring(0, {
      damping: 15,
      stiffness: 100
    })
  }, [])
  
  useEffect(() => {
    if (steps.length > 0) {
      const latest = steps[steps.length - 1]
      setCurrentStep(latest)
      
      // Update completed steps
      setCompletedSteps(steps.filter(step => step.type === 'complete'))
      
      // Update progress animation
      if (latest.progress !== undefined) {
        progressAnim.value = withTiming(latest.progress / 100, {
          duration: 500,
          easing: Easing.out(Easing.ease)
        })
      }
      
      // Handle completion
      if (latest.type === 'complete' && onComplete) {
        setTimeout(onComplete, 1000)
      }
    }
  }, [steps])
  
  useEffect(() => {
    // Pulse animation for active state
    if (isActive && currentStep?.type !== 'complete') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1
      )
    } else {
      pulseAnim.value = withTiming(0, { duration: 200 })
    }
  }, [isActive, currentStep])
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }]
  }))
  
  const animatedPulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.05])
    const opacity = interpolate(pulseAnim.value, [0, 1], [1, 0.8])
    
    return {
      transform: [{ scale }],
      opacity
    }
  })
  
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`
  }))
  
  if (!currentStep) return null
  
  const tool = currentStep.tool
  const toolConfig = TOOL_CONFIG[tool]
  const Icon = toolConfig.icon
  const StepIcon = getStepIcon(currentStep)
  const stepColor = getStepColor(currentStep, isActive)
  
  const getProgressText = () => {
    switch (currentStep.type) {
      case 'planning':
        return 'Planning search strategy...'
      case 'start':
        return 'Initiating search...'
      case 'progress':
        return `Processing results... ${currentStep.progress || 0}%`
      case 'analysis':
        return 'Analyzing information quality...'
      case 'complete':
        return 'Search completed successfully'
      default:
        return currentStep.content
    }
  }
  
  const getQualityBadge = () => {
    if (!currentStep.quality) return null
    
    const qualityConfig = {
      high: { label: 'High Quality', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
      moderate: { label: 'Good Quality', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
      basic: { label: 'Basic Info', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
    }
    
    const config = qualityConfig[currentStep.quality]
    
    return (
      <View style={[styles.qualityBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.qualityText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    )
  }
  
  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Animated.View style={[styles.card, animatedPulseStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.toolIconContainer, { backgroundColor: toolConfig.backgroundColor }]}>
              <Icon size={16} color={toolConfig.color} />
            </View>
            <View>
              <Text style={styles.toolLabel}>{toolConfig.label}</Text>
              <Text style={styles.stepType}>{getProgressText()}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.stepIconContainer, { backgroundColor: stepColor + '20' }]}>
              <StepIcon size={14} color={stepColor} />
            </View>
            {getQualityBadge()}
          </View>
        </View>
        
        {/* Progress Bar */}
        {currentStep.progress !== undefined && currentStep.type !== 'complete' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { backgroundColor: toolConfig.color },
                  animatedProgressStyle
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{currentStep.progress}%</Text>
          </View>
        )}
        
        {/* URL if available */}
        {currentStep.url && (
          <View style={styles.urlContainer}>
            <Globe size={12} color="#6B7280" />
            <Text style={styles.urlText} numberOfLines={1}>
              {currentStep.url}
            </Text>
          </View>
        )}
        
        {/* Metadata Information */}
        {currentStep.metadata && (
          <View style={styles.metadataContainer}>
            {currentStep.metadata.result_size && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Data Retrieved:</Text>
                <Text style={styles.metadataValue}>
                  {(currentStep.metadata.result_size / 1000).toFixed(1)}KB
                </Text>
              </View>
            )}
            {currentStep.metadata.quality_score && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Quality Score:</Text>
                <Text style={styles.metadataValue}>
                  {currentStep.metadata.quality_score}/100
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Completion Summary */}
        {currentStep.type === 'complete' && completedSteps.length > 0 && (
          <View style={styles.completionSummary}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.completionText}>
              Successfully processed {steps.length} search phases
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  toolIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2
  },
  stepType: {
    fontSize: 12,
    color: '#6B7280'
  },
  stepIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '500'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginRight: 8
  },
  progressBar: {
    height: 4,
    borderRadius: 2
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right'
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8
  },
  urlText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1
  },
  metadataContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8
  },
  metadataItem: {
    flex: 1
  },
  metadataLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2
  },
  metadataValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500'
  },
  completionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  completionText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '500'
  }
})