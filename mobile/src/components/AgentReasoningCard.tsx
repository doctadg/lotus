import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated'
import { ChevronDown, Brain, Search, Database, Zap, CheckCircle } from 'lucide-react-native'

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'processing' | 'synthesis'
  content: string
  tool?: string
  timestamp: number
  metadata?: any
}

interface AgentReasoningCardProps {
  steps: AgentStep[]
  isExpanded: boolean
  onToggle: () => void
  duration?: number
  toolsUsed?: number
  overallProgress?: number
  currentPhase?: string
  isActive?: boolean
  totalSteps?: number
}

const getStepIcon = (step: AgentStep) => {
  switch (step.type) {
    case 'thought':
      return Brain
    case 'tool_call':
      return step.tool === 'comprehensive_search' ? Database : Search
    case 'tool_result':
      return CheckCircle
    case 'processing':
      return Zap
    case 'synthesis':
      return Brain
    default:
      return Brain
  }
}

const getStepColor = (step: AgentStep) => {
  switch (step.type) {
    case 'thought':
      return '#3B82F6'
    case 'tool_call':
      return '#10B981'
    case 'tool_result':
      return '#10B981'
    case 'processing':
      return '#F59E0B'
    case 'synthesis':
      return '#8B5CF6'
    default:
      return '#6B7280'
  }
}

export const AgentReasoningCard: React.FC<AgentReasoningCardProps> = ({
  steps,
  isExpanded,
  onToggle,
  duration = 0,
  toolsUsed = 0,
  overallProgress = 0,
  currentPhase = '',
  isActive = false,
  totalSteps = 0
}) => {
  const rotateAnim = useSharedValue(0)
  const heightAnim = useSharedValue(0)
  const fadeAnim = useSharedValue(0)
  const slideAnim = useSharedValue(-10)
  const progressAnim = useSharedValue(0)
  const phaseAnim = useSharedValue(0)
  
  useEffect(() => {
    // Initial animation
    fadeAnim.value = withTiming(1, { duration: 300 })
    slideAnim.value = withSpring(0, {
      damping: 15,
      stiffness: 100
    })
  }, [])
  
  // Progress animation
  useEffect(() => {
    progressAnim.value = withTiming(overallProgress / 100, {
      duration: 500,
      easing: Easing.out(Easing.ease)
    })
  }, [overallProgress])
  
  // Phase change animation
  useEffect(() => {
    if (currentPhase) {
      phaseAnim.value = withSequence(
        withTiming(1.05, { duration: 200 }),
        withTiming(1, { duration: 200 })
      )
    }
  }, [currentPhase])
  
  useEffect(() => {
    rotateAnim.value = withTiming(isExpanded ? 180 : 0, { 
      duration: 200,
      easing: Easing.inOut(Easing.ease)
    })
    heightAnim.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease)
    })
  }, [isExpanded])
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }]
  }))
  
  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }]
  }))
  
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`
  }))
  
  const animatedPhaseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: phaseAnim.value }]
  }))
  
  const animatedContentStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(heightAnim.value, [0, 1], [0, 500])
    const opacity = interpolate(heightAnim.value, [0, 0.5, 1], [0, 0, 1])
    
    return {
      maxHeight,
      opacity
    }
  })
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
  
  const getStepTypeLabel = (type: string) => {
    switch (type) {
      case 'thought': return 'Analysis'
      case 'tool_call': return 'Tool Use'
      case 'tool_result': return 'Result'
      case 'processing': return 'Processing'
      case 'synthesis': return 'Synthesis'
      default: return type
    }
  }
  
  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Brain size={16} color="#3B82F6" style={styles.headerIcon} />
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>AI Reasoning</Text>
            {isActive && currentPhase && (
              <Animated.Text style={[styles.currentPhase, animatedPhaseStyle]}>
                {currentPhase}
              </Animated.Text>
            )}
          </View>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalSteps > 0 ? `${steps.length}/${totalSteps}` : `${steps.length} steps`}
              </Text>
            </View>
            {toolsUsed > 0 && (
              <View style={[styles.badge, styles.toolBadge]}>
                <Search size={10} color="#10B981" />
                <Text style={[styles.badgeText, styles.toolBadgeText]}>{toolsUsed}</Text>
              </View>
            )}
            {isActive && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {overallProgress > 0 && overallProgress < 100 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{Math.round(overallProgress)}%</Text>
            </View>
          )}
          {duration > 0 && (
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
          )}
          <Animated.View style={animatedChevronStyle}>
            <ChevronDown size={16} color="#6B7280" />
          </Animated.View>
        </View>
      </TouchableOpacity>
      
      {/* Overall Progress Bar */}
      {(overallProgress > 0 || isActive) && (
        <View style={styles.overallProgressContainer}>
          <View style={styles.overallProgressTrack}>
            <Animated.View 
              style={[
                styles.overallProgressBar,
                animatedProgressStyle,
                { backgroundColor: isActive ? '#3B82F6' : '#10B981' }
              ]} 
            />
          </View>
        </View>
      )}
      
      <Animated.View style={[styles.content, animatedContentStyle]}>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const Icon = getStepIcon(step)
            const color = getStepColor(step)
            
            return (
              <View key={`${step.type}-${index}`} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <View style={[styles.stepDot, { backgroundColor: color }]}>
                    <Icon size={10} color="white" />
                  </View>
                  {index < steps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: color + '30' }]} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <View style={styles.stepHeader}>
                    <Text style={[styles.stepType, { color }]}>
                      {getStepTypeLabel(step.type)}
                    </Text>
                    {step.metadata?.step && (
                      <Text style={styles.stepNumber}>Step {step.metadata.step}</Text>
                    )}
                  </View>
                  <Text style={styles.stepText}>{step.content}</Text>
                  {step.metadata?.result_size && (
                    <Text style={styles.stepMeta}>
                      Result size: {step.metadata.result_size} characters
                    </Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  titleContainer: {
    flexDirection: 'column',
    marginRight: 8
  },
  currentPhase: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerIcon: {
    marginRight: 8
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  progressContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  progressText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600'
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6
  },
  badgeText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500'
  },
  toolBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  toolBadgeText: {
    color: '#10B981'
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  activeText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  duration: {
    fontSize: 12,
    color: '#6B7280'
  },
  overallProgressContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  overallProgressTrack: {
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 1.5
  },
  overallProgressBar: {
    height: 3,
    borderRadius: 1.5
  },
  content: {
    overflow: 'hidden'
  },
  stepsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  stepRow: {
    flexDirection: 'row',
    marginTop: 12
  },
  stepIndicator: {
    width: 24,
    alignItems: 'center'
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 4
  },
  stepContent: {
    flex: 1,
    marginLeft: 12
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8
  },
  stepType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  stepNumber: {
    fontSize: 10,
    color: '#9CA3AF'
  },
  stepText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18
  },
  stepMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  }
})