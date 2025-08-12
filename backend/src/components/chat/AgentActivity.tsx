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

interface SearchStep {
  id: string
  type: 'planning' | 'start' | 'progress' | 'analysis' | 'complete'
  tool: string
  content: string
  url?: string
  progress?: number
  quality?: string
  timestamp: number
  metadata?: any
}

interface ToolCall {
  tool: string
  status: 'executing' | 'complete' | 'error'
  query?: string
  resultSize?: number
  duration?: number
}

interface AgentActivityProps {
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
  status: 'executing' | 'complete' | 'error'
  timestamp: number
  color: string
  url?: string
  duration?: number
  resultSize?: number
  collapsed?: boolean
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

export function AgentActivity({ thinkingSteps, searchSteps, tools, isActive }: AgentActivityProps) {
  const [visibleItems, setVisibleItems] = useState<ActivityItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const collapseTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  
  // Convert all activities to unified format
  const allActivities: ActivityItem[] = [
    // Thinking steps
    ...thinkingSteps.map((step, index) => ({
      id: step.id,
      type: 'thinking' as const,
      label: step.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: step.content.length > 50 ? step.content.substring(0, 50) + '...' : step.content,
      status: (index === thinkingSteps.length - 1 && isActive && searchSteps.length === 0 && tools.length === 0) ? 'executing' as const : 'complete' as const,
      timestamp: step.timestamp,
      color: STEP_COLORS[step.type] || STEP_COLORS.default
    })),
    
    // Search steps
    ...searchSteps.map((step, index) => ({
      id: step.id,
      type: 'search' as const,
      label: step.tool === 'searchhive' ? 'Search' : step.tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: step.content.length > 40 ? step.content.substring(0, 40) + '...' : step.content,
      status: (step.type === 'complete' || index < searchSteps.length - 1) ? 'complete' as const : 
              (index === searchSteps.length - 1 && isActive) ? 'executing' as const : 'complete' as const,
      timestamp: step.timestamp,
      color: STEP_COLORS[step.tool as keyof typeof STEP_COLORS] || STEP_COLORS.web_search,
      url: step.url,
      resultSize: step.metadata?.resultCount
    })),
    
    // Tool calls
    ...tools.map(tool => ({
      id: `tool-${tool.tool}-${Date.now()}`,
      type: 'tool' as const,
      label: tool.tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: tool.query || `Using ${tool.tool}`,
      status: tool.status,
      timestamp: Date.now(),
      color: STEP_COLORS[tool.tool as keyof typeof STEP_COLORS] || STEP_COLORS.default,
      duration: tool.duration,
      resultSize: tool.resultSize
    }))
  ].sort((a, b) => a.timestamp - b.timestamp)
  
  useEffect(() => {
    // Always keep only the last 3 activities, regardless of how fast they come
    const latestActivities = allActivities.slice(-3)
    
    // Clear existing timeouts
    collapseTimeouts.current.forEach(timeout => clearTimeout(timeout))
    collapseTimeouts.current.clear()
    
    // Set visible items to latest 3
    setVisibleItems(latestActivities)
    
    // Auto-collapse completed items after 2 seconds
    latestActivities.forEach(item => {
      if (item.status === 'complete') {
        const timeoutId = setTimeout(() => {
          setVisibleItems(prev => 
            prev.map(i => i.id === item.id ? { ...i, collapsed: true } : i)
          )
        }, 2000)
        collapseTimeouts.current.set(item.id, timeoutId)
      }
    })
    
    // Cleanup timeouts on unmount
    return () => {
      collapseTimeouts.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [allActivities])
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [visibleItems])
  
  if (allActivities.length === 0) return null
  
  // Display items are already limited to 3 in the useEffect
  const displayItems = visibleItems
  
  return (
    <>
      <style jsx>{`
        .activity-bubble {
          display: inline-block;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 4px 10px;
          margin-bottom: 4px;
          transition: all 0.2s ease;
          opacity: 0;
          animation: fadeIn 0.2s ease forwards;
          max-width: fit-content;
        }
        
        .activity-bubble.collapsed {
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.015);
          border-color: rgba(255, 255, 255, 0.02);
          font-size: 0.65rem;
        }
        
        .activity-bubble.executing {
          background: rgba(var(--bubble-color-rgb), 0.06);
          border-color: rgba(var(--bubble-color-rgb), 0.12);
        }
        
        .activity-bubble.complete {
          opacity: 0.6;
        }
        
        .activity-bubble.collapsed .content-full {
          display: none;
        }
        
        .activity-bubble.collapsed .content-summary {
          display: inline;
        }
        
        .content-summary {
          display: none;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .activity-label {
          display: inline;
          font-size: 0.65rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          opacity: 0.7;
        }
        
        .activity-content {
          display: inline;
          font-size: 0.75rem;
          line-height: 1.2;
          color: rgba(255, 255, 255, 0.8);
          margin-left: 6px;
        }
        
        .activity-meta {
          display: inline;
          margin-left: 8px;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.35);
        }
        
        .spinner {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-left: 6px;
          border: 1px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
        }
        
        .checkmark {
          display: inline-block;
          width: 10px;
          height: 10px;
          margin-left: 6px;
          background: rgba(134, 239, 172, 0.15);
          border-radius: 50%;
          position: relative;
          vertical-align: middle;
        }
        
        .checkmark::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.5rem;
          color: #86efac;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .activity-container {
          padding: 0;
        }
        
        .activity-wrapper {
          margin-bottom: 3px;
        }
        
        /* Pulse animation for active items */
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        
        .activity-bubble.executing {
          animation: fadeIn 0.2s ease forwards, gentlePulse 2s ease-in-out infinite;
        }
      `}</style>
      
      <div 
        ref={containerRef}
        className="activity-container"
      >
        {displayItems.map((item, index) => {
          const isCompleted = item.status === 'complete'
          const isExecuting = item.status === 'executing'
          const isCollapsed = item.collapsed
          
          // Convert hex to RGB for CSS custom properties
          const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '148, 163, 184'
          }
          
          return (
            <div key={item.id} className="activity-wrapper">
              <div
                className={`activity-bubble ${isExecuting ? 'executing' : ''} ${isCompleted ? 'complete' : ''} ${isCollapsed ? 'collapsed' : ''}`}
                style={{ 
                  '--bubble-color': item.color,
                  '--bubble-color-rgb': hexToRgb(item.color),
                  animationDelay: `${index * 0.05}s`,
                  opacity: index === 0 ? 0.4 : (index === 1 ? 0.7 : 1)
                } as React.CSSProperties}
              >
                <span className="activity-label" style={{ color: item.color }}>
                  {item.label}
                  {isExecuting && <span className="spinner" />}
                  {isCompleted && !isCollapsed && <span className="checkmark" />}
                </span>
                
                <span className="content-full">
                  <span className="activity-content">
                    {item.content}
                  </span>
                  
                  {(item.url || item.duration || item.resultSize) && (
                    <span className="activity-meta">
                      {item.url && (
                        <span>
                          • {(() => {
                            try {
                              return new URL(item.url).hostname.replace('www.', '')
                            } catch {
                              return item.url.substring(0, 15)
                            }
                          })()}
                        </span>
                      )}
                      {item.duration && item.status === 'complete' && (
                        <span> • {(item.duration / 1000).toFixed(1)}s</span>
                      )}
                      {item.resultSize && (
                        <span> • {item.resultSize}</span>
                      )}
                    </span>
                  )}
                </span>
                
                <span className="content-summary">
                  Complete
                </span>
              </div>
            </div>
          )
        })}
        
        {/* Processing indicator */}
        {isActive && visibleItems.every(item => item.status === 'complete') && (
          <div className="activity-wrapper">
            <div
              className="activity-bubble executing"
              style={{ 
                '--bubble-color': '#94a3b8',
                '--bubble-color-rgb': '148, 163, 184'
              } as React.CSSProperties}
            >
              <span className="activity-label" style={{ color: '#94a3b8' }}>
                Processing
                <span className="spinner" />
              </span>
              <span className="activity-content" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                Analyzing...
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}