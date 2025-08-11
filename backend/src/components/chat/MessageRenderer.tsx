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
  const { processedContent, detectedBlocks } = useMessageFormatting(content)

  // Custom components for ReactMarkdown
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''

      if (!inline && match) {
        // Check if it's a special block type
        const content = String(children).replace(/\n$/, '')
        
        if (language === 'mermaid') {
          return <MermaidBlock code={content} />
        }
        
        if (language === 'chart' || language === 'json' && content.includes('"type"') && content.includes('"data"')) {
          return <ChartBlock data={content} />
        }

        return <CodeBlock code={content} language={language} />
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },

    table({ children }: any) {
      return <TableBlock>{children}</TableBlock>
    },

    a({ href, children }: any) {
      return <LinkPreview url={href}>{children}</LinkPreview>
    },

    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-accent-primary/30 pl-4 py-2 bg-accent-subtle/50 rounded-r-lg my-4 italic">
          {children}
        </blockquote>
      )
    },

    h1({ children }: any) {
      return <h1 className="text-2xl font-bold mb-4 text-text-primary border-b border-border pb-2">{children}</h1>
    },

    h2({ children }: any) {
      return <h2 className="text-xl font-semibold mb-3 text-text-primary">{children}</h2>
    },

    h3({ children }: any) {
      return <h3 className="text-lg font-medium mb-2 text-text-primary">{children}</h3>
    },

    p({ children }: any) {
      return <p className="mb-4 text-text-primary leading-relaxed">{children}</p>
    },

    ul({ children }: any) {
      return <ul className="list-disc list-inside mb-4 space-y-1 text-text-primary">{children}</ul>
    },

    ol({ children }: any) {
      return <ol className="list-decimal list-inside mb-4 space-y-1 text-text-primary">{children}</ol>
    },

    li({ children }: any) {
      return <li className="text-text-primary">{children}</li>
    },

    strong({ children }: any) {
      return <strong className="font-semibold text-text-primary">{children}</strong>
    },

    em({ children }: any) {
      return <em className="italic text-text-primary">{children}</em>
    },

    hr() {
      return <hr className="border-border my-6" />
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

      <div className="prose prose-sm max-w-none prose-gray dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>

      {isStreaming && (
        <div className="streaming-indicator">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  )
})

MessageRenderer.displayName = 'MessageRenderer'