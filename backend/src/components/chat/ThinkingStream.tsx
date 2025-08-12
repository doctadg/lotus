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
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Thinking'
  },
  memory_access: {
    icon: '💾',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Memory'
  },
  context_analysis: {
    icon: '👁️',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Analysis'
  },
  search_planning: {
    icon: '🎯',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: 'Planning'
  },
  search_result_analysis: {
    icon: '🔍',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    label: 'Analyzing'
  },
  context_synthesis: {
    icon: '⚡',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Synthesis'
  },
  response_planning: {
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Planning'
  }
}

export function ThinkingStream({ steps, isActive }: ThinkingStreamProps) {
  const [visibleSteps, setVisibleSteps] = useState<ThinkingStep[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Add new steps with animation
    const newSteps = steps.slice(visibleSteps.length)
    newSteps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
      }, index * 150)
    })
  }, [steps])
  
  useEffect(() => {
    // Auto-scroll to bottom when new steps are added
    if (containerRef.current && isExpanded) {
      setTimeout(() => {
        containerRef.current!.scrollTop = containerRef.current!.scrollHeight
      }, 50)
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
    <div className="mb-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🧠</span>
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-white dark:border-slate-800" />
            )}
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              AI Reasoning Process
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isActive ? 'Thinking...' : `${visibleSteps.length} steps completed`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
            {visibleSteps.length}
          </div>
          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {/* Content */}
      {isExpanded && (
        <div 
          ref={containerRef}
          className="max-h-64 overflow-y-auto p-4 space-y-3"
        >
          {visibleSteps.map((step, index) => {
            const config = STEP_CONFIG[step.type] || STEP_CONFIG.thinking_stream
            const isLatest = index === visibleSteps.length - 1
            
            return (
              <div
                key={step.id}
                className={`flex gap-3 animate-fadeIn ${
                  isLatest && isActive ? 'bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg' : ''
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 pt-0.5">
                  <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <span className="text-sm">{config.icon}</span>
                  </div>
                  {index < visibleSteps.length - 1 && (
                    <div className="w-px h-full bg-gray-300 dark:bg-gray-600 ml-4 mt-1" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${config.color} uppercase tracking-wide`}>
                      {getPhaseLabel(step)}
                    </span>
                    {step.metadata?.duration && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {step.metadata.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {step.content}
                  </p>
                  
                  {/* Metadata badges */}
                  {step.metadata && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.metadata.toolCount && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          {step.metadata.toolCount} tools
                        </span>
                      )}
                      {step.metadata.relevantCount !== undefined && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          {step.metadata.relevantCount} memories
                        </span>
                      )}
                      {step.metadata.progress && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                          {step.metadata.progress}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Active indicator */}
                {isLatest && isActive && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}