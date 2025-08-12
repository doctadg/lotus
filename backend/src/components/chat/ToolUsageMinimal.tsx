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

export function ToolUsageMinimal({ tools }: ToolUsageProps) {
  if (tools.length === 0) return null
  
  const getToolLabel = (tool: string) => {
    if (tool === 'web_search') return 'Web Search'
    if (tool === 'comprehensive_search') return 'Deep Research'
    return tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  const getStatusIcon = (status: ToolCall['status']) => {
    switch (status) {
      case 'executing': return '⏳'
      case 'complete': return '✓'
      case 'error': return '✗'
    }
  }
  
  const getStatusColor = (status: ToolCall['status']) => {
    switch (status) {
      case 'executing': return 'var(--accent-primary)'
      case 'complete': return '#10B981'
      case 'error': return '#EF4444'
    }
  }
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {tools.map((tool, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ color: getStatusColor(tool.status) }}>
              {getStatusIcon(tool.status)}
            </span>
            <span>{getToolLabel(tool.tool)}</span>
            {tool.status === 'executing' && (
              <div style={{
                width: '8px',
                height: '8px',
                border: '1px solid currentColor',
                borderTop: '1px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {tool.status === 'complete' && tool.duration && (
              <span style={{
                color: 'var(--text-tertiary)',
                fontSize: '11px'
              }}>
                {(tool.duration / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}