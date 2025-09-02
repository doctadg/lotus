import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { aiAgent } from '@/lib/agent'
import { ApiResponse, SendMessageRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    // Sync user with database if needed
    const user = await syncUserWithDatabase(clerkUserId)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, { status: 500 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id
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
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    // Sync user with database if needed
    const user = await syncUserWithDatabase(clerkUserId)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, { status: 500 })
    }

    const { content }: SendMessageRequest = await request.json()

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id
      }
    })

    if (!chat) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Chat not found'
      }, { status: 404 })
    }

    // Get chat history for context
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 10  // Limit context to last 10 messages for performance
    })

    // Store user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content
      }
    })

    // Process with AI agent
    const response = await aiAgent.processMessage(
      content,
      messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      false, // deepResearchMode
      user.id
    )

    // Store assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: response.content
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userMessage,
        assistantMessage
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