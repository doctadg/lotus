import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId
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
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: chat
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId
      }
    })

    if (!chat) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Chat not found'
      }, { status: 404 })
    }

    await prisma.chat.delete({
      where: { id: params.chatId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Chat deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}