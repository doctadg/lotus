/**
 * ImageContextManager - Intelligent image context management service
 * Handles storage, retrieval, and intelligent selection of relevant images for conversations
 */

import { prisma } from './prisma'
import { getOpenRouterClient } from './openrouter'
import {
  ImageInfo,
  ImageContextData,
  extractImageUrlsFromContent,
  extractUserImageUrls,
  extractTopicsFromText,
  detectImageReference,
  sortImagesByRelevance,
  formatImageContextForPrompt
} from './image-utils'

export class ImageContextManager {
  /**
   * Store image context when a message contains images
   */
  async storeImageContext(
    chatId: string,
    messageId: string,
    content: string,
    role: 'user' | 'assistant'
  ): Promise<void> {
    try {
      const imageUrls = role === 'user'
        ? extractUserImageUrls(content)
        : extractImageUrlsFromContent(content)

      if (imageUrls.length === 0) return

      // Generate descriptions and topics for each image
      const imageContexts: Omit<ImageContextData, 'id' | 'createdAt'>[] = []

      for (const url of imageUrls) {
        const imageType = this.determineImageType(role, content)
        const description = await this.generateImageDescription(url, content)
        const topics = this.extractImageTopics(content, description)

        imageContexts.push({
          chatId,
          messageId,
          imageUrl: url,
          imageType,
          description,
          topics,
          isActive: true
        })
      }

      // Store in database
      if (imageContexts.length > 0) {
        await prisma.imageContext.createMany({
          data: imageContexts
        })

        console.log(`📸 [IMAGE_CONTEXT] Stored ${imageContexts.length} image contexts for message ${messageId}`)
      }
    } catch (error) {
      console.error('❌ [IMAGE_CONTEXT] Error storing image context:', error)
    }
  }

  /**
   * Get relevant images for a given query in a chat
   */
  async getRelevantImages(
    chatId: string,
    queryText: string,
    maxImages: number = 3,
    includeRecent: boolean = true
  ): Promise<ImageContextData[]> {
    try {
      // Detect if the query references previous images
      const reference = detectImageReference(queryText)

      // Get recent active images from the chat
      const recentImages = await prisma.imageContext.findMany({
        where: {
          chatId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: includeRecent ? 10 : 20 // Get more if not limiting to recent
      })

      if (recentImages.length === 0) {
        return []
      }

      let relevantImages: ImageContextData[]

      if (reference.hasReference && reference.confidence > 0.7) {
        // High confidence reference - prioritize recent images
        switch (reference.referenceType) {
          case 'specific':
          case 'edit':
            // Return the most recent images, prioritizing generated ones for editing
            relevantImages = recentImages.map(img => ({
              ...img,
              description: img.description || undefined
            }))
              .sort((a, b) => {
                if (reference.referenceType === 'edit') {
                  // Prioritize generated images for editing
                  if (a.imageType === 'agent_generated' && b.imageType !== 'agent_generated') return -1
                  if (b.imageType === 'agent_generated' && a.imageType !== 'agent_generated') return 1
                }
                return b.createdAt.getTime() - a.createdAt.getTime()
              })
              .slice(0, maxImages)
            break

          case 'previous':
            // Return recent images in chronological order
            relevantImages = recentImages.map(img => ({
              ...img,
              description: img.description || undefined
            }))
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, maxImages)
            break

          default:
            // Use relevance scoring
            relevantImages = sortImagesByRelevance(queryText, recentImages.map(img => ({
              ...img,
              description: img.description || undefined
            })))
              .slice(0, maxImages)
        }
      } else {
        // No strong reference - use intelligent relevance scoring
        relevantImages = sortImagesByRelevance(queryText, recentImages.map(img => ({
          ...img,
          description: img.description || undefined
        })))
          .slice(0, maxImages)
      }

      console.log(`🧠 [IMAGE_CONTEXT] Selected ${relevantImages.length} relevant images for query: "${queryText.substring(0, 50)}..."`)

      return relevantImages
    } catch (error) {
      console.error('❌ [IMAGE_CONTEXT] Error getting relevant images:', error)
      return []
    }
  }

  /**
   * Format relevant images for agent context
   */
  async getImageContextForPrompt(
    chatId: string,
    queryText: string,
    maxImages: number = 3
  ): Promise<string> {
    const relevantImages = await this.getRelevantImages(chatId, queryText, maxImages)
    return formatImageContextForPrompt(relevantImages)
  }

  /**
   * Update image descriptions and topics (useful for improving context over time)
   */
  async updateImageContext(
    imageContextId: string,
    updates: Partial<Pick<ImageContextData, 'description' | 'topics' | 'isActive'>>
  ): Promise<void> {
    try {
      await prisma.imageContext.update({
        where: { id: imageContextId },
        data: updates
      })
    } catch (error) {
      console.error('❌ [IMAGE_CONTEXT] Error updating image context:', error)
    }
  }

  /**
   * Deactivate old or irrelevant images to keep context focused
   */
  async cleanupOldImages(chatId: string, maxAge: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000)

      await prisma.imageContext.updateMany({
        where: {
          chatId,
          createdAt: {
            lt: cutoffDate
          }
        },
        data: {
          isActive: false
        }
      })

      console.log(`🧹 [IMAGE_CONTEXT] Deactivated old images in chat ${chatId}`)
    } catch (error) {
      console.error('❌ [IMAGE_CONTEXT] Error cleaning up old images:', error)
    }
  }

  /**
   * Get image statistics for a chat
   */
  async getChatImageStats(chatId: string): Promise<{
    total: number
    active: number
    userUploads: number
    agentGenerated: number
    agentEdited: number
  }> {
    try {
      const [total, active, userUploads, agentGenerated, agentEdited] = await Promise.all([
        prisma.imageContext.count({ where: { chatId } }),
        prisma.imageContext.count({ where: { chatId, isActive: true } }),
        prisma.imageContext.count({ where: { chatId, imageType: 'user_upload' } }),
        prisma.imageContext.count({ where: { chatId, imageType: 'agent_generated' } }),
        prisma.imageContext.count({ where: { chatId, imageType: 'agent_edited' } })
      ])

      return {
        total,
        active,
        userUploads,
        agentGenerated,
        agentEdited
      }
    } catch (error) {
      console.error('❌ [IMAGE_CONTEXT] Error getting chat image stats:', error)
      return { total: 0, active: 0, userUploads: 0, agentGenerated: 0, agentEdited: 0 }
    }
  }

  /**
   * Private helper methods
   */

  private determineImageType(role: 'user' | 'assistant', content: string): string {
    if (role === 'user') {
      return 'user_upload'
    }

    // Check if this is an edited image based on content
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('edited') || lowerContent.includes('modified') || lowerContent.includes('updated')) {
      return 'agent_edited'
    }

    return 'agent_generated'
  }

  private async generateImageDescription(imageUrl: string, context: string): Promise<string | undefined> {
    try {
      // Skip description generation for data URLs (too expensive)
      if (imageUrl.startsWith('data:')) {
        return undefined
      }

      const client = getOpenRouterClient()
      const response = await client.chat.completions.create({
        model: process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Provide a brief, descriptive summary of this image in 1-2 sentences. Focus on key visual elements, objects, colors, and style. Context: ${context.substring(0, 200)}`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 150
      })

      const description = response.choices[0]?.message?.content
      return description || undefined
    } catch (error) {
      console.warn('⚠️ [IMAGE_CONTEXT] Could not generate image description:', error)
      return undefined
    }
  }

  private extractImageTopics(content: string, description?: string): string[] {
    const contentTopics = extractTopicsFromText(content)
    const descriptionTopics = description ? extractTopicsFromText(description) : []

    // Combine and deduplicate topics
    const allTopics = Array.from(new Set([...contentTopics, ...descriptionTopics]))

    return allTopics.slice(0, 8) // Limit to 8 topics
  }
}

// Singleton instance
export const imageContextManager = new ImageContextManager()