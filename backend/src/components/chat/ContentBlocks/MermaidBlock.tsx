'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Download, Maximize2, Copy, Check } from 'lucide-react'

interface MermaidBlockProps {
  code: string
  title?: string
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, title }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const initializeMermaid = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Configure mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          themeVariables: {
            primaryColor: '#7c3aed',
            primaryTextColor: 'var(--text-primary)',
            primaryBorderColor: '#7c3aed',
            lineColor: 'var(--border)',
            secondaryColor: 'var(--surface-elevated)',
            tertiaryColor: 'var(--surface-hover)',
            background: 'var(--surface)',
            mainBkg: 'var(--surface)',
            secondBkg: 'var(--surface-elevated)',
            tertiaryBkg: 'var(--surface-hover)'
          },
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif'
        })

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Validate and render the diagram
        const isValid = await mermaid.parse(code)
        if (!isValid) {
          throw new Error('Invalid Mermaid syntax')
        }

        const { svg } = await mermaid.render(id, code)
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          // Apply custom styles to the SVG
          const svgElement = containerRef.current.querySelector('svg')
          if (svgElement) {
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      } finally {
        setIsLoading(false)
      }
    }

    initializeMermaid()
  }, [code])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const downloadSVG = () => {
    if (!containerRef.current) return

    const svgElement = containerRef.current.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `diagram-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPNG = async () => {
    if (!containerRef.current) return

    const svgElement = containerRef.current.querySelector('svg')
    if (!svgElement) return

    try {
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // Fill with white background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (!blob) return
          const pngUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = pngUrl
          a.download = `diagram-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(pngUrl)
        }, 'image/png')
        
        URL.revokeObjectURL(url)
      }

      img.src = url
    } catch (err) {
      console.error('Failed to download PNG:', err)
    }
  }

  if (error) {
    return (
      <div className="mermaid-error my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h4 className="text-red-800 font-medium mb-2">Diagram Rendering Error</h4>
        <p className="text-red-700 text-sm mb-3">{error}</p>
        <details className="text-sm">
          <summary className="cursor-pointer text-red-600 hover:text-red-800">
            View source code
          </summary>
          <pre className="mt-2 p-3 bg-red-100 rounded text-red-800 overflow-x-auto">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className={`mermaid-block my-6 bg-surface border border-border rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''
    }`}>
      {/* Diagram Controls */}
      <div className="diagram-controls px-4 py-3 bg-surface-elevated border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          {title || 'Mermaid Diagram'}
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title="Copy source code"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-text-tertiary hover:text-accent-primary" />
            )}
          </button>
          
          <div className="relative group">
            <button className="p-1.5 rounded hover:bg-surface-hover transition-colors">
              <Download size={14} className="text-text-tertiary hover:text-accent-primary" />
            </button>
            <div className="absolute right-0 top-8 bg-surface-elevated border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={downloadSVG}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover first:rounded-t-lg"
              >
                Download SVG
              </button>
              <button
                onClick={downloadPNG}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-hover last:rounded-b-lg"
              >
                Download PNG
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            <Maximize2 size={14} className="text-text-tertiary hover:text-accent-primary" />
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className={`diagram-canvas p-6 ${isFullscreen ? 'h-full overflow-auto' : ''} flex items-center justify-center`}>
        {isLoading ? (
          <div className="flex items-center space-x-2 text-text-tertiary">
            <div className="animate-spin w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full"></div>
            <span>Rendering diagram...</span>
          </div>
        ) : (
          <div ref={containerRef} className="mermaid-container w-full" />
        )}
      </div>
    </div>
  )
}