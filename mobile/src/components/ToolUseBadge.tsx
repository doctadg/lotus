import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated'
import { Search, Database, Brain } from 'lucide-react-native'

export type ToolType = 'web_search' | 'comprehensive_search' | 'memory' | 'processing'
export type ToolStatus = 'pending' | 'initializing' | 'active' | 'processing' | 'analyzing' | 'complete' | 'error'
export type ToolPhase = 'preparing' | 'executing' | 'processing' | 'analyzing' | 'complete'

interface ToolUseBadgeProps {
  tool: ToolType
  status: ToolStatus
  compact?: boolean
  description?: string
  phase?: ToolPhase
  progress?: number
  url?: string
  quality?: 'high' | 'moderate' | 'basic'
  resultSize?: number
  duration?: number
}

const TOOL_CONFIG = {
  web_search: {
    icon: Search,
    label: 'Web Search',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    phases: {
      preparing: 'Preparing search...',
      executing: 'Searching web...',
      processing: 'Processing results...',
      analyzing: 'Analyzing content...',
      complete: 'Search complete'
    }
  },
  comprehensive_search: {
    icon: Database,
    label: 'Deep Research',
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    phases: {
      preparing: 'Planning research...',
      executing: 'Deep searching...',
      processing: 'Scraping content...',
      analyzing: 'Analyzing data...',
      complete: 'Research complete'
    }
  },
  memory: {
    icon: Brain,
    label: 'Memory Access',
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    phases: {
      preparing: 'Accessing memories...',
      executing: 'Retrieving context...',
      processing: 'Processing memories...',
      analyzing: 'Applying context...',
      complete: 'Memory loaded'
    }
  },
  processing: {
    icon: Brain,
    label: 'Processing',
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    phases: {
      preparing: 'Initializing...',
      executing: 'Processing...',
      processing: 'Computing...',
      analyzing: 'Finalizing...',
      complete: 'Processing complete'
    }
  }
}

export const ToolUseBadge: React.FC<ToolUseBadgeProps> = ({ 
  tool, 
  status, 
  compact = false,
  description,
  phase = 'executing',
  progress,
  url,
  quality,
  resultSize,
  duration
}) => {
  const config = TOOL_CONFIG[tool]
  const Icon = config.icon
  
  const pulseAnim = useSharedValue(0)
  const fadeAnim = useSharedValue(0)
  const scaleAnim = useSharedValue(0.8)
  
  useEffect(() => {
    // Fade in
    fadeAnim.value = withTiming(1, { duration: 200 })
    scaleAnim.value = withTiming(1, { 
      duration: 300,
      easing: Easing.out(Easing.back(1.5))
    })
    
    // Start pulse animation for active states
    if (['initializing', 'active', 'processing', 'analyzing'].includes(status)) {
      const pulseDuration = status === 'analyzing' ? 400 : status === 'processing' ? 500 : 600
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: pulseDuration }),
          withTiming(0, { duration: pulseDuration })
        ),
        -1
      )
    } else if (status === 'complete') {
      // Stop pulsing and fade slightly
      pulseAnim.value = withTiming(0, { duration: 200 })
      fadeAnim.value = withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
    } else if (status === 'error') {
      pulseAnim.value = withTiming(0, { duration: 200 })
      fadeAnim.value = withTiming(0.6, { duration: 300 })
    }
  }, [status])
  
  const animatedContainerStyle = useAnimatedStyle(() => {
    const pulseScale = interpolate(pulseAnim.value, [0, 1], [1, 1.05])
    
    return {
      opacity: fadeAnim.value,
      transform: [{ scale: scaleAnim.value * pulseScale }]
    }
  })
  
  const animatedPulseRingStyle = useAnimatedStyle(() => {
    if (status !== 'active') return { opacity: 0 }
    
    return {
      opacity: interpolate(pulseAnim.value, [0, 1], [0.6, 0]),
      transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [0.8, 1.4]) }]
    }
  })
  
  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return '#10B981'
      case 'error':
        return '#EF4444'
      case 'processing':
        return '#F59E0B'
      case 'analyzing':
        return '#8B5CF6'
      default:
        return config.color
    }
  }
  
  const getDisplayLabel = () => {
    if (description) return description
    if (config.phases[phase]) return config.phases[phase]
    return config.label
  }
  
  const getQualityIndicator = () => {
    if (!quality || status !== 'complete') return null
    
    const qualityColors = {
      high: '#10B981',
      moderate: '#F59E0B', 
      basic: '#6B7280'
    }
    
    return (
      <View style={[styles.qualityDot, { backgroundColor: qualityColors[quality] }]} />
    )
  }
  
  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, animatedContainerStyle]}>
        <View style={[styles.compactBadge, { backgroundColor: config.backgroundColor }]}>
          <Icon size={12} color={getStatusColor()} />
          {getQualityIndicator()}
        </View>
      </Animated.View>
    )
  }
  
  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
        {status === 'active' && (
          <Animated.View 
            style={[
              styles.pulseRing, 
              { backgroundColor: config.backgroundColor },
              animatedPulseRingStyle
            ]} 
          />
        )}
        
        <View style={styles.content}>
          <Icon size={14} color={getStatusColor()} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={[styles.label, { color: getStatusColor() }]}>
              {getDisplayLabel()}
            </Text>
            
            {/* URL display for web searches */}
            {url && status !== 'complete' && (
              <Text style={styles.urlText} numberOfLines={1}>
                {url.length > 30 ? url.substring(0, 30) + '...' : url}
              </Text>
            )}
            
            {/* Progress indicator */}
            {progress !== undefined && status !== 'complete' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%`, backgroundColor: getStatusColor() }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
            )}
          </View>
          
          <View style={styles.statusIndicators}>
            {/* Active animation */}
            {['initializing', 'active', 'processing', 'analyzing'].includes(status) && (
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
                <Animated.View style={[styles.dot, styles.dotDelay1, { backgroundColor: getStatusColor() }]} />
                <Animated.View style={[styles.dot, styles.dotDelay2, { backgroundColor: getStatusColor() }]} />
              </View>
            )}
            
            {/* Completion indicators */}
            {status === 'complete' && (
              <View style={styles.completionContainer}>
                <Text style={styles.checkmark}>✓</Text>
                {resultSize && (
                  <Text style={styles.resultSize}>
                    {resultSize > 1000 ? `${Math.floor(resultSize/1000)}KB` : `${resultSize}B`}
                  </Text>
                )}
                {getQualityIndicator()}
              </View>
            )}
            
            {/* Error indicator */}
            {status === 'error' && (
              <Text style={styles.errorMark}>✗</Text>
            )}
            
            {/* Duration for completed tasks */}
            {status === 'complete' && duration && (
              <Text style={styles.duration}>
                {duration < 1000 ? `${duration}ms` : `${(duration/1000).toFixed(1)}s`}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
    alignSelf: 'flex-start'
  },
  compactContainer: {
    marginHorizontal: 4
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'relative'
  },
  compactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  textContainer: {
    flex: 1,
    minHeight: 20
  },
  statusIndicators: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4
  },
  icon: {
    marginRight: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16
  },
  urlText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: 'monospace'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1
  },
  progressFill: {
    height: 2,
    borderRadius: 1
  },
  progressText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
    minWidth: 25,
    textAlign: 'right'
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 6,
    gap: 2
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6
  },
  dotDelay1: {
    opacity: 0.8
  },
  dotDelay2: {
    opacity: 1
  },
  completionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  checkmark: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600'
  },
  errorMark: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600'
  },
  resultSize: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500'
  },
  duration: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: -2,
    right: -2
  }
})