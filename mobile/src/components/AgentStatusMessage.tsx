import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { AgentReasoningCard, AgentStep } from './AgentReasoningCard'
import { ToolUseBadge, ToolType, ToolStatus } from './ToolUseBadge'
import { ReasoningSummary } from './ReasoningSummary'

interface AgentStatusMessageProps {
  steps: AgentStep[]
  tools: Array<{ tool: ToolType; status: ToolStatus }>
  showReasoningCard: boolean
  reasoningExpanded: boolean
  onToggleReasoning: () => void
  duration?: number
  isComplete?: boolean
}

export const AgentStatusMessage: React.FC<AgentStatusMessageProps> = ({
  steps,
  tools,
  showReasoningCard,
  reasoningExpanded,
  onToggleReasoning,
  duration,
  isComplete = false
}) => {
  const [showFullCard, setShowFullCard] = useState(false)
  const activeTools = tools.filter(t => t.status === 'active')
  const completedTools = tools.filter(t => t.status === 'complete')
  
  return (
    <View style={styles.container}>
      {/* Show active tools or full card based on completion status */}
      {isComplete && steps.length > 0 ? (
        // Show summary when complete
        showFullCard ? (
          <AgentReasoningCard
            steps={steps}
            isExpanded={reasoningExpanded}
            onToggle={onToggleReasoning}
            duration={duration}
            toolsUsed={completedTools.length}
          />
        ) : (
          <ReasoningSummary
            stepCount={steps.length}
            toolsUsed={completedTools.length}
            duration={duration || 0}
            onPress={() => setShowFullCard(true)}
          />
        )
      ) : (
        <>
          {/* Active tool badges during processing */}
          {activeTools.length > 0 && (
            <View style={styles.toolBadgeRow}>
              {activeTools.map((tool, index) => (
                <ToolUseBadge
                  key={`${tool.tool}-${index}`}
                  tool={tool.tool}
                  status={tool.status}
                />
              ))}
            </View>
          )}
          
          {/* Reasoning card during processing - always show if we have steps */}
          {showReasoningCard && steps.length > 0 && !isComplete && (
            <AgentReasoningCard
              steps={steps}
              isExpanded={reasoningExpanded}
              onToggle={onToggleReasoning}
              duration={duration}
              toolsUsed={completedTools.length}
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4
  },
  toolBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginVertical: 4,
    gap: 4
  }
})