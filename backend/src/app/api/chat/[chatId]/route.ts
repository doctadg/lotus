import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { ApiResponse } from '@/types'

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

    await prisma.chat.delete({
      where: { id: chatId }
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
