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

interface ThinkingStreamProps {
  steps: ThinkingStep[]
  isActive: boolean
}

const STEP_CONFIG = {
  thinking_stream: {
    icon: '🧠',
    gradient: 'from-blue-500 to-indigo-600',
    textGradient: 'from-blue-600 to-indigo-600',
    label: 'Thinking'
  },
  memory_access: {
    icon: '💾',
    gradient: 'from-purple-500 to-violet-600',
    textGradient: 'from-purple-600 to-violet-600',
    label: 'Memory'
  },
  context_analysis: {
    icon: '👁️',
    gradient: 'from-emerald-500 to-green-600',
    textGradient: 'from-emerald-600 to-green-600',
    label: 'Analysis'
  },
  search_planning: {
    icon: '🎯',
    gradient: 'from-amber-500 to-orange-600',
    textGradient: 'from-amber-600 to-orange-600',
    label: 'Planning'
  },
  search_result_analysis: {
    icon: '🔍',
    gradient: 'from-cyan-500 to-blue-600',
    textGradient: 'from-cyan-600 to-blue-600',
    label: 'Analyzing'
  },
  context_synthesis: {
    icon: '⚡',
    gradient: 'from-violet-500 to-purple-600',
    textGradient: 'from-violet-600 to-purple-600',
    label: 'Synthesis'
  },
  response_planning: {
    icon: '✨',
    gradient: 'from-emerald-500 to-teal-600',
    textGradient: 'from-emerald-600 to-teal-600',
    label: 'Planning'
  }
}

export function ThinkingStreamImproved({ steps, isActive }: ThinkingStreamProps) {
  const [visibleSteps, setVisibleSteps] = useState<ThinkingStep[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const newSteps = steps.slice(visibleSteps.length)
    newSteps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
      }, index * 200)
    })
  }, [steps])
  
  useEffect(() => {
    if (containerRef.current && isExpanded) {
      setTimeout(() => {
        containerRef.current!.scrollTop = containerRef.current!.scrollHeight
      }, 100)
    }
  }, [visibleSteps, isExpanded])
  
  if (visibleSteps.length === 0) return null
  
  const getPhaseLabel = (step: ThinkingStep) => {
    if (step.metadata?.phase) {
      return step.metadata.phase.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
    return STEP_CONFIG[step.type]?.label || 'Processing'
  }
  
  return (
    <div className="mb-6 bg-gradient-to-br from-slate-50/80 via-blue-50/50 to-indigo-50/30 dark:from-slate-900/90 dark:via-blue-950/70 dark:to-indigo-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/20 dark:shadow-blue-950/20 overflow-hidden backdrop-blur-md">
      {/* Elegant Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between hover:bg-white/95 dark:hover:bg-slate-800/95 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🧠</span>
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800 shadow-sm" />
            )}
          </div>
          <div className="text-left">
            <div className="font-bold text-base bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-100 bg-clip-text text-transparent">
              AI Reasoning Process
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {isActive ? (
                <span className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Deep thinking in progress
                </span>
              ) : (
                `${visibleSteps.length} reasoning steps completed`
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-xl shadow-sm">
            {visibleSteps.length}
          </div>
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {/* Beautiful Content */}
      {isExpanded && (
        <div 
          ref={containerRef}
          className="max-h-96 overflow-y-auto px-6 py-5 space-y-5 bg-gradient-to-b from-white/50 to-slate-50/30 dark:from-slate-900/50 dark:to-slate-950/30 backdrop-blur-sm"
        >
          {visibleSteps.map((step, index) => {
            const config = STEP_CONFIG[step.type] || STEP_CONFIG.thinking_stream
            const isLatest = index === visibleSteps.length - 1
            
            return (
              <div
                key={step.id}
                className={`relative pl-12 animate-fadeIn transition-all duration-500 ${
                  isLatest && isActive 
                    ? 'bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/30 shadow-sm' 
                    : 'hover:bg-white/60 dark:hover:bg-slate-800/40 p-3 rounded-xl transition-all duration-300'
                }`}
              >
                {/* Enhanced Timeline */}
                {index < visibleSteps.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-full bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-600 dark:via-slate-700 dark:to-transparent" />
                )}
                
                {/* Beautiful Icon */}
                <div className="absolute left-0 top-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-800 transform transition-all duration-300 ${isLatest && isActive ? 'scale-110 shadow-xl' : 'hover:scale-105'}`}>
                    <span className="text-white text-sm">{config.icon}</span>
                  </div>
                  {isLatest && isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800" />
                  )}
                </div>
                
                {/* Rich Content */}
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-sm font-bold bg-gradient-to-r ${config.textGradient} bg-clip-text text-transparent uppercase tracking-wider`}>
                      {getPhaseLabel(step)}
                    </span>
                    {step.metadata?.duration && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1 rounded-full font-medium shadow-sm">
                        ⏱️ {step.metadata.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                    {step.content}
                  </p>
                  
                  {/* Enhanced Metadata */}
                  {step.metadata && (Object.keys(step.metadata).some(key => 
                    ['toolCount', 'relevantCount', 'progress'].includes(key)
                  )) && (
                    <div className="flex flex-wrap gap-2">
                      {step.metadata.toolCount && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-bold shadow-sm border border-blue-200/50 dark:border-blue-700/50">
                          🔧 {step.metadata.toolCount} tools
                        </span>
                      )}
                      {step.metadata.relevantCount !== undefined && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-700 dark:text-purple-300 text-xs rounded-lg font-bold shadow-sm border border-purple-200/50 dark:border-purple-700/50">
                          💾 {step.metadata.relevantCount} memories
                        </span>
                      )}
                      {step.metadata.progress && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg font-bold shadow-sm border border-emerald-200/50 dark:border-emerald-700/50">
                          📊 {step.metadata.progress}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {/* Elegant Loading State */}
          {isActive && (
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm pl-12 py-4">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">Continuing analysis...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}