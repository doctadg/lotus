import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { aiAgent } from '@/lib/agent'
import { ApiResponse, SendMessageRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const authData = await authenticateUser(request)
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = authData.userId

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId
      }
    })

    if (!chat) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Chat not found'
      }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: messages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const authData = await authenticateUser(request)
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = authData.userId

    const { content, role = 'user' }: SendMessageRequest = await request.json()

    if (!content) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Message content is required'
      }, { status: 400 })
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId
      }
    })

    if (!chat) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Chat not found'
      }, { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role,
        content
      }
    })

    // Get chat history for context
    const chatHistory = await prisma.message.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' },
      take: -20 // Last 20 messages
    })

    // Process message with AI agent
    const agentResponse = await aiAgent.processMessage(
      content,
      chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      false, // deepResearchMode
      userId // pass userId for personalization
    )

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role: 'assistant',
        content: agentResponse.content,
        metadata: agentResponse.metadata ? JSON.parse(JSON.stringify(agentResponse.metadata)) : null
      }
    })

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userMessage,
        aiMessage
      }
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
