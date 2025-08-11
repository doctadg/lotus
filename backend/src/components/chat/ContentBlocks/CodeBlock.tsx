'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Play, Download } from 'lucide-react'
import { useTheme } from '../../../hooks/useTheme'

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
  maxHeight = 400
}) => {
  const [copied, setCopied] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const { theme } = useTheme()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `code.${getFileExtension(language)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const executeCode = async () => {
    if (!isExecutable(language)) return
    
    setIsExecuting(true)
    // Placeholder for code execution - would integrate with a code runner API
    setTimeout(() => {
      setIsExecuting(false)
    }, 2000)
  }

  const isExecutable = (lang: string) => {
    return ['javascript', 'python', 'typescript', 'js', 'ts', 'py'].includes(lang.toLowerCase())
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

  return (
    <div className="code-block group relative bg-surface border border-border rounded-lg overflow-hidden my-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-mono text-text-secondary">
            {fileName || language}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isExecutable(language) && (
            <button
              onClick={executeCode}
              disabled={isExecuting}
              className="p-1.5 rounded hover:bg-surface-hover transition-colors"
              title="Run code"
            >
              <Play 
                size={14} 
                className={`text-text-tertiary hover:text-accent-primary ${isExecuting ? 'animate-spin' : ''}`}
              />
            </button>
          )}
          
          <button
            onClick={downloadCode}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title="Download code"
          >
            <Download size={14} className="text-text-tertiary hover:text-accent-primary" />
          </button>
          
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-text-tertiary hover:text-accent-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative" style={{ maxHeight }}>
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
            lineHeight: '1.5'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Fade overlay if content is scrollable */}
      {code.split('\n').length > 20 && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent pointer-events-none"></div>
      )}
    </div>
  )
}

function getLanguageColor(language: string): string {
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
  return colors[language.toLowerCase()] || '#6b7280'
}