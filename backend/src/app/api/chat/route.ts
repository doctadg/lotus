import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { ApiResponse, CreateChatRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Sync user with database if needed
    const user = await syncUserWithDatabase(userId)

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, { status: 500 })
    }

    const { title }: CreateChatRequest = await request.json()

    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        title: title || 'New Chat'
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: chat
    })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Sync user with database if needed
    const user = await syncUserWithDatabase(userId)

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, { status: 500 })
    }

    // Get pagination parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50) // Max 50 chats per page
    const skip = (page - 1) * limit

    // Fetch chats with pagination and optimized query
    const [chats, totalCount] = await Promise.all([
      prisma.chat.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { messages: true }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,  // Get latest message for preview
            select: {
              content: true,
              role: true,
              createdAt: true
            }
          }
        },
        skip,
        take: limit
      }),
      prisma.chat.count({
        where: { userId: user.id }
      })
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chats,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}