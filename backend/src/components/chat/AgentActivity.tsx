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
      content: step.content.length > 100 ? step.content.substring(0, 100) + '...' : step.content,
      status: (index === thinkingSteps.length - 1 && isActive && searchSteps.length === 0 && tools.length === 0) ? 'executing' as const : 'complete' as const,
      timestamp: step.timestamp,
      color: STEP_COLORS[step.type] || STEP_COLORS.default
    })),
    
    // Search steps
    ...searchSteps.map((step, index) => ({
      id: step.id,
      type: 'search' as const,
      label: step.tool === 'searchhive' ? 'Web Search' : step.tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: step.content.length > 80 ? step.content.substring(0, 80) + '...' : step.content,
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
    // Add new items with simple fade-in
    const newItems = allActivities.slice(visibleItems.length)
    newItems.forEach((item, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, item])
        
        // Auto-collapse completed items after 3 seconds
        if (item.status === 'complete') {
          const timeoutId = setTimeout(() => {
            setVisibleItems(prev => 
              prev.map(i => i.id === item.id ? { ...i, collapsed: true } : i)
            )
          }, 3000)
          collapseTimeouts.current.set(item.id, timeoutId)
        }
      }, index * 100)
    })
    
    // Cleanup timeouts on unmount
    return () => {
      collapseTimeouts.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [allActivities.length])
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [visibleItems])
  
  if (allActivities.length === 0) return null
  
  // Only show last 6 activities, older ones fade out
  const displayItems = visibleItems.slice(-6)
  
  return (
    <>
      <style jsx>{`
        .activity-bubble {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 10px 14px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          opacity: 0;
          animation: fadeIn 0.3s ease forwards;
        }
        
        .activity-bubble.collapsed {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.03);
        }
        
        .activity-bubble.executing {
          background: rgba(var(--bubble-color-rgb), 0.08);
          border-color: rgba(var(--bubble-color-rgb), 0.15);
        }
        
        .activity-bubble.complete {
          opacity: 0.7;
        }
        
        .activity-bubble.collapsed .content-full {
          display: none;
        }
        
        .activity-bubble.collapsed .content-summary {
          display: block;
        }
        
        .content-summary {
          display: none;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .activity-label {
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          opacity: 0.8;
        }
        
        .activity-content {
          font-size: 0.875rem;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.85);
        }
        
        .activity-meta {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .spinner {
          display: inline-block;
          width: 10px;
          height: 10px;
          margin-left: 8px;
          border: 1.5px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .checkmark {
          display: inline-block;
          width: 14px;
          height: 14px;
          margin-left: 8px;
          background: rgba(134, 239, 172, 0.2);
          border-radius: 50%;
          position: relative;
        }
        
        .checkmark::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.6rem;
          color: #86efac;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .activity-container {
          max-width: 600px;
          padding: 0 12px;
        }
        
        /* Pulse animation for active items */
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        
        .activity-bubble.executing {
          animation: fadeIn 0.3s ease forwards, gentlePulse 2s ease-in-out infinite;
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
            <div
              key={item.id}
              className={`activity-bubble ${isExecuting ? 'executing' : ''} ${isCompleted ? 'complete' : ''} ${isCollapsed ? 'collapsed' : ''}`}
              style={{ 
                '--bubble-color': item.color,
                '--bubble-color-rgb': hexToRgb(item.color),
                animationDelay: `${index * 0.05}s`,
                opacity: index < displayItems.length - 3 ? 0.4 : 1
              } as React.CSSProperties}
            >
              <div className="activity-label" style={{ color: item.color }}>
                {item.label}
                {isExecuting && <span className="spinner" />}
                {isCompleted && !isCollapsed && <span className="checkmark" />}
              </div>
              
              <div className="content-full">
                <div className="activity-content">
                  {item.content}
                </div>
                
                {(item.url || item.duration || item.resultSize) && (
                  <div className="activity-meta">
                    {item.url && (
                      <span>
                        {(() => {
                          try {
                            return new URL(item.url).hostname.replace('www.', '')
                          } catch {
                            return item.url.substring(0, 20)
                          }
                        })()}
                      </span>
                    )}
                    {item.duration && item.status === 'complete' && (
                      <span>{(item.duration / 1000).toFixed(1)}s</span>
                    )}
                    {item.resultSize && (
                      <span>{item.resultSize} results</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="content-summary">
                {item.label} • Complete
              </div>
            </div>
          )
        })}
        
        {/* Processing indicator */}
        {isActive && visibleItems.every(item => item.status === 'complete') && (
          <div
            className="activity-bubble executing"
            style={{ 
              '--bubble-color': '#94a3b8',
              '--bubble-color-rgb': '148, 163, 184'
            } as React.CSSProperties}
          >
            <div className="activity-label" style={{ color: '#94a3b8' }}>
              Processing
              <span className="spinner" />
            </div>
            <div className="activity-content" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Analyzing information...
            </div>
          </div>
        )}
      </div>
    </>
  )
}