import { useMemo } from 'react'

interface DetectedBlocks {
  code: Array<{ language: string; content: string }>
  math: string[]
  charts: string[]
  mermaid: string[]
  tables: string[]
}

export function useMessageFormatting(content: string) {
  return useMemo(() => {
    const detectedBlocks: DetectedBlocks = {
      code: [],
      math: [],
      charts: [],
      mermaid: [],
      tables: []
    }

    let processedContent = content

    // Extract and process different content types
    
    // Extract math blocks (LaTeX)
    const mathRegex = /\$\$([^$]+)\$\$/g
    const mathMatches = content.match(mathRegex)
    if (mathMatches) {
      mathMatches.forEach(match => {
        const mathContent = match.replace(/\$\$/g, '')
        detectedBlocks.math.push(mathContent)
      })
    }

    // Extract code blocks for special processing
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    let match
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text'
      const code = match[2].trim()
      
      detectedBlocks.code.push({ language, content: code })

      // Detect specific types
      if (language === 'mermaid') {
        detectedBlocks.mermaid.push(code)
      } else if (language === 'json' && isChartData(code)) {
        detectedBlocks.charts.push(code)
      }
    }

    // Extract table patterns
    const tableRegex = /\|(.+)\|/g
    const tableMatches = content.match(tableRegex)
    if (tableMatches && tableMatches.length > 1) {
      // Simple table detection - if we have multiple lines with pipes
      detectedBlocks.tables.push(tableMatches.join('\n'))
    }

    // Process content for better readability
    processedContent = enhanceReadability(processedContent)

    return {
      processedContent,
      detectedBlocks
    }
  }, [content])
}

function isChartData(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === 'object' && 
           (parsed.type || (parsed.data && parsed.data.datasets))
  } catch {
    return false
  }
}

function enhanceReadability(content: string): string {
  return content
    // Add proper spacing around headers
    .replace(/^(#{1,6}\s+.+)$/gm, '\n$1\n')
    // Ensure proper spacing around lists
    .replace(/^(\s*[-*+]\s+.+)$/gm, '$1')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim start and end
    .trim()
}