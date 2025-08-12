'use client'

import React from 'react'

interface ToolCall {
  tool: string
  status: 'executing' | 'complete' | 'error'
  query?: string
  resultSize?: number
  duration?: number
}

interface ToolUsageProps {
  tools: ToolCall[]
}

export function ToolUsage({ tools }: ToolUsageProps) {
  if (tools.length === 0) return null
  
  const getToolIcon = (tool: string) => {
    if (tool.includes('search')) return '🔍'
    if (tool.includes('memory')) return '💾'
    if (tool.includes('analysis')) return '📊'
    return '🔧'
  }
  
  const getToolLabel = (tool: string) => {
    if (tool === 'web_search') return 'Web Search'
    if (tool === 'comprehensive_search') return 'Deep Research'
    return tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tools.map((tool, index) => (
        <div
          key={index}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            ${tool.status === 'executing' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
              : tool.status === 'complete'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
            }
          `}
        >
          <span>{getToolIcon(tool.tool)}</span>
          <span>{getToolLabel(tool.tool)}</span>
          
          {tool.status === 'executing' && (
            <div className="ml-1">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {tool.status === 'complete' && tool.duration && (
            <span className="ml-1 opacity-70">
              {(tool.duration / 1000).toFixed(1)}s
            </span>
          )}
          
          {tool.status === 'complete' && (
            <span>✓</span>
          )}
        </div>
      ))}
    </div>
  )
}