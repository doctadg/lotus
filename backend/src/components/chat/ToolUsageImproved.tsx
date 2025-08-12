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

export function ToolUsageImproved({ tools }: ToolUsageProps) {
  if (tools.length === 0) return null
  
  const getToolConfig = (tool: string) => {
    const configs = {
      web_search: {
        icon: '🌐',
        label: 'Web Search',
        gradient: 'from-blue-500 to-cyan-500',
        description: 'Searching the web for current information'
      },
      comprehensive_search: {
        icon: '🧠',
        label: 'Deep Research',
        gradient: 'from-purple-500 to-indigo-600',
        description: 'Performing comprehensive analysis'
      },
      memory_access: {
        icon: '💾',
        label: 'Memory Access',
        gradient: 'from-emerald-500 to-teal-600',
        description: 'Accessing relevant memories'
      },
      analysis: {
        icon: '📊',
        label: 'Data Analysis',
        gradient: 'from-orange-500 to-red-600',
        description: 'Analyzing information'
      }
    }
    
    const baseConfig = configs[tool as keyof typeof configs]
    if (baseConfig) return baseConfig
    
    return {
      icon: '🔧',
      label: tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      gradient: 'from-slate-500 to-slate-600',
      description: 'Using specialized tool'
    }
  }
  
  const getStatusConfig = (status: ToolCall['status']) => {
    switch (status) {
      case 'executing':
        return {
          bgClass: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20',
          borderClass: 'border-blue-300/50 dark:border-blue-600/50',
          textClass: 'text-blue-700 dark:text-blue-300',
          icon: '⏳',
          indicator: (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )
        }
      case 'complete':
        return {
          bgClass: 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-400/20 dark:to-green-400/20',
          borderClass: 'border-emerald-300/50 dark:border-emerald-600/50',
          textClass: 'text-emerald-700 dark:text-emerald-300',
          icon: '✅',
          indicator: <span className="text-emerald-600 dark:text-emerald-400">✓</span>
        }
      case 'error':
        return {
          bgClass: 'bg-gradient-to-r from-red-500/10 to-pink-500/10 dark:from-red-400/20 dark:to-pink-400/20',
          borderClass: 'border-red-300/50 dark:border-red-600/50',
          textClass: 'text-red-700 dark:text-red-300',
          icon: '❌',
          indicator: <span className="text-red-600 dark:text-red-400">✗</span>
        }
    }
  }
  
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3">
        {tools.map((tool, index) => {
          const toolConfig = getToolConfig(tool.tool)
          const statusConfig = getStatusConfig(tool.status)
          
          return (
            <div
              key={index}
              className={`
                relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105
                ${statusConfig.bgClass} ${statusConfig.borderClass}
              `}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent" />
              </div>
              
              {/* Content */}
              <div className="relative px-4 py-3 flex items-center gap-3">
                {/* Tool Icon */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${toolConfig.gradient} flex items-center justify-center shadow-md`}>
                  <span className="text-white text-lg">{toolConfig.icon}</span>
                </div>
                
                {/* Tool Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-bold text-sm ${statusConfig.textClass}`}>
                      {toolConfig.label}
                    </h4>
                    <div className="flex items-center gap-1">
                      {statusConfig.indicator}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {toolConfig.description}
                  </p>
                  
                  {/* Query Preview */}
                  {tool.query && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate font-mono bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                      "{tool.query.substring(0, 40)}{tool.query.length > 40 ? '...' : ''}"
                    </p>
                  )}
                </div>
                
                {/* Metrics */}
                <div className="text-right">
                  {tool.status === 'complete' && tool.duration && (
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {(tool.duration / 1000).toFixed(1)}s
                    </div>
                  )}
                  {tool.resultSize && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                      {Math.round(tool.resultSize / 1000)}k chars
                    </div>
                  )}
                </div>
              </div>
              
              {/* Animated Border for Active Tools */}
              {tool.status === 'executing' && (
                <div className="absolute inset-0 rounded-xl">
                  <div className="absolute inset-0 rounded-xl border-2 border-blue-400/30 animate-pulse" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Summary */}
      {tools.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {tools.filter(t => t.status === 'complete').length} of {tools.length} tools completed
            {tools.some(t => t.status === 'executing') && (
              <span className="ml-2 inline-flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Processing...
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}