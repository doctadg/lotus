import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { ApiResponse } from '@/types'

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

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
      }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Sync user with database if needed
    const user = await syncUserWithDatabase(clerkUserId)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!chat) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Chat not found'
      }, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: chat
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

export async function DELETE(
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
      }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Sync user with database if needed
    const user = await syncUserWithDatabase(clerkUserId)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Verify ownership before deletion
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
      }, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Delete the chat (messages will cascade delete)
    await prisma.chat.delete({
      where: { id: chatId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Chat deleted successfully' }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}