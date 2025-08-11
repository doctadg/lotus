'use client'

import React, { useState, useEffect, useRef } from 'react'
import katex from 'katex'
import { Copy, Check, Maximize2 } from 'lucide-react'
import 'katex/dist/katex.min.css'

interface MathBlockProps {
  content: string
  inline?: boolean
  title?: string
}

export const MathBlock: React.FC<MathBlockProps> = ({ 
  content, 
  inline = false, 
  title 
}) => {
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mathRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mathRef.current) return

    try {
      setError(null)
      const html = katex.renderToString(content, {
        displayMode: !inline,
        throwOnError: false,
        trust: true,
        strict: false,
        macros: {
          '\\RR': '\\mathbb{R}',
          '\\NN': '\\mathbb{N}',
          '\\ZZ': '\\mathbb{Z}',
          '\\QQ': '\\mathbb{Q}',
          '\\CC': '\\mathbb{C}',
        }
      })
      
      mathRef.current.innerHTML = html
    } catch (err) {
      console.error('KaTeX rendering error:', err)
      setError(err instanceof Error ? err.message : 'Failed to render math')
    }
  }, [content, inline])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy math:', err)
    }
  }

  if (error) {
    return (
      <div className="math-error p-3 bg-red-50 border border-red-200 rounded-lg my-2">
        <p className="text-red-700 text-sm mb-2">{error}</p>
        <pre className="text-red-600 text-xs overflow-x-auto">
          <code>{content}</code>
        </pre>
      </div>
    )
  }

  if (inline) {
    return (
      <span 
        ref={mathRef}
        className="inline-math mx-1"
        title={content}
      />
    )
  }

  return (
    <div className={`math-block my-6 bg-surface border border-border rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''
    }`}>
      {/* Math Controls */}
      <div className="math-controls px-4 py-3 bg-surface-elevated border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          {title || 'Mathematical Expression'}
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title="Copy LaTeX source"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-text-tertiary hover:text-accent-primary" />
            )}
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            <Maximize2 size={14} className="text-text-tertiary hover:text-accent-primary" />
          </button>
        </div>
      </div>

      {/* Math Content */}
      <div className={`math-content p-6 text-center ${isFullscreen ? 'h-full flex items-center justify-center' : ''}`}>
        <div 
          ref={mathRef}
          className="math-expression text-text-primary"
          style={{ 
            fontSize: isFullscreen ? '1.5em' : '1.2em',
            lineHeight: '1.8'
          }}
        />
      </div>

      {/* Source Code (collapsible) */}
      <details className="source-details border-t border-border">
        <summary className="px-4 py-2 bg-surface-elevated cursor-pointer hover:bg-surface-hover transition-colors text-sm font-medium text-text-secondary">
          Show LaTeX Source
        </summary>
        <div className="p-4 bg-surface-elevated">
          <pre className="text-sm text-text-primary overflow-x-auto">
            <code>{content}</code>
          </pre>
        </div>
      </details>
    </div>
  )
}