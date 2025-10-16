import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { aiAgent } from '@/lib/agent'
import { trackMessageUsage, trackDeepResearchUsage } from '@/lib/rate-limit'
import { imageContextManager } from '@/lib/image-context-manager'
import { extractUserImageUrls, extractImageUrlsFromContent } from '@/lib/image-utils'
import { hasUnlimitedMessages, canUseDeepResearch } from '@/lib/clerk-billing'


// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  console.log('🚀 Streaming request received')
  try {
    const { chatId } = await params
    console.log('💬 Chat ID:', chatId)
    
    const { userId: clerkUserId } = await auth()
    console.log('👤 Clerk User ID:', clerkUserId)
    
    if (!clerkUserId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Sync user with database if needed
    const user = await syncUserWithDatabase(clerkUserId)
    
    if (!user) {
      return new Response('User sync failed', { status: 500 })
    }
    
    const userId = user.id
    const userEmail = user.email

    const { content, deepResearchMode = false } = await request.json()

    if (!content) {
      return new Response('Message content is required', { status: 400 })
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId
      }
    })

    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    // Check if user has access to deep research via hybrid subscription (RevenueCat or Clerk)
    if (deepResearchMode) {
      console.log(`🔍 [Deep Research Check] User ${clerkUserId} requesting deep research`)
      const hasDeepResearch = await canUseDeepResearch()
      console.log(`📊 [Deep Research Check] Result: ${hasDeepResearch}`)

      if (!hasDeepResearch) {
        console.log(`❌ [Deep Research Check] Denying access - user does not have Pro subscription`)
        return new Response(
          JSON.stringify({
            error: 'Deep Research is a Pro feature',
            message: 'Upgrade to Pro to access Deep Research mode with comprehensive sources and enhanced analysis.',
            upgradeUrl: '/pricing'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`✅ [Deep Research Check] Access granted - user has Pro subscription`)

      // Track usage for analytics (even for Pro users)
      const canProceed = await trackDeepResearchUsage(userId)
      console.log(`📊 [Deep Research Usage] Usage tracked, can proceed: ${canProceed}`)

      if (!canProceed) {
        console.log(`❌ [Deep Research Usage] Daily limit reached for user`)
        return new Response(
          JSON.stringify({
            error: 'Daily limit reached',
            message: 'You have reached today\'s Deep Research limit on the free plan. Upgrade to Pro for unlimited deep research.',
            upgradeUrl: '/pricing'
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Check message rate limits using Clerk billing
    const hasUnlimited = await hasUnlimitedMessages()
    if (!hasUnlimited) {
      // Free users: check rate limits
      const canProceed = await trackMessageUsage(userId)
      if (!canProceed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'You have reached your message limit for this hour. Upgrade to Pro for unlimited messages.',
            upgradeUrl: '/pricing'
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      // Pro users: still track usage for analytics, but don't enforce limits
      await trackMessageUsage(userId)
    }

    // Get chat history for context
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 10  // Limit context to last 10 messages for performance
    })

    // Extract images from user message
    const userImages = extractUserImageUrls(content)
    const userImageData = userImages.map(url => ({
      url,
      type: 'user_upload' as const,
      description: undefined
    }))

    // Store user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content,
        images: userImageData.length > 0 ? userImageData : undefined
      }
    })

    // Store image context for user message if it contains images
    if (userImages.length > 0) {
      await imageContextManager.storeImageContext(chatId, userMessage.id, content, 'user')
    }

    // Create assistant message placeholder
    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: '' // Will be updated as stream progresses
      }
    })

    // Get relevant image context for the agent
    const imageContext = await imageContextManager.getImageContextForPrompt(chatId, content, 3)
    const enhancedContent = imageContext + content

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        const encoder = new TextEncoder()

        try {
          // Stream messages from the AI agent generator with image context
          for await (const event of aiAgent.streamMessage(
            enhancedContent,
            messages.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content
            })),
            userId,
            deepResearchMode
          )) {
            // Handle different event types
            if (event.type === 'content') {
              // Send as ai_chunk which the frontend expects
              fullResponse += event.content || ''
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'ai_chunk', 
                data: { content: event.content } 
              })}\n\n`))
            } else if (event.type === 'thinking_stream') {
              // Send thinking events
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'thinking_stream', 
                data: { 
                  content: event.content,
                  metadata: event.metadata 
                }
              })}\n\n`))
            } else if (event.type === 'search_planning' || event.type === 'search_start' || 
                       event.type === 'search_progress' || event.type === 'search_complete') {
              // Send search events
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: event.type, 
                data: { 
                  content: event.content,
                  metadata: event.metadata 
                }
              })}\n\n`))
            } else if (event.type === 'error') {
              console.error('Stream error:', event.content)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                content: event.content 
              })}\n\n`))
            } else {
              // Pass through any other event types
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            }
          }

          // Update the assistant message with the full response and track images
          if (fullResponse) {
            // Extract generated images from the response
            const generatedImages = extractImageUrlsFromContent(fullResponse)
            const generatedImageData = generatedImages.map(url => ({
              url,
              type: 'agent_generated' as const,
              description: undefined
            }))

            await prisma.message.update({
              where: { id: assistantMessage.id },
              data: {
                content: fullResponse,
                images: generatedImageData.length > 0 ? generatedImageData : undefined
              }
            })

            // Store image context for assistant message if it contains images
            if (generatedImages.length > 0) {
              await imageContextManager.storeImageContext(chatId, assistantMessage.id, fullResponse, 'assistant')
            }

            // Cleanup old images periodically (every ~10 messages)
            if (Math.random() < 0.1) {
              await imageContextManager.cleanupOldImages(chatId, 7) // Keep images for 7 days
            }
          }

          // Send complete event to stop thinking animation
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
          // Send done signal
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error in chat stream:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
