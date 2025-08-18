import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser, createOrGetUser } from '@/lib/auth'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const authData = await authenticateUser(request)
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = authData.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        chats: {
          orderBy: { updatedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    
    if (!email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    const userId = await createOrGetUser(email, name)
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error creating/getting user:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
