'use client'

import React, { useEffect, useState, useRef } from 'react'

interface ThinkingStep {
  id: string
  type: 'thinking_stream' | 'memory_access' | 'context_analysis' | 'search_planning' | 
        'search_result_analysis' | 'context_synthesis' | 'response_planning'
  content: string
  phase?: string
  timestamp: number
  metadata?: any
}

interface ThinkingStreamProps {
  steps: ThinkingStep[]
  isActive: boolean
}

export function ThinkingStreamMinimal({ steps, isActive }: ThinkingStreamProps) {
  const [visibleSteps, setVisibleSteps] = useState<ThinkingStep[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [hasAutoMinimized, setHasAutoMinimized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const newSteps = steps.slice(visibleSteps.length)
    newSteps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
      }, index * 100)
    })
  }, [steps])
  
  // Auto-minimize when agent completes
  useEffect(() => {
    if (!isActive && visibleSteps.length > 0 && !hasAutoMinimized) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setHasAutoMinimized(true)
      }, 2000) // Wait 2 seconds after completion
      
      return () => clearTimeout(timer)
    }
  }, [isActive, visibleSteps.length, hasAutoMinimized])
  
  useEffect(() => {
    if (containerRef.current && isExpanded) {
      setTimeout(() => {
        containerRef.current!.scrollTop = containerRef.current!.scrollHeight
      }, 50)
    }
  }, [visibleSteps, isExpanded])
  
  if (visibleSteps.length === 0) return null
  
  const getPhaseLabel = (step: ThinkingStep) => {
    if (step.metadata?.phase) {
      return step.metadata.phase.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    return step.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }
  
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '16px',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden'
    }}>
      {/* Simple Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--surface-elevated)',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-elevated)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🧠</span>
          <span>AI Thinking</span>
          {isActive && (
            <span style={{
              width: '6px',
              height: '6px',
              background: '#10B981',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
          )}
          {!isActive && hasAutoMinimized && isExpanded && (
            <span style={{
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              padding: '1px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              REOPENED
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent-primary)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {visibleSteps.length}
          </span>
          <span style={{ 
            color: 'var(--text-tertiary)', 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}>
            ▼
          </span>
        </div>
      </button>
      
      {/* Simple Content */}
      {isExpanded && (
        <div 
          ref={containerRef}
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '12px 16px'
          }}
        >
          {visibleSteps.map((step, index) => {
            const isLatest = index === visibleSteps.length - 1
            
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '12px',
                  padding: isLatest && isActive ? '8px' : '4px',
                  borderRadius: '6px',
                  background: isLatest && isActive ? 'var(--accent-subtle)' : 'transparent',
                  opacity: 0,
                  animation: 'fadeIn 0.3s ease-out forwards',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Simple Timeline */}
                <div style={{ position: 'relative', paddingTop: '2px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: isLatest && isActive ? 'var(--accent-primary)' : 'var(--border)',
                    borderRadius: '50%',
                    border: '2px solid var(--surface)'
                  }} />
                  {index < visibleSteps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '3px',
                      top: '10px',
                      width: '1px',
                      height: '20px',
                      background: 'var(--border)'
                    }} />
                  )}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '600',
                    marginBottom: '2px'
                  }}>
                    {getPhaseLabel(step)}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4'
                  }}>
                    {step.content}
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Loading indicator */}
          {isActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-tertiary)',
              fontSize: '12px',
              paddingLeft: '16px'
            }}>
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" style={{ animationDelay: '0.2s' }} />
                <div className="loading-dot" style={{ animationDelay: '0.4s' }} />
              </div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}