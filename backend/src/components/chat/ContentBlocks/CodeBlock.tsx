'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { useTheme } from '../../../hooks/useTheme'
import { validateContent } from '../../../lib/content-validation'

interface CodeBlockProps {
  code: string
  language: string
  fileName?: string
  showLineNumbers?: boolean
  maxHeight?: number
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  fileName,
  showLineNumbers = true,
  maxHeight = 500
}) => {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  // Validate and sanitize code content
  const safeCode = validateContent(code)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(safeCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      css: 'css',
      html: 'html',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh'
    }
    return extensions[lang.toLowerCase()] || 'txt'
  }

  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      cpp: '#00599c',
      c: '#a8b9cc',
      css: '#1572b6',
      html: '#e34f26',
      json: '#000000',
      yaml: '#cb171e',
      sql: '#336791',
      bash: '#4eaa25',
      shell: '#4eaa25'
    }
    return colors[lang.toLowerCase()] || '#6b7280'
  }

  // Don't render if code is empty
  if (!safeCode.trim()) {
    return null
  }

  return (
    <div className="code-block group relative bg-black/30 border border-white/10 rounded-lg overflow-hidden my-3 backdrop-blur-sm">
      {/* Minimalist Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: getLanguageColor(language) }}
          />
          <span className="text-xs font-mono text-white/60">
            {fileName || language.toUpperCase()}
          </span>
        </div>
        
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <Check size={12} className="text-green-400" />
          ) : (
            <Copy size={12} className="text-white/50 hover:text-white/80" />
          )}
        </button>
      </div>

      {/* Clean Code Content */}
      <div className="relative overflow-auto" style={{ maxHeight }}>
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={theme === 'dark' ? oneDark : oneLight}
          showLineNumbers={showLineNumbers}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.5',
            fontFamily: 'JetBrains Mono, SF Mono, Monaco, Inconsolata, Roboto Mono, Menlo, Consolas, monospace',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'JetBrains Mono, SF Mono, Monaco, Inconsolata, Roboto Mono, Menlo, Consolas, monospace',
              fontFeatureSettings: '"liga" 1, "calt" 1',
              fontWeight: '400',
            }
          }}
          lineNumberStyle={{
            color: 'rgba(255, 255, 255, 0.25)',
            fontSize: '11px',
            paddingRight: '0.75rem',
            minWidth: '2rem',
            textAlign: 'right',
            userSelect: 'none',
          }}
        >
          {safeCode}
        </SyntaxHighlighter>
      </div>

      {/* Subtle fade for long content */}
      {safeCode.split('\n').length > 20 && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
      )}
    </div>
  )
}