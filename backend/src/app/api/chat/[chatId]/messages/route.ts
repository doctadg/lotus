import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { aiAgent } from '@/lib/agent'
import { trackMessageUsage } from '@/lib/rate-limit'
import { ApiResponse, SendMessageRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const { userId: clerkUserId } = await auth()

    // Get pagination parameters from query string
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100) // Max 100 messages per page
    const skip = (page - 1) * limit
    
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

    // Fetch messages with pagination and optimized query
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: { chatId: chatId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
          // Exclude metadata unless needed
        },
        skip,
        take: limit
      }),
      prisma.message.count({
        where: { chatId: chatId }
      })
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
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

    // Rate limit: count this message for free users
    const ok = await trackMessageUsage(user.id)
    if (!ok) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Rate limit exceeded. Upgrade to Pro for unlimited access.' }, { status: 429 })
    }

    // Get chat history for context - optimized query
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: 10,  // Get last 10 messages
      select: {
        role: true,
        content: true,
        createdAt: true
      }
    }).then(msgs => msgs.reverse()) // Reverse to get chronological order

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
