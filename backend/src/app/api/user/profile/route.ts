import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/clerk-auth'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user?.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!userData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: userData
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const { name, email } = await request.json()

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(name && { name }),
        ...(email && { email })
      },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedUser
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update profile'
    }, { status: 500 })
  }
}
