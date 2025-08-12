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

interface AIProcessingProps {
  thinkingSteps: ThinkingStep[]
  searchSteps: SearchStep[]
  isActive: boolean
}

export function AIProcessingMinimal({ thinkingSteps, searchSteps, isActive }: AIProcessingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [hasAutoMinimized, setHasAutoMinimized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Auto-minimize when processing completes
  useEffect(() => {
    if (!isActive && (thinkingSteps.length > 0 || searchSteps.length > 0) && !hasAutoMinimized) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setHasAutoMinimized(true)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isActive, thinkingSteps.length, searchSteps.length, hasAutoMinimized])
  
  useEffect(() => {
    if (containerRef.current && isExpanded) {
      setTimeout(() => {
        containerRef.current!.scrollTop = containerRef.current!.scrollHeight
      }, 50)
    }
  }, [thinkingSteps, searchSteps, isExpanded])
  
  if (thinkingSteps.length === 0 && searchSteps.length === 0) return null
  
  // Determine current phase and status
  const hasSearch = searchSteps.length > 0
  const latestSearchStep = searchSteps[searchSteps.length - 1]
  const latestThinkingStep = thinkingSteps[thinkingSteps.length - 1]
  
  let currentPhase = 'Analyzing your question...'
  let progress = 10
  
  if (hasSearch) {
    if (latestSearchStep?.metadata?.phase === 'search_complete') {
      currentPhase = 'Synthesizing comprehensive response...'
      progress = 90
    } else if (latestSearchStep?.type === 'complete') {
      currentPhase = 'Research complete, preparing response...'
      progress = 85
    } else if (searchSteps.some(s => s.url)) {
      currentPhase = 'Extracting information from sources...'
      progress = 60
    } else if (latestSearchStep?.metadata?.phase === 'results_found') {
      currentPhase = 'Found results, analyzing content...'
      progress = 40
    } else {
      currentPhase = 'Searching for current information...'
      progress = 30
    }
  } else if (latestThinkingStep?.metadata?.phase === 'tool_consideration') {
    currentPhase = 'Determining research approach...'
    progress = 20
  }
  
  // Group website scraping steps by URL
  const websiteSteps = searchSteps.filter(step => step.url && step.metadata?.phase?.startsWith('scraping'))
  const websites = websiteSteps.reduce((acc, step) => {
    try {
      const url = step.url!
      const hostname = new URL(url).hostname
      if (!acc[hostname]) {
        acc[hostname] = { url, steps: [], title: step.metadata?.title || hostname }
      }
      acc[hostname].steps.push(step)
    } catch (error) {
      console.error('Error parsing URL:', step.url, error)
    }
    return acc
  }, {} as Record<string, { url: string; steps: SearchStep[]; title: string }>)
  
  const totalSteps = thinkingSteps.length + searchSteps.length
  
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '16px',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '16px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>🧠</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              AI Processing
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
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              {currentPhase}
            </div>
          </div>
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
            {totalSteps}
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
      
      {/* Expandable Content */}
      {isExpanded && (
        <div style={{ padding: '16px', paddingTop: '0' }}>
          {/* Progress Bar */}
          <div style={{
            height: '4px',
            background: 'var(--border)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              height: '100%',
              background: 'var(--accent-primary)',
              width: `${progress}%`,
              transition: 'width 0.5s ease-out',
              borderRadius: '2px'
            }} />
          </div>
          
          {/* Recent Activity */}
          <div 
            ref={containerRef}
            style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {/* Combined timeline of recent steps */}
            {[...thinkingSteps, ...searchSteps]
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-5) // Show last 5 steps
              .map((step, index) => {
                const isThinking = 'phase' in step
                const isLatest = index === 4 || index === [...thinkingSteps, ...searchSteps].sort((a, b) => a.timestamp - b.timestamp).slice(-5).length - 1
                
                return (
                  <div
                    key={step.id}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '8px',
                      padding: '4px',
                      borderRadius: '6px',
                      background: isLatest && isActive ? 'var(--accent-subtle)' : 'transparent'
                    }}
                  >
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: isLatest && isActive ? 'var(--accent-primary)' : 'var(--border)',
                      borderRadius: '50%',
                      marginTop: '6px',
                      flexShrink: 0
                    }} />
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4',
                      flex: 1
                    }}>
                      {step.content}
                    </div>
                  </div>
                )
              })}
          </div>
          
          {/* Website Progress Cards */}
          {Object.keys(websites).length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Sources ({Object.keys(websites).length}):
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {Object.values(websites).map((site, index) => {
                  const latestSiteStep = site.steps[site.steps.length - 1]
                  const phase = latestSiteStep.metadata?.phase
                  
                  let hostname = 'unknown'
                  try {
                    hostname = new URL(site.url).hostname
                  } catch (error) {
                    hostname = site.url.split('/')[2] || 'unknown'
                  }
                  
                  let status = '⏳'
                  let statusText = 'Extracting...'
                  let statusColor = 'var(--text-tertiary)'
                  
                  if (phase === 'scraping_success') {
                    status = '✅'
                    statusText = `${(latestSiteStep.metadata?.contentLength / 1000).toFixed(1)}k chars`
                    statusColor = 'var(--accent-primary)'
                  } else if (phase === 'scraping_error' || phase === 'scraping_fallback') {
                    status = '⚠️'
                    statusText = 'Using snippet'
                    statusColor = 'var(--text-secondary)'
                  }
                  
                  return (
                    <div key={`${hostname}-${index}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flex: 1,
                        minWidth: 0
                      }}>
                        <span>{status}</span>
                        <span style={{
                          color: 'var(--text-primary)',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {hostname}
                        </span>
                      </div>
                      <span style={{
                        color: statusColor,
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {statusText}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Active indicator */}
          {isActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              fontSize: '12px',
              color: 'var(--text-tertiary)'
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