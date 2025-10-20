/**
 * Content validation and sanitization utilities
 * Prevents "object object object" issues by ensuring safe string conversion
 */

export function safeStringConversion(content: any): string {
  if (typeof content === 'string') {
    return content
  }
  
  if (content === null || content === undefined) {
    return ''
  }
  
  if (typeof content === 'object') {
    // Handle React children or nested objects
    if (Array.isArray(content)) {
      return content.map(safeStringConversion).join('')
    }
    
    // Check if it's a React element with props
    if (content && typeof content === 'object' && 'props' in content) {
      return safeStringConversion(content.props?.children || '')
    }
    
    // Try to extract meaningful content from object
    if ('toString' in content && typeof content.toString === 'function') {
      const str = content.toString()
      if (str !== '[object Object]') {
        return str
      }
    }
    
    // Last resort: try to stringify if it looks like data
    try {
      const json = JSON.stringify(content)
      if (json && json !== '{}' && json !== '[]') {
        return json
      }
    } catch {
      // Ignore JSON stringify errors
    }
    
    return ''
  }
  
  // Handle numbers, booleans, etc.
  return String(content)
}

export function validateContent(content: any): string {
  const safeContent = safeStringConversion(content)
  
  // Remove any remaining object references
  return safeContent.replace(/\[object Object\]/g, '').trim()
}

export function sanitizeCodeContent(content: any): string {
  let safeContent = validateContent(content)
  
  // Remove common artifacts that can appear during streaming
  safeContent = safeContent
    .replace(/\[object Object\]/g, '')
    .replace(/\[undefined\]/g, '')
    .replace(/\[null\]/g, '')
    .replace(/undefined|null/g, '')
    .trim()
  
  return safeContent
}

export function isValidMarkdown(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /```[\s\S]*?```/, // Code blocks
    /`[^`]+`/, // Inline code
    /^#{1,6}\s+/m, // Headers
    /^\*{1,2}[^*]+\*{1,2}$/m, // Bold/italic
    /^\[.*?\]\(.*?\)$/m, // Links
    /^\|.*\|$/m, // Tables
  ]
  
  return markdownPatterns.some(pattern => pattern.test(content)) || content.length > 10
}

export function extractCodeBlockContent(content: string): string {
  // Extract content from code blocks, removing language markers
  const codeBlockMatch = content.match(/^```(\w+)?\n?([\s\S]*?)```$/)
  if (codeBlockMatch) {
    return codeBlockMatch[2].trim()
  }
  return content
}

export function repairPartialMarkdown(content: string): string {
  // Fix incomplete code blocks
  const codeBlockMatches = content.match(/```(\w+)?\n?([\s\S]*?)$/)
  if (codeBlockMatches && !content.endsWith('```')) {
    const language = codeBlockMatches[1] || ''
    const code = codeBlockMatches[2]
    if (code.trim()) {
      content = content.replace(/```(\w+)?\n?([\s\S]*?)$/, `\`\`\`${language}\n${code}\n\`\`\``)
    }
  }

  return content
}

export function validateMarkdownIntegrity(content: string): boolean {
  // Check for balanced code blocks
  const codeBlockCount = (content.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    return false
  }

  // Check for balanced inline code
  const inlineCodeCount = (content.match(/`[^`]/g) || []).length
  if (inlineCodeCount % 2 !== 0) {
    return false
  }

  return true
}