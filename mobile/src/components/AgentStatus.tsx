import React, { useEffect, useState, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { Feather } from '@expo/vector-icons'

interface ThinkingStep {
  id: string
  type: 'thinking_stream' | 'memory_access' | 'context_analysis' | 'search_planning' | 
        'search_result_analysis' | 'context_synthesis' | 'response_planning'
  content: string
  timestamp: number
}

interface SearchStep {
  id: string
  type: 'planning' | 'start' | 'progress' | 'analysis' | 'complete'
  tool: string
  content: string
  url?: string
  progress?: number
  timestamp: number
}

interface ToolCall {
  tool: string
  status: 'executing' | 'complete' | 'error'
  query?: string
  resultSize?: number
  duration?: number
}

interface AgentStatusProps {
  thinkingSteps: ThinkingStep[]
  searchSteps: SearchStep[]
  tools: ToolCall[]
  isActive: boolean
}

interface ActivityItem {
  id: string
  type: 'thinking' | 'search' | 'tool'
  label: string
  content: string
  status: 'executing' | 'complete'
  timestamp: number
  color: string
  url?: string
  duration?: number
  resultSize?: number
}

const STEP_COLORS = {
  thinking_stream: '#94a3b8',
  memory_access: '#a78bfa',
  context_analysis: '#86efac',
  search_planning: '#fbbf24',
  search_result_analysis: '#67e8f9',
  context_synthesis: '#c084fc',
  response_planning: '#86efac',
  web_search: '#67e8f9',
  comprehensive_search: '#c084fc',
  searchhive: '#67e8f9',
  website_scraping: '#c084fc',
  default: '#94a3b8'
}

export default function AgentStatus({ thinkingSteps, searchSteps, tools, isActive }: AgentStatusProps) {
  const [visibleItems, setVisibleItems] = useState<ActivityItem[]>([])
  const fadeAnims = useRef<Map<string, Animated.Value>>(new Map())
  
  // Memoize allActivities to prevent infinite re-renders
  const allActivities = useMemo(() => {
    const activities: ActivityItem[] = [
      // Thinking steps
      ...thinkingSteps.map((step, index) => ({
        id: step.id,
        type: 'thinking' as const,
        label: step.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: step.content.length > 40 ? step.content.substring(0, 40) + '...' : step.content,
        status: (index === thinkingSteps.length - 1 && isActive && searchSteps.length === 0 && tools.length === 0) ? 'executing' as const : 'complete' as const,
        timestamp: step.timestamp,
        color: STEP_COLORS[step.type] || STEP_COLORS.default
      })),
      
      // Search steps  
      ...searchSteps.map((step, index) => ({
        id: step.id,
        type: 'search' as const,
        label: step.tool === 'searchhive' ? 'Search' : step.tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: step.content.length > 35 ? step.content.substring(0, 35) + '...' : step.content,
        status: (step.type === 'complete' || index < searchSteps.length - 1) ? 'complete' as const : 
                (index === searchSteps.length - 1 && isActive) ? 'executing' as const : 'complete' as const,
        timestamp: step.timestamp,
        color: STEP_COLORS[step.tool as keyof typeof STEP_COLORS] || STEP_COLORS.web_search,
        url: step.url,
        resultSize: step.resultSize
      })),
      
      // Tool calls
      ...tools.map((tool, index) => ({
        id: `tool-${tool.tool}-${index}`,  // Use index instead of Date.now() to avoid constant changes
        type: 'tool' as const,
        label: tool.tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: tool.query || `Using ${tool.tool}`,
        status: tool.status,
        timestamp: Date.now() - (tools.length - index) * 100, // Stable timestamp based on order
        color: STEP_COLORS[tool.tool as keyof typeof STEP_COLORS] || STEP_COLORS.default,
        duration: tool.duration,
        resultSize: tool.resultSize
      }))
    ]
    
    return activities.sort((a, b) => a.timestamp - b.timestamp)
  }, [thinkingSteps, searchSteps, tools, isActive])
  
  useEffect(() => {
    // Keep only the last 3 activities for mobile
    const latestActivities = allActivities.slice(-3)
    
    // Only update if activities actually changed
    if (JSON.stringify(latestActivities.map(a => a.id)) !== JSON.stringify(visibleItems.map(a => a.id))) {
      setVisibleItems(latestActivities)
      
      // Create fade animations for new items
      latestActivities.forEach(item => {
        if (!fadeAnims.current.has(item.id)) {
          const fadeAnim = new Animated.Value(0)
          fadeAnims.current.set(item.id, fadeAnim)
          
          // Animate in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start()
        }
      })
      
      // Auto-collapse completed items after 2 seconds
      latestActivities.forEach(item => {
        if (item.status === 'complete') {
          setTimeout(() => {
            const fadeAnim = fadeAnims.current.get(item.id)
            if (fadeAnim) {
              Animated.timing(fadeAnim, {
                toValue: 0.4,
                duration: 300,
                useNativeDriver: true,
              }).start()
            }
          }, 2000)
        }
      })
    }
  }, [allActivities])
  
  if (visibleItems.length === 0) return null
  
  return (
    <View style={styles.container}>
      {visibleItems.map((item, index) => {
        const fadeAnim = fadeAnims.current.get(item.id) || new Animated.Value(1)
        const isExecuting = item.status === 'executing'
        
        return (
          <Animated.View
            key={item.id}
            style={[
              styles.eventBubble,
              {
                opacity: fadeAnim,
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}30`,
              }
            ]}
          >
            <View style={styles.eventContent}>
              <Text style={[styles.eventLabel, { color: item.color }]}>
                {item.label}
              </Text>
              {isExecuting && <Feather name="loader" size={10} color={item.color} style={styles.spinner} />}
              {item.status === 'complete' && <Feather name="check" size={10} color={item.color} style={styles.checkmark} />}
            </View>
            <Text style={styles.eventText} numberOfLines={1}>
              {item.content}
            </Text>
            {item.url && (
              <Text style={styles.eventMeta} numberOfLines={1}>
                {(() => {
                  try {
                    return new URL(item.url).hostname.replace('www.', '')
                  } catch {
                    return item.url.substring(0, 20)
                  }
                })()}
              </Text>
            )}
          </Animated.View>
        )
      })}
      
      {/* Processing indicator when no specific events */}
      {isActive && visibleItems.every(item => item.status === 'complete') && (
        <View style={[styles.eventBubble, { backgroundColor: '#94a3b815', borderColor: '#94a3b830' }]}>
          <View style={styles.eventContent}>
            <Text style={[styles.eventLabel, { color: '#94a3b8' }]}>Processing</Text>
            <Feather name="loader" size={10} color="#94a3b8" style={styles.spinner} />
          </View>
          <Text style={styles.eventText}>Analyzing...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  eventBubble: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    maxWidth: '80%',
    minWidth: 120,
    alignSelf: 'flex-start',
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  eventLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  eventText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 14,
  },
  eventMeta: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  spinner: {
    marginLeft: 4,
  },
  checkmark: {
    marginLeft: 4,
  },
})