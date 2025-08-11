import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Brain, Search, Clock } from 'lucide-react-native'

interface ReasoningSummaryProps {
  stepCount: number
  toolsUsed: number
  duration: number
  onPress: () => void
}

export const ReasoningSummary: React.FC<ReasoningSummaryProps> = ({
  stepCount,
  toolsUsed,
  duration,
  onPress
}) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Brain size={12} color="#6B7280" style={styles.icon} />
        <Text style={styles.text}>
          Used {toolsUsed > 0 ? `${toolsUsed} tool${toolsUsed > 1 ? 's' : ''}` : 'reasoning'}
        </Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.text}>{stepCount} steps</Text>
        <Text style={styles.separator}>•</Text>
        <Clock size={10} color="#6B7280" style={styles.icon} />
        <Text style={styles.text}>{formatDuration(duration)}</Text>
        <Text style={styles.link}>View details</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: -4,
    marginBottom: 8
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  icon: {
    marginRight: 4
  },
  text: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6
  },
  separator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4
  },
  link: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500'
  }
})