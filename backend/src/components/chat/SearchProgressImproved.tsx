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

export function SearchProgressImproved({ steps, isActive }: SearchProgressProps) {
  if (steps.length === 0) return null
  
  const latestStep = steps[steps.length - 1]
  const progress = latestStep.progress || (latestStep.type === 'complete' ? 100 : 
    latestStep.type === 'analysis' ? 80 :
    latestStep.type === 'progress' ? 60 :
    latestStep.type === 'start' ? 30 : 15)
  
  const getStatusText = () => {
    switch (latestStep.type) {
      case 'planning':
        return '🎯 Planning search strategy...'
      case 'start':
        return '🚀 Launching web search...'
      case 'progress':
        return '⚙️ Processing search results...'
      case 'analysis':
        return '🔬 Analyzing information quality...'
      case 'complete':
        return '✨ Search completed successfully!'
      default:
        return '🔍 Searching the web...'
    }
  }
  
  const getToolLabel = (tool: string) => {
    if (tool === 'comprehensive_search') return '🧠 Deep Research'
    if (tool === 'web_search') return '🌐 Web Search'
    return tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  const getQualityBadge = () => {
    if (!latestStep.quality) return null
    
    const qualityConfig = {
      comprehensive: { icon: '⭐', label: 'Comprehensive', gradient: 'from-emerald-500 to-green-500' },
      moderate: { icon: '📊', label: 'Detailed', gradient: 'from-blue-500 to-indigo-500' },
      basic: { icon: '📝', label: 'Focused', gradient: 'from-amber-500 to-orange-500' }
    }
    
    const config = qualityConfig[latestStep.quality as keyof typeof qualityConfig]
    if (!config) return null
    
    return (
      <div className={`px-3 py-1.5 bg-gradient-to-r ${config.gradient} text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    )
  }
  
  return (
    <div className="mb-6 bg-gradient-to-br from-cyan-50/80 via-blue-50/50 to-indigo-50/30 dark:from-cyan-950/70 dark:via-blue-950/50 dark:to-indigo-950/30 rounded-2xl border border-cyan-200/60 dark:border-cyan-800/40 shadow-lg shadow-cyan-100/20 dark:shadow-cyan-950/20 overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-6 py-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-cyan-200/40 dark:border-cyan-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🔍</span>
              </div>
              {isActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800 shadow-sm" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-cyan-700 to-blue-700 dark:from-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
                {getToolLabel(latestStep.tool)}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getQualityBadge()}
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                {progress}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Complete
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Section */}
      <div className="px-6 py-5 bg-gradient-to-b from-white/50 to-slate-50/30 dark:from-slate-900/50 dark:to-slate-950/30 backdrop-blur-sm">
        {/* Enhanced Progress Bar */}
        <div className="relative mb-4">
          <div className="h-3 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {isActive && progress < 100 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            <span>Searching</span>
            <span>Processing</span>
            <span>Analyzing</span>
            <span>Complete</span>
          </div>
        </div>
        
        {/* Search Details */}
        {latestStep.content && (
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {latestStep.content}
            </p>
          </div>
        )}
        
        {/* Metadata */}
        {latestStep.metadata && (
          <div className="mt-4 flex flex-wrap gap-3">
            {latestStep.metadata.sourcesUsed && (
              <div className="px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 text-sm rounded-lg font-bold shadow-sm border border-blue-200/50 dark:border-blue-700/50 flex items-center gap-2">
                <span>📚</span>
                <span>{latestStep.metadata.sourcesUsed} sources</span>
              </div>
            )}
            {latestStep.metadata.resultSize && (
              <div className="px-3 py-2 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-700 dark:text-purple-300 text-sm rounded-lg font-bold shadow-sm border border-purple-200/50 dark:border-purple-700/50 flex items-center gap-2">
                <span>📄</span>
                <span>{Math.round(latestStep.metadata.resultSize / 1000)}k chars</span>
              </div>
            )}
            {latestStep.metadata.duration && (
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg font-bold shadow-sm border border-emerald-200/50 dark:border-emerald-700/50 flex items-center gap-2">
                <span>⏱️</span>
                <span>{(latestStep.metadata.duration / 1000).toFixed(1)}s</span>
              </div>
            )}
          </div>
        )}
        
        {/* Loading State */}
        {isActive && progress < 100 && (
          <div className="mt-4 flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="font-medium">Searching and processing results...</span>
          </div>
        )}
      </div>
    </div>
  )
}