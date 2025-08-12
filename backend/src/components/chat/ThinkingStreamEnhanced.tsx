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

const STEP_CONFIG = {
  thinking_stream: {
    color: '#667eea',
    label: 'Thinking'
  },
  memory_access: {
    color: '#a855f7',
    label: 'Memory'
  },
  context_analysis: {
    color: '#10b981',
    label: 'Analysis'
  },
  search_planning: {
    color: '#f59e0b',
    label: 'Planning'
  },
  search_result_analysis: {
    color: '#06b6d4',
    label: 'Analyzing'
  },
  context_synthesis: {
    color: '#8b5cf6',
    label: 'Synthesis'
  },
  response_planning: {
    color: '#10b981',
    label: 'Planning'
  }
}

export function ThinkingStreamEnhanced({ steps, isActive }: ThinkingStreamProps) {
  const [visibleSteps, setVisibleSteps] = useState<ThinkingStep[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [hasAutoMinimized, setHasAutoMinimized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const newSteps = steps.slice(visibleSteps.length)
    newSteps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
      }, index * 200)
    })
  }, [steps])
  
  useEffect(() => {
    if (!isActive && visibleSteps.length > 0 && !hasAutoMinimized) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setHasAutoMinimized(true)
      }, 3000)
      
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
    return STEP_CONFIG[step.type]?.label || 'Processing'
  }
  
  const getStepColor = (step: ThinkingStep) => {
    return STEP_CONFIG[step.type]?.color || '#667eea'
  }
  
  return (
    <>
      <style jsx>{`
        .timeline-connector {
          position: absolute;
          left: 4px;
          top: 12px;
          bottom: -8px;
          width: 1px;
          background: linear-gradient(to bottom, var(--border), transparent);
          opacity: 0.4;
        }
        
        .timeline-dot {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2;
        }
        
        .timeline-dot.active {
          animation: pulse-glow 2s infinite;
        }
        
        .timeline-dot.completed {
          box-shadow: 0 0 20px rgba(var(--step-color-rgb), 0.4);
        }
        
        .step-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
        }
        
        .step-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }
        
        .step-card.active {
          background: rgba(var(--step-color-rgb), 0.05);
          border-color: rgba(var(--step-color-rgb), 0.2);
        }
        
        .step-card.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--step-color), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(var(--step-color-rgb), 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 25px rgba(var(--step-color-rgb), 0.6);
            transform: scale(1.05);
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .step-enter {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      
      <div className="glass-card" style={{ marginBottom: '16px', width: '30%', maxWidth: '400px' }}>
        {/* Compact Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 flex items-center justify-between hover:bg-white/5 transition-all duration-200 group"
          style={{ borderRadius: '8px 8px 0 0' }}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {isActive && (
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: '#10b981' }}
                  />
                )}
              </div>
            </div>
            <div className="text-left">
              <div className="font-medium text-xs text-white/90">
                AI Thinking
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="px-2 py-0.5 text-xs font-medium rounded-full"
              style={{ 
                background: 'rgba(102, 126, 234, 0.2)',
                color: '#667eea',
                border: '1px solid rgba(102, 126, 234, 0.3)'
              }}
            >
              {visibleSteps.length}
            </div>
            <svg 
              className={`w-3 h-3 text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {/* Compact Content */}
        {isExpanded && (
          <div 
            ref={containerRef}
            className="max-h-64 overflow-y-auto px-2 pb-2 space-y-2"
          >
            {visibleSteps.map((step, index) => {
              const config = STEP_CONFIG[step.type] || STEP_CONFIG.thinking_stream
              const isLatest = index === visibleSteps.length - 1
              const isCompleted = index < visibleSteps.length - 1 || !isActive
              const stepColor = getStepColor(step)
              
              // Convert hex to RGB for CSS custom properties
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '102, 126, 234'
              }
              
              return (
                <div
                  key={step.id}
                  className="step-enter"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    '--step-color': stepColor,
                    '--step-color-rgb': hexToRgb(stepColor)
                  } as React.CSSProperties}
                >
                  <div className="flex gap-2 relative">
                    {/* Timeline */}
                    <div className="relative flex-shrink-0" style={{ paddingTop: '6px' }}>
                      <div 
                        className={`timeline-dot ${isLatest && isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                        style={{
                          background: stepColor,
                          boxShadow: isCompleted ? `0 0 8px ${stepColor}40` : `0 0 4px ${stepColor}30`
                        }}
                      />
                      {index < visibleSteps.length - 1 && <div className="timeline-connector" />}
                    </div>
                    
                    {/* Content Card */}
                    <div className={`step-card ${isLatest && isActive ? 'active' : ''} flex-1 p-2`}>
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="text-xs font-medium"
                          style={{ color: stepColor }}
                        >
                          {getPhaseLabel(step)}
                        </span>
                        {step.metadata?.duration && (
                          <span className="text-xs text-white/40">
                            {step.metadata.duration}ms
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-white/70 leading-tight">
                        {step.content.length > 80 ? step.content.substring(0, 80) + '...' : step.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Active Processing Indicator */}
            {isActive && (
              <div className="flex gap-2 relative">
                <div className="relative flex-shrink-0" style={{ paddingTop: '6px' }}>
                  <div 
                    className="timeline-dot active"
                    style={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      animation: 'pulse-glow 1.5s infinite'
                    }}
                  />
                </div>
                
                <div className="step-card active flex-1 p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs text-white/60">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}