/**
 * Image utility functions for context management and analysis
 */

export interface ImageInfo {
  url: string
  type: 'user_upload' | 'agent_generated' | 'agent_edited'
  description?: string
  topics?: string[]
  messageId?: string
  timestamp?: Date
}

export interface ImageContextData {
  id: string
  chatId: string
  messageId: string
  imageUrl: string
  imageType: string
  description?: string
  topics: string[]
  isActive: boolean
  createdAt: Date
}

/**
 * Extract image URLs from message content (markdown format)
 */
export function extractImageUrlsFromContent(content: string): string[] {
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g
  const urls: string[] = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    urls.push(match[1])
  }

  return urls
}

/**
 * Extract image URLs from user message that might contain data URLs or blob URLs
 */
export function extractUserImageUrls(content: string): string[] {
  const urls: string[] = []

  // Match markdown images
  const markdownUrls = extractImageUrlsFromContent(content)
  urls.push(...markdownUrls)

  // Match raw URLs that look like images
  const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi
  let match
  while ((match = urlRegex.exec(content)) !== null) {
    if (!urls.includes(match[1])) {
      urls.push(match[1])
    }
  }

  // Match data URLs
  const dataUrlRegex = /(data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+)/g
  while ((match = dataUrlRegex.exec(content)) !== null) {
    if (!urls.includes(match[1])) {
      urls.push(match[1])
    }
  }

  return urls
}

/**
 * Generate keywords and topics from text content for image relevance matching
 */
export function extractTopicsFromText(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)

  // Common image-related keywords
  const imageKeywords = [
    'image', 'picture', 'photo', 'drawing', 'sketch', 'art', 'design',
    'color', 'style', 'edit', 'modify', 'change', 'create', 'generate',
    'background', 'subject', 'object', 'person', 'face', 'landscape',
    'portrait', 'cartoon', 'realistic', 'abstract', 'illustration'
  ]

  // Visual descriptors
  const visualDescriptors = [
    'bright', 'dark', 'colorful', 'blue', 'red', 'green', 'yellow', 'purple',
    'black', 'white', 'transparent', 'blurred', 'sharp', 'detailed', 'simple',
    'complex', 'beautiful', 'artistic', 'professional', 'casual'
  ]

  // Action words related to image editing
  const actionWords = [
    'remove', 'add', 'blur', 'sharpen', 'crop', 'resize', 'rotate', 'flip',
    'enhance', 'filter', 'adjust', 'brighten', 'darken', 'saturate', 'isolate'
  ]

  const relevantWords = [...imageKeywords, ...visualDescriptors, ...actionWords]

  return words.filter(word =>
    relevantWords.includes(word) ||
    word.length > 4 // Include longer words that might be descriptive
  ).slice(0, 10) // Limit to top 10 topics
}

/**
 * Determine if a message likely references previous images
 */
export function detectImageReference(content: string): {
  hasReference: boolean
  referenceType: 'specific' | 'previous' | 'that' | 'edit' | 'general'
  confidence: number
} {
  const lowerContent = content.toLowerCase()

  // Specific references
  const specificRefs = [
    'this image', 'that image', 'the image', 'previous image', 'last image',
    'the picture', 'that picture', 'this picture', 'the photo', 'that photo'
  ]

  // Edit/modify references
  const editRefs = [
    'edit it', 'modify it', 'change it', 'update it', 'alter it',
    'edit the', 'modify the', 'change the', 'remove the', 'add to'
  ]

  // Previous references
  const previousRefs = [
    'previous', 'earlier', 'before', 'above', 'from before', 'last one'
  ]

  // Demonstrative references
  const demonstrativeRefs = ['this', 'that', 'it', 'these', 'those']

  let hasReference = false
  let referenceType: 'specific' | 'previous' | 'that' | 'edit' | 'general' = 'general'
  let confidence = 0

  // Check for specific image references (highest confidence)
  for (const ref of specificRefs) {
    if (lowerContent.includes(ref)) {
      hasReference = true
      referenceType = 'specific'
      confidence = 0.9
      break
    }
  }

  // Check for edit references (high confidence)
  if (!hasReference) {
    for (const ref of editRefs) {
      if (lowerContent.includes(ref)) {
        hasReference = true
        referenceType = 'edit'
        confidence = 0.8
        break
      }
    }
  }

  // Check for previous references (medium confidence)
  if (!hasReference) {
    for (const ref of previousRefs) {
      if (lowerContent.includes(ref)) {
        hasReference = true
        referenceType = 'previous'
        confidence = 0.7
        break
      }
    }
  }

  // Check for demonstrative references (lower confidence, needs context)
  if (!hasReference) {
    for (const ref of demonstrativeRefs) {
      if (lowerContent.includes(ref + ' ')) {
        hasReference = true
        referenceType = 'that'
        confidence = 0.5
        break
      }
    }
  }

  return { hasReference, referenceType, confidence }
}

/**
 * Calculate relevance score between query and image context
 */
export function calculateImageRelevance(
  queryText: string,
  imageContext: ImageContextData,
  messageDistance: number = 0
): number {
  let score = 0
  const queryLower = queryText.toLowerCase()
  const queryTopics = extractTopicsFromText(queryText)

  // Topic overlap scoring (0-0.4)
  if (imageContext.topics && imageContext.topics.length > 0) {
    const commonTopics = queryTopics.filter(topic =>
      imageContext.topics.some(imageTopic =>
        imageTopic.toLowerCase().includes(topic) ||
        topic.includes(imageTopic.toLowerCase())
      )
    )
    score += (commonTopics.length / Math.max(queryTopics.length, imageContext.topics.length)) * 0.4
  }

  // Description similarity (0-0.3)
  if (imageContext.description) {
    const descWords = imageContext.description.toLowerCase().split(/\s+/)
    const queryWords = queryLower.split(/\s+/)
    const commonWords = queryWords.filter(word =>
      descWords.some(descWord => descWord.includes(word) || word.includes(descWord))
    )
    score += (commonWords.length / Math.max(queryWords.length, descWords.length)) * 0.3
  }

  // Recency bonus (0-0.2)
  const hoursSinceCreation = (Date.now() - imageContext.createdAt.getTime()) / (1000 * 60 * 60)
  const recencyBonus = Math.max(0, 0.2 * (1 - hoursSinceCreation / 24)) // Decay over 24 hours
  score += recencyBonus

  // Message distance penalty (0-0.1 penalty)
  const distancePenalty = Math.min(0.1, messageDistance * 0.02)
  score -= distancePenalty

  // Image type bonus (0-0.1)
  if (imageContext.imageType === 'agent_generated' && queryLower.includes('edit')) {
    score += 0.1 // Prefer generated images for editing requests
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * Sort images by relevance to query
 */
export function sortImagesByRelevance(
  queryText: string,
  images: ImageContextData[],
  currentMessageIndex: number = 0
): ImageContextData[] {
  return images
    .map((image, index) => ({
      image,
      relevance: calculateImageRelevance(queryText, image, currentMessageIndex - index),
      index
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .map(item => item.image)
}

/**
 * Format image context for agent prompt
 */
export function formatImageContextForPrompt(images: ImageContextData[]): string {
  if (images.length === 0) return ''

  let context = '\n=== AVAILABLE IMAGES ===\n'

  images.forEach((image, index) => {
    context += `Image ${index + 1}:\n`
    context += `- URL: ${image.imageUrl}\n`
    context += `- Type: ${image.imageType.replace('_', ' ')}\n`
    if (image.description) {
      context += `- Description: ${image.description}\n`
    }
    if (image.topics && image.topics.length > 0) {
      context += `- Topics: ${image.topics.join(', ')}\n`
    }
    context += `- Created: ${image.createdAt.toISOString()}\n\n`
  })

  context += 'Use these images as context when generating, editing, or analyzing images.\n'
  context += '=== END IMAGES ===\n\n'

  return context
}