import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { ApiResponse, CreateChatRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const { title }: CreateChatRequest = await request.json()

    const chat = await prisma.chat.create({
      data: {
        userId,
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
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Just get the first message for preview
        }
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: chats
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}