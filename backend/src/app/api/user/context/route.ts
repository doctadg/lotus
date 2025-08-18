import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateUserContext } from '@/lib/embeddings'
import { ApiResponse } from '@/types'

// GET /api/user/context - Get user's context
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

    const context = await prisma.userContext.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { context }
    })

  } catch (error) {
    console.error('Error fetching user context:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/user/context - Update user's context
export async function POST(request: NextRequest) {
  try {
    const authData = await authenticateUser(request)
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = authData.userId

    const body = await request.json()
    const {
      communicationStyle,
      topicsOfInterest,
      expertiseAreas,
      preferredResponseStyle,
      timezone
    } = body

    await updateUserContext(userId, {
      communicationStyle,
      topicsOfInterest,
      expertiseAreas,
      preferredResponseStyle,
      timezone
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Context updated successfully' }
    })

  } catch (error) {
    console.error('Error updating user context:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
