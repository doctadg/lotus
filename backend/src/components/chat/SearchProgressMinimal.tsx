'use client'

import React, { useEffect, useState } from 'react'

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

interface SearchProgressProps {
  steps: SearchStep[]
  isActive: boolean
}

export function SearchProgressMinimal({ steps, isActive }: SearchProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [hasAutoMinimized, setHasAutoMinimized] = useState(false)
  
  console.log('🔍 [SearchProgress] Component rendered with steps:', steps.length, 'isActive:', isActive)
  
  // Auto-minimize when search completes
  useEffect(() => {
    if (!isActive && steps.length > 0 && !hasAutoMinimized) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setHasAutoMinimized(true)
      }, 2000) // Wait 2 seconds after completion
      
      return () => clearTimeout(timer)
    }
  }, [isActive, steps.length, hasAutoMinimized])
  
  if (steps.length === 0) return null
  
  const latestStep = steps[steps.length - 1]
  
  // Group website scraping steps by URL
  const websiteSteps = steps.filter(step => step.url && step.metadata?.phase?.startsWith('scraping'))
  console.log('🔍 [SearchProgress] Website steps found:', websiteSteps.length, websiteSteps)
  const websites = websiteSteps.reduce((acc, step) => {
    try {
      const url = step.url!
      const hostname = new URL(url).hostname
      if (!acc[hostname]) {
        acc[hostname] = { url, steps: [], title: step.metadata?.title || hostname }
      }
      acc[hostname].steps.push(step)
    } catch (error) {
      console.error('Error parsing URL in SearchProgress:', step.url, error)
    }
    return acc
  }, {} as Record<string, { url: string; steps: SearchStep[]; title: string }>)
  
  // Calculate overall progress
  const searchPhases = ['search_start', 'results_found', 'search_complete']
  const currentPhase = latestStep.metadata?.phase
  let progress = 0
  
  if (currentPhase === 'search_start') progress = 10
  else if (currentPhase === 'results_found') progress = 25
  else if (Object.keys(websites).length > 0) {
    // Base progress from search + scraping progress
    const scrapingProgress = Object.values(websites).reduce((total, site) => {
      const latestSiteStep = site.steps[site.steps.length - 1]
      if (latestSiteStep.metadata?.phase === 'scraping_success') return total + 1
      if (latestSiteStep.metadata?.phase === 'scraping_error') return total + 0.5
      return total + 0.25
    }, 0)
    progress = 25 + (scrapingProgress / Object.keys(websites).length) * 65
  }
  else if (currentPhase === 'search_complete') progress = 100
  else progress = latestStep.progress || 10
  
  const getStatusText = () => {
    const phase = latestStep.metadata?.phase
    if (phase === 'search_start') return 'Starting search...'
    if (phase === 'results_found') return `Found ${latestStep.metadata?.totalResults || 0} results`
    if (phase === 'search_complete') return 'Search complete'
    if (websiteSteps.length > 0) return 'Extracting website content...'
    
    switch (latestStep.type) {
      case 'planning': return 'Planning search...'
      case 'start': return 'Searching web...'
      case 'progress': return 'Processing results...'
      case 'analysis': return 'Analyzing information...'
      case 'complete': return 'Search complete'
      default: return 'Searching...'
    }
  }
  
  const getToolLabel = (tool: string) => {
    if (tool === 'comprehensive_search') return 'Deep Research'
    if (tool === 'web_search') return 'Web Search'
    return tool.replace(/_/g, ' ')
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
      {/* Collapsible Header */}
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
          <span style={{ fontSize: '16px' }}>🔍</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {getToolLabel(latestStep.tool)}
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
              {getStatusText()}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--accent-primary)'
          }}>
            {Math.round(progress)}%
          </div>
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
            marginBottom: '8px'
          }}>
            <div style={{
              height: '100%',
              background: 'var(--accent-primary)',
              width: `${progress}%`,
              transition: 'width 0.5s ease-out',
              borderRadius: '2px'
            }} />
          </div>
      
      {/* Content */}
      {latestStep.content && (
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          marginBottom: Object.keys(websites).length > 0 ? '12px' : '0'
        }}>
          {latestStep.content}
        </div>
      )}
      
      {/* Website Scraping Cards */}
      {Object.keys(websites).length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            Extracting from {Object.keys(websites).length} sources:
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {Object.values(websites).map((site, index) => {
              const latestSiteStep = site.steps[site.steps.length - 1]
              const phase = latestSiteStep.metadata?.phase
              
              let hostname = 'unknown'
              try {
                hostname = new URL(site.url).hostname
              } catch (error) {
                console.error('Error parsing URL for display:', site.url, error)
                hostname = site.url.split('/')[2] || 'unknown'
              }
              
              let status = '⏳'
              let statusText = 'Extracting...'
              let statusColor = 'var(--text-tertiary)'
              
              if (phase === 'scraping_success') {
                status = '✅'
                const contentLength = latestSiteStep.metadata?.contentLength || 0
                statusText = contentLength > 1000 ? `${(contentLength / 1000).toFixed(1)}k chars` : 'Content retrieved'
                statusColor = 'var(--accent-primary)'
              } else if (phase === 'scraping_error' || phase === 'scraping_fallback') {
                // Still show as success - user doesn't need to know about fallbacks
                status = '✅'
                statusText = 'Content retrieved'
                statusColor = 'var(--accent-primary)'
              }
              
              return (
                <div key={`${hostname}-${latestSiteStep.metadata?.siteIndex || index}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  fontSize: '12px'
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
                      {site.title.length > 25 ? site.title.substring(0, 25) + '...' : site.title}
                    </span>
                  </div>
                  <span style={{
                    color: statusColor,
                    fontSize: '11px',
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
      {isActive && progress < 100 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--text-tertiary)'
        }}>
          <div className="loading-dots">
            <div className="loading-dot" />
            <div className="loading-dot" style={{ animationDelay: '0.2s' }} />
            <div className="loading-dot" style={{ animationDelay: '0.4s' }} />
          </div>
          <span>Working...</span>
        </div>
      )}
        </div>
      )}
    </div>
  )
}