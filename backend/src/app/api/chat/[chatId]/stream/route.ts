import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { aiAgent } from '@/lib/agent'

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return new Response('Message content is required', { status: 400 })
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId
      }
    })

    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId: params.chatId,
        role: 'user',
        content
      }
    })

    // Get chat history for context
    const chatHistory = await prisma.message.findMany({
      where: { chatId: params.chatId },
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
        processAIResponse(controller, encoder, params.chatId, content, chatHistory)
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
  chatHistory: any[]
) {
  try {
    // Send typing indicator
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'ai_typing',
      data: { typing: true }
    })}\n\n`))

    let fullResponse = ''

    // Stream the AI response
    for await (const chunk of aiAgent.streamMessage(
      content,
      chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    )) {
      fullResponse += chunk
      
      // Send each chunk as it arrives
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'ai_chunk',
        data: { content: chunk }
      })}\n\n`))
    }

    // Stop typing indicator
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'ai_typing',
      data: { typing: false }
    })}\n\n`))

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role: 'assistant',
        content: fullResponse,
        metadata: {
          model: process.env.OPENROUTER_MODEL,
          streaming: true
        }
      }
    })

    // Send final AI message
    const aiMessageData = JSON.stringify({
      type: 'ai_message_complete',
      data: aiMessage
    })
    controller.enqueue(encoder.encode(`data: ${aiMessageData}\n\n`))

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
    
    // Send error
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      data: { message: 'Failed to process message' }
    })}\n\n`))
    
    controller.close()
  }
}