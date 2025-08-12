'use client'

import React from 'react'

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

export function SearchProgress({ steps, isActive }: SearchProgressProps) {
  if (steps.length === 0) return null
  
  const latestStep = steps[steps.length - 1]
  const progress = latestStep.progress || (latestStep.type === 'complete' ? 100 : 50)
  
  const getStatusText = () => {
    switch (latestStep.type) {
      case 'planning':
        return '📋 Planning search strategy...'
      case 'start':
        return '🔍 Searching the web...'
      case 'progress':
        return '⚙️ Processing results...'
      case 'analysis':
        return '📊 Analyzing information...'
      case 'complete':
        return '✅ Search complete!'
      default:
        return '🔍 Searching...'
    }
  }
  
  const getToolLabel = (tool: string) => {
    if (tool === 'comprehensive_search') return 'Deep Research'
    if (tool === 'web_search') return 'Web Search'
    return tool
  }
  
  return (
    <div className="mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🔍</span>
            </div>
            {isActive && (
              <div className="absolute -top-0 -right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-gray-800" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
              {getToolLabel(latestStep.tool)}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getStatusText()}
            </p>
          </div>
        </div>
        
        {latestStep.quality && (
          <span className="px-2 py-1 bg-white dark:bg-gray-800 text-xs rounded-full font-medium">
            {latestStep.quality === 'comprehensive' ? '⭐ Comprehensive' : 
             latestStep.quality === 'moderate' ? '📊 Moderate' : '📝 Basic'}
          </span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {isActive && progress < 100 && (
          <div className="absolute left-0 top-0 h-full w-full">
            <div className="h-full bg-white/30 animate-shimmer" />
          </div>
        )}
      </div>
      
      {/* Search details */}
      {latestStep.content && (
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          {latestStep.content}
        </p>
      )}
      
      {/* Metadata */}
      {latestStep.metadata && (
        <div className="mt-2 flex flex-wrap gap-2">
          {latestStep.metadata.sourcesUsed && (
            <span className="text-xs px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded">
              📚 {latestStep.metadata.sourcesUsed} sources
            </span>
          )}
          {latestStep.metadata.resultSize && (
            <span className="text-xs px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded">
              📄 {latestStep.metadata.resultSize} chars
            </span>
          )}
        </div>
      )}
    </div>
  )
}