'use client'

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { CodeBlock } from './ContentBlocks/CodeBlock'
import { TableBlock } from './ContentBlocks/TableBlock'
import { ChartBlock } from './ContentBlocks/ChartBlock'
import { MermaidBlock } from './ContentBlocks/MermaidBlock'
import { MathBlock } from './ContentBlocks/MathBlock'
import { LinkPreview } from './ContentBlocks/LinkPreview'
import { useMessageFormatting } from '../../hooks/useMessageFormatting'
import { validateContent, sanitizeCodeContent } from '../../lib/content-validation'
import 'katex/dist/katex.min.css'

interface MessageRendererProps {
  content: string
  role: 'user' | 'assistant'
  messageId: string
  isStreaming?: boolean
}

export const MessageRenderer: React.FC<MessageRendererProps> = memo(({
  content,
  role,
  messageId,
  isStreaming = false
}) => {
  // Validate content before processing
  const safeContent = validateContent(content)
  const { processedContent, detectedBlocks } = useMessageFormatting(safeContent)

  // Enhanced custom components for ReactMarkdown with professional styling
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''

      if (!inline && match) {
        // Safe content extraction and sanitization
        const content = sanitizeCodeContent(children).replace(/\n$/, '')
        
        // Skip empty or invalid content
        if (!content || content.trim() === '') {
          return null
        }
        
        if (language === 'mermaid') {
          return <MermaidBlock code={content} />
        }
        
        if (language === 'chart' || language === 'json' && content.includes('"type"') && content.includes('"data"')) {
          return <ChartBlock data={content} />
        }

        return <CodeBlock code={content} language={language} />
      }

      // Enhanced inline code styling with safe content
      const safeInlineContent = validateContent(children)
      return (
        <code 
          className="px-1 md:px-1.5 py-0.5 bg-white/10 text-white/95 rounded text-xs md:text-sm font-mono font-medium border border-white/5" 
          {...props}
        >
          {safeInlineContent}
        </code>
      )
    },

    table({ children }: any) {
      return <TableBlock>{children}</TableBlock>
    },


    blockquote({ children }: any) {
      return (
        <div className="my-3 md:my-4 pl-3 md:pl-4 py-2 md:py-3 border-l-3 md:border-l-4 border-blue-500/50 bg-white/[0.02] rounded-r-lg">
          <div className="text-white/80 italic leading-relaxed text-sm md:text-base">
            {children}
          </div>
        </div>
      )
    },

    h1({ children }: any) {
      return (
        <h1 className="text-xl md:text-2xl font-semibold text-white/95 mb-4 md:mb-6 mt-6 md:mt-8 first:mt-0 leading-tight tracking-tight">
          {children}
        </h1>
      )
    },

    h2({ children }: any) {
      return (
        <h2 className="text-lg md:text-xl font-semibold text-white/95 mb-3 md:mb-4 mt-6 md:mt-8 first:mt-0 leading-snug tracking-tight">
          {children}
        </h2>
      )
    },

    h3({ children }: any) {
      return (
        <h3 className="text-base md:text-lg font-semibold text-white/92 mb-2 md:mb-3 mt-4 md:mt-6 first:mt-0 leading-snug tracking-tight">
          {children}
        </h3>
      )
    },

    h4({ children }: any) {
      return (
        <h4 className="text-sm md:text-base font-semibold text-white/90 mb-2 mt-4 md:mt-5 first:mt-0 leading-normal">
          {children}
        </h4>
      )
    },

    h5({ children }: any) {
      return (
        <h5 className="text-xs md:text-sm font-semibold text-white/90 mb-2 mt-3 md:mt-4 first:mt-0 leading-normal uppercase tracking-wide">
          {children}
        </h5>
      )
    },

    h6({ children }: any) {
      return (
        <h6 className="text-xs md:text-sm font-medium text-white/85 mb-2 mt-3 md:mt-4 first:mt-0 leading-normal uppercase tracking-wider">
          {children}
        </h6>
      )
    },

    p({ children }: any) {
      return (
        <p className="mb-3 md:mb-4 text-white/90 leading-relaxed text-sm md:text-base [line-height:1.65] last:mb-0">
          {children}
        </p>
      )
    },

    ul({ children }: any) {
      return (
        <ul className="mb-3 md:mb-4 pl-5 md:pl-6 space-y-1.5 md:space-y-2 text-white/90 text-sm md:text-base [&>li]:relative [&>li]:pl-2 [&>li::before]:content-['•'] [&>li::before]:absolute [&>li::before]:left-[-0.75rem] [&>li::before]:text-white/60 [&>li::before]:font-bold">
          {children}
        </ul>
      )
    },

    ol({ children }: any) {
      return (
        <ol className="mb-3 md:mb-4 pl-5 md:pl-6 space-y-1.5 md:space-y-2 text-white/90 text-sm md:text-base list-decimal [&>li]:pl-2">
          {children}
        </ol>
      )
    },

    li({ children }: any) {
      return (
        <li className="text-white/90 leading-relaxed text-sm md:text-base">
          {children}
        </li>
      )
    },

    strong({ children }: any) {
      return (
        <strong className="font-semibold text-white/95">
          {children}
        </strong>
      )
    },

    em({ children }: any) {
      return (
        <em className="italic text-white/92 font-medium">
          {children}
        </em>
      )
    },

    hr() {
      return (
        <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )
    },

    // Enhanced link styling
    a({ href, children }: any) {
      return (
        <a 
          href={href}
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/60 hover:decoration-blue-300 transition-colors duration-200 font-medium"
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    },

    // Image component to handle data URLs and blob URLs
    img({ src, alt, ...props }: any) {
      // Handle data URLs and blob URLs properly
      if (!src) return null
      
      return (
        <img 
          src={src}
          alt={alt || 'Generated image'}
          className="max-w-full h-auto rounded-lg my-4 shadow-lg"
          loading="lazy"
          {...props}
        />
      )
    }
  }

  return (
    <div className={`message-content ${role} ${isStreaming ? 'streaming' : ''}`}>
      {detectedBlocks.math.length > 0 && (
        <div className="math-blocks mb-4">
          {detectedBlocks.math.map((mathContent, index) => (
            <MathBlock key={`math-${messageId}-${index}`} content={mathContent} />
          ))}
        </div>
      )}

      <div className="prose prose-lg prose-enhanced max-w-none text-secondary [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>

      {isStreaming && (
        <div className="streaming-indicator mt-2">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  )
})

MessageRenderer.displayName = 'MessageRenderer'