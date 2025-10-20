/**
 * Smart content chunking that respects markdown boundaries
 * Prevents code blocks and other markdown structures from being split incorrectly
 */

export interface ChunkOptions {
  maxChunkSize?: number
  minChunkSize?: number
}

export function* smartChunkIterator(
  content: string, 
  options: ChunkOptions = {}
): Generator<string, void, unknown> {
  const { maxChunkSize = 150, minChunkSize = 50 } = options
  
  if (!content || content.length <= maxChunkSize) {
    yield content
    return
  }

  let position = 0
  const contentLength = content.length

  while (position < contentLength) {
    // If we're at the end, just yield what's left
    if (contentLength - position <= minChunkSize) {
      yield content.substring(position)
      break
    }

    // Look for safe break points within the chunk size range
    const chunkEnd = findSafeBreakPoint(content, position, maxChunkSize, minChunkSize)
    
    if (chunkEnd === -1) {
      // No safe break found, force split at max chunk size
      const forcedEnd = Math.min(position + maxChunkSize, contentLength)
      yield content.substring(position, forcedEnd)
      position = forcedEnd
    } else {
      yield content.substring(position, chunkEnd)
      position = chunkEnd
    }
  }
}

function findSafeBreakPoint(
  content: string, 
  startPos: number, 
  maxChunkSize: number, 
  minChunkSize: number
): number {
  const maxPos = Math.min(startPos + maxChunkSize, content.length)
  const minPos = startPos + minChunkSize

  // Priority 1: End of code blocks
  const codeBlockEnd = content.indexOf('\n```', startPos)
  if (codeBlockEnd !== -1 && codeBlockEnd + 3 <= maxPos && codeBlockEnd + 3 >= minPos) {
    return codeBlockEnd + 3
  }

  // Priority 2: End of lines (sentence boundaries)
  const sentenceEnd = content.indexOf('.\n', startPos)
  if (sentenceEnd !== -1 && sentenceEnd + 2 <= maxPos && sentenceEnd + 2 >= minPos) {
    return sentenceEnd + 2
  }

  // Priority 3: Newlines
  const newlinePos = content.lastIndexOf('\n', maxPos)
  if (newlinePos !== -1 && newlinePos > startPos && newlinePos >= minPos) {
    return newlinePos + 1
  }

  // Priority 4: Spaces (word boundaries)
  const spacePos = content.lastIndexOf(' ', maxPos)
  if (spacePos !== -1 && spacePos > startPos && spacePos >= minPos) {
    return spacePos + 1
  }

  // Priority 5: Check if we're inside a code block and avoid splitting it
  const beforeStart = content.substring(0, startPos)
  const inCodeBlock = (beforeStart.match(/```/g) || []).length % 2 === 1
  
  if (inCodeBlock) {
    // We're inside a code block, try to find the end
    const codeBlockEnd = content.indexOf('\n```', startPos)
    if (codeBlockEnd !== -1) {
      return Math.min(codeBlockEnd + 3, startPos + maxChunkSize * 2) // Allow larger chunks for code
    }
  }

  return -1 // No safe break found
}

export function isInCodeBlock(content: string, position: number): boolean {
  const beforePosition = content.substring(0, position)
  const codeBlockCount = (beforePosition.match(/```/g) || []).length
  return codeBlockCount % 2 === 1
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