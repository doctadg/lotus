import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeIn,
  SlideInRight,
  Layout
} from 'react-native-reanimated'
import { 
  Brain, 
  Search, 
  Database, 
  Zap, 
  Target, 
  Eye, 
  CheckCircle,
  Clock,
  ChevronUp,
  ChevronDown
} from 'lucide-react-native'

interface ThinkingStep {
  id: string
  type: 'thinking_stream' | 'memory_access' | 'context_analysis' | 'search_planning' | 'search_result_analysis' | 'context_synthesis' | 'response_planning'
  content: string
  phase?: string
  timestamp: number
  metadata?: any
}

interface ThinkingStreamComponentProps {
  steps: ThinkingStep[]
  isActive: boolean
  maxHeight?: number
  autoScroll?: boolean
  showTimestamps?: boolean
  collapsible?: boolean
}

const STEP_CONFIG = {
  thinking_stream: {
    icon: Brain,
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    label: 'Thinking'
  },
  memory_access: {
    icon: Database,
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    label: 'Memory'
  },
  context_analysis: {
    icon: Eye,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    label: 'Analysis'
  },
  search_planning: {
    icon: Target,
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    label: 'Planning'
  },
  search_result_analysis: {
    icon: Search,
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    label: 'Analyzing'
  },
  context_synthesis: {
    icon: Zap,
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    label: 'Synthesis'
  },
  response_planning: {
    icon: CheckCircle,
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    label: 'Planning'
  }
}

const { width: screenWidth } = Dimensions.get('window')

export const ThinkingStreamComponent: React.FC<ThinkingStreamComponentProps> = ({
  steps,
  isActive,
  maxHeight = 300,
  autoScroll = true,
  showTimestamps = false,
  collapsible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [visibleSteps, setVisibleSteps] = useState<ThinkingStep[]>([])
  const scrollViewRef = useRef<ScrollView>(null)
  
  const fadeAnim = useSharedValue(0)
  const slideAnim = useSharedValue(-20)
  const heightAnim = useSharedValue(1)
  
  // Add steps with animation delay
  useEffect(() => {
    if (steps.length === 0) return
    
    const newSteps = steps.slice(visibleSteps.length)
    if (newSteps.length === 0) return
    
    // Add new steps with staggered animation
    newSteps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
      }, index * 150) // Stagger by 150ms
    })
  }, [steps])
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollViewRef.current && visibleSteps.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [visibleSteps, autoScroll])
  
  // Initial animation
  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 300 })
    slideAnim.value = withSpring(0, {
      damping: 15,
      stiffness: 100
    })
  }, [])
  
  // Collapse animation
  useEffect(() => {
    heightAnim.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease)
    })
  }, [isExpanded])
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }]
  }))
  
  const animatedContentStyle = useAnimatedStyle(() => {
    const height = interpolate(heightAnim.value, [0, 1], [0, maxHeight])
    const opacity = interpolate(heightAnim.value, [0, 0.5, 1], [0, 0, 1])
    
    return {
      height,
      opacity
    }
  })
  
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 1000) return 'now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    return `${Math.floor(diff / 60000)}m ago`
  }
  
  const getPhaseLabel = (step: ThinkingStep) => {
    if (step.metadata?.phase) {
      return step.metadata.phase.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    return STEP_CONFIG[step.type]?.label || 'Processing'
  }
  
  const renderStep = (step: ThinkingStep, index: number) => {
    const config = STEP_CONFIG[step.type] || STEP_CONFIG.thinking_stream
    const Icon = config.icon
    const isLatest = index === visibleSteps.length - 1
    
    return (
      <Animated.View
        key={step.id}
        entering={SlideInRight.delay(100).springify()}
        layout={Layout.springify()}
        style={[
          styles.stepContainer,
          isLatest && isActive && styles.activeStep
        ]}
      >
        <View style={styles.stepIndicator}>
          <View style={[styles.stepIcon, { backgroundColor: config.backgroundColor }]}>
            <Icon size={12} color={config.color} />
          </View>
          {index < visibleSteps.length - 1 && (
            <View style={[styles.stepLine, { backgroundColor: config.color + '20' }]} />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.stepHeader}>
            <Text style={[styles.stepLabel, { color: config.color }]}>
              {getPhaseLabel(step)}
            </Text>
            {showTimestamps && (
              <Text style={styles.timestamp}>
                {formatTimestamp(step.timestamp)}
              </Text>
            )}
          </View>
          
          <Text style={styles.stepText}>{step.content}</Text>
          
          {/* Additional metadata */}
          {step.metadata && (
            <View style={styles.metadataContainer}>
              {step.metadata.queryLength && (
                <View style={styles.metadataChip}>
                  <Text style={styles.metadataText}>
                    {step.metadata.queryLength} chars
                  </Text>
                </View>
              )}
              {step.metadata.relevantCount !== undefined && (
                <View style={styles.metadataChip}>
                  <Text style={styles.metadataText}>
                    {step.metadata.relevantCount} memories
                  </Text>
                </View>
              )}
              {step.metadata.toolCount && (
                <View style={styles.metadataChip}>
                  <Text style={styles.metadataText}>
                    {step.metadata.toolCount} tools
                  </Text>
                </View>
              )}
              {step.metadata.responseLength && (
                <View style={styles.metadataChip}>
                  <Text style={styles.metadataText}>
                    {step.metadata.responseLength} chars
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Active indicator */}
        {isLatest && isActive && (
          <Animated.View 
            style={styles.activeIndicator}
            entering={FadeIn.delay(200)}
          >
            <View style={styles.pulseRing} />
          </Animated.View>
        )}
      </Animated.View>
    )
  }
  
  if (visibleSteps.length === 0) return null
  
  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {/* Header */}
      {collapsible && (
        <TouchableOpacity 
          style={styles.header}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Brain size={16} color="#3B82F6" />
            <Text style={styles.headerTitle}>AI Thinking Process</Text>
            <View style={styles.stepCount}>
              <Text style={styles.stepCountText}>{visibleSteps.length}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {isActive && (
              <View style={styles.activeStatus}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Thinking...</Text>
              </View>
            )}
            {isExpanded ? (
              <ChevronUp size={16} color="#6B7280" />
            ) : (
              <ChevronDown size={16} color="#6B7280" />
            )}
          </View>
        </TouchableOpacity>
      )}
      
      {/* Content */}
      <Animated.View style={[styles.content, animatedContentStyle]}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.stepsContainer}>
            {visibleSteps.map((step, index) => renderStep(step, index))}
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8
  },
  stepCount: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8
  },
  stepCountText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  activeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500'
  },
  content: {
    overflow: 'hidden'
  },
  scrollView: {
    flex: 1
  },
  stepsContainer: {
    padding: 16
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative'
  },
  activeStep: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: -12
  },
  stepIndicator: {
    width: 24,
    alignItems: 'center',
    marginRight: 12
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 4
  },
  stepContent: {
    flex: 1
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF'
  },
  stepText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6
  },
  metadataChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  metadataText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500'
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  pulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    left: -4,
    top: -4
  }
})