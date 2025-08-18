import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { aiAgent } from '@/lib/agent'
import { trackMessageUsage } from '@/lib/rate-limit'


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
    const authData = await authenticateUser(request)
    console.log('👤 Auth Data:', authData)
    
    if (!authData) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const userId = authData.userId
    const userEmail = authData.email

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

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role: 'user',
        content
      }
    })

    // Get chat history for context
    const chatHistory = await prisma.message.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' },
      take: -20
    })

    // Create streaming response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        // Send user message first
        const userMessageData = JSON.stringify({
          type: 'user_message',
          data: userMessage
        })
        controller.enqueue(encoder.encode(`data: ${userMessageData}\n\n`))
        
        // Start AI processing
        processAIResponse(controller, encoder, chatId, content, chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString()
        })), deepResearchMode, userId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

async function processAIResponse(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  chatId: string,
  content: string,
  chatHistory: Array<{ role: string; content: string; createdAt: string }>,
  deepResearchMode = false,
  userId?: string
) {
  try {
    // Check rate limit for free users
    if (userId) {
      const withinLimit = await trackMessageUsage(userId)
      if (!withinLimit) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'limit_exceeded',
          data: { 
            message: 'You have reached your hourly message limit. Upgrade to Pro for unlimited messages.',
            metadata: { limitReached: true }
          }
        })}\n\n`))
        controller.close()
        return
      }
    }

    // Check if user is trying to use deep research mode without Pro plan
    if (deepResearchMode && userId) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      })
      
      const isProUser = subscription && subscription.planType === 'pro' && subscription.status === 'active'
      
      if (!isProUser) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          data: { 
            message: 'Deep research mode is only available for Pro users. Please upgrade to access this feature.',
            metadata: { proRequired: true }
          }
        })}\n\n`))
        controller.close()
        return
      }
    }

    // Send typing indicator
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'ai_typing',
      data: { typing: true }
    })}\n\n`))

    let fullResponse = ''

    // Stream the AI response with enhanced phases
    console.log('📤 [STREAM] Starting to stream AI response')
    let eventCount = 0
    for await (const event of aiAgent.streamMessage(
      content, // Use original content, not processed
      chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      userId,
      deepResearchMode
    )) {
      eventCount++
      console.log(`📬 [STREAM] Processing event #${eventCount}:`, event.type, event.metadata?.phase || '')
      switch (event.type) {
        case 'thinking_stream':
          // Send continuous thinking updates
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'thinking_stream',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'memory_access':
          // Send memory access events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'memory_access',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'context_analysis':
          // Send context analysis events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'context_analysis',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'search_planning':
          // Send search planning events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'search_planning',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'search_start':
          // Send search start events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'search_start',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'search_progress':
          // Send search progress updates
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'search_progress',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'search_detailed':
          // Send detailed search events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'search_detailed',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'website_scraping':
          // Send website scraping events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'website_scraping',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'search_result_analysis':
          // Send search result analysis
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'search_result_analysis',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'context_synthesis':
          // Send context synthesis events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'context_synthesis',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'response_planning':
          // Send response planning events
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'response_planning',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'agent_thought':
          // Send agent reasoning step (backwards compatibility)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'agent_thought',
            data: { 
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          
          // Also send as thinking_stream for better UI display
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'thinking_stream',
            data: {
              content: event.content,
              metadata: event.metadata || { phase: 'agent_reasoning' }
            }
          })}\n\n`))
          break
          
        case 'tool_call':
          // Send enhanced tool call notification
          console.log('📡 [STREAM] Sending tool_call event:', event.content, event.metadata)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'tool_call',
            data: { 
              tool: event.content,
              metadata: {
                ...event.metadata,
                enhanced: true
              }
            }
          })}\n\n`))
          break
          
        case 'tool_result':
          // Send enhanced tool result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'tool_result',
            data: {
              content: event.content,
              metadata: {
                ...event.metadata,
                enhanced: true
              }
            }
          })}\n\n`))
          break
          
        case 'agent_processing':
          // Send processing status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'agent_processing',
            data: {
              content: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        case 'content':
          // Stream content chunks
          fullResponse += event.content || ''
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'ai_chunk',
            data: { content: event.content }
          })}\n\n`))
          break
          
        case 'complete':
          // Handle completion with metadata - store metadata for later use
          if (event.metadata) {
            // Metadata will be saved with the message
          }
          break
          
        case 'error':
          // Handle error
          fullResponse = event.content || 'An error occurred'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            data: { 
              message: event.content,
              metadata: event.metadata
            }
          })}\n\n`))
          break
          
        // Backwards compatibility
        case 'thinking':
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'ai_thinking',
            data: { content: event.content }
          })}\n\n`))
          break
          
        case 'tool_use':
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'ai_tool_use',
            data: { content: event.content, metadata: event.metadata }
          })}\n\n`))
          break
      }
    }

    // Save AI response (but don't send it again to avoid duplication)
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role: 'assistant',
        content: fullResponse,
        metadata: JSON.parse(JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b',
          streaming: true
        }))
      }
    })

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })

    // Send completion
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'complete',
      data: { success: true }
    })}\n\n`))

    controller.close()
  } catch (error) {
    console.error('AI processing error:', error)
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    // Send error
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      data: { message: 'Failed to process message' }
    })}\n\n`))
    
    controller.close()
  }
}
