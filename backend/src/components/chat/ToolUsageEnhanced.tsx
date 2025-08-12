'use client'

import React from 'react'

interface ToolCall {
  tool: string
  status: 'executing' | 'complete' | 'error'
  query?: string
  resultSize?: number
  duration?: number
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

interface ToolUsageProps {
  tools: ToolCall[]
  searchSteps?: SearchStep[]
  isActive?: boolean
}

const TOOL_CONFIG = {
  web_search: {
    label: 'Web Search',
    color: '#06b6d4'
  },
  comprehensive_search: {
    label: 'Deep Research', 
    color: '#8b5cf6'
  },
  memory_search: {
    label: 'Memory Search',
    color: '#a855f7'
  },
  analysis: {
    label: 'Analysis',
    color: '#10b981'
  },
  synthesis: {
    label: 'Synthesis',
    color: '#f59e0b'
  },
  searchhive: {
    label: 'SearchHive',
    color: '#06b6d4'
  },
  website_scraping: {
    label: 'Website Analysis',
    color: '#8b5cf6'
  },
  search_planning: {
    label: 'Search Planning',
    color: '#f59e0b'
  }
}

export function ToolUsageEnhanced({ tools, searchSteps = [], isActive = false }: ToolUsageProps) {
  if (tools.length === 0 && searchSteps.length === 0) return null
  
  // Convert search steps to a unified format for display
  const searchAsTools = searchSteps.map((step, index) => {
    let status: 'executing' | 'complete' | 'error' = 'complete'
    
    if (step.type === 'planning' || step.type === 'start' || step.type === 'progress') {
      status = index === searchSteps.length - 1 && isActive ? 'executing' : 'complete'
    } else if (step.type === 'complete') {
      status = 'complete'
    }
    
    return {
      tool: step.tool,
      status,
      query: step.content.length > 50 ? step.content.substring(0, 50) + '...' : step.content,
      resultSize: step.metadata?.resultCount,
      duration: step.metadata?.duration,
      url: step.url,
      searchStep: step // Keep reference to original step
    }
  })
  
  // Combine regular tools and search tools
  const allTools = [...tools, ...searchAsTools]
  
  if (allTools.length === 0) return null
  
  const getToolConfig = (toolName: string) => {
    // Check for exact matches first
    if (TOOL_CONFIG[toolName as keyof typeof TOOL_CONFIG]) {
      return TOOL_CONFIG[toolName as keyof typeof TOOL_CONFIG]
    }
    
    // Check for partial matches
    if (toolName.includes('search')) {
      return toolName.includes('comprehensive') || toolName.includes('deep') 
        ? TOOL_CONFIG.comprehensive_search 
        : TOOL_CONFIG.web_search
    }
    if (toolName.includes('memory')) return TOOL_CONFIG.memory_search
    if (toolName.includes('analysis')) return TOOL_CONFIG.analysis
    if (toolName.includes('synthesis')) return TOOL_CONFIG.synthesis
    
    // Default
    return {
      label: toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: '#667eea'
    }
  }
  
  const getStatusConfig = (status: ToolCall['status']) => {
    switch (status) {
      case 'executing':
        return {
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)'
        }
      case 'complete':
        return {
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)'
        }
      case 'error':
        return {
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }
    }
  }
  
  // Convert hex to RGB for CSS custom properties
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '102, 126, 234'
  }
  
  return (
    <>
      <style jsx>{`
        .tool-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .tool-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }
        
        .tool-card.executing {
          border-color: rgba(var(--tool-color-rgb), 0.4);
          background: rgba(var(--tool-color-rgb), 0.05);
        }
        
        .tool-card.executing::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--tool-color), transparent);
          animation: shimmer 2s infinite;
        }
        
        .tool-card.complete {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.03);
        }
        
        .tool-card.complete::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #10b981;
        }
        
        .tool-card.error {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.03);
        }
        
        .spinner {
          width: 8px;
          height: 8px;
          border: 1px solid currentColor;
          border-top: 1px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(var(--tool-color-rgb), 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 25px rgba(var(--tool-color-rgb), 0.6);
            transform: scale(1.05);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .tool-enter {
          animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      
      <div className="flex flex-wrap gap-2 mb-4" style={{ width: '30%', maxWidth: '400px' }}>
        {allTools.map((tool, index) => {
          const toolConfig = getToolConfig(tool.tool)
          const statusConfig = getStatusConfig(tool.status)
          const isSearchTool = 'searchStep' in tool
          
          return (
            <div
              key={index}
              className={`tool-card tool-enter ${tool.status}`}
              style={{
                animationDelay: `${index * 0.1}s`,
                '--tool-color': toolConfig.color,
                '--tool-color-rgb': hexToRgb(toolConfig.color)
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-2 px-2 py-2">
                {/* Tool Dot Indicator */}
                <div 
                  className={`w-2 h-2 rounded-full ${tool.status}`}
                  style={{
                    background: toolConfig.color,
                    boxShadow: tool.status === 'executing' ? `0 0 8px ${toolConfig.color}60` : 'none'
                  }}
                />
                
                {/* Tool Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/90 truncate">
                      {toolConfig.label}
                      {isSearchTool && tool.url && (
                        <span className="text-white/50 ml-1">
                          • {(() => {
                            try {
                              return new URL(tool.url).hostname
                            } catch {
                              return tool.url.substring(0, 20)
                            }
                          })()}
                        </span>
                      )}
                    </span>
                    
                    {/* Status Indicator */}
                    {tool.status === 'executing' && (
                      <div className="spinner" />
                    )}
                    {tool.status === 'complete' && (
                      <div className="w-3 h-3 rounded-full" style={{ background: statusConfig.color }}>
                        <div className="text-xs text-white text-center leading-3">✓</div>
                      </div>
                    )}
                    {tool.status === 'error' && (
                      <div className="w-3 h-3 rounded-full" style={{ background: statusConfig.color }}>
                        <div className="text-xs text-white text-center leading-3">✗</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search query/content for search tools */}
                  {isSearchTool && tool.query && (
                    <div className="text-xs text-white/50 mt-0.5 truncate">
                      {tool.query}
                    </div>
                  )}
                </div>
                
                {/* Duration/Results */}
                <div className="flex items-center text-xs text-white/40">
                  {tool.duration && tool.status === 'complete' && (
                    <span>{(tool.duration / 1000).toFixed(1)}s</span>
                  )}
                  {tool.resultSize && (
                    <span className="ml-1">({tool.resultSize})</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}