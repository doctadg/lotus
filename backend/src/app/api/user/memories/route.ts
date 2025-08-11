import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRelevantMemories } from '@/lib/memory-extractor'
import { storeUserMemory } from '@/lib/embeddings'
import { ApiResponse } from '@/types'

// GET /api/user/memories - Get user's memories
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')

    let memories

    if (query) {
      // Semantic search
      memories = await getRelevantMemories(userId, query, limit)
    } else {
      // Regular query with optional type filter
      const whereClause = type ? { userId, type } : { userId }
      
      memories = await prisma.userMemory.findMany({
        where: whereClause,
        orderBy: [
          { confidence: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: limit
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { memories }
    })

  } catch (error) {
    console.error('Error fetching memories:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/user/memories - Create new memory
export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { type, category, key, value, confidence = 1.0 } = body

    if (!type || !key || !value) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Type, key, and value are required'
      }, { status: 400 })
    }

    if (!['preference', 'fact', 'context', 'skill'].includes(type)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Type must be one of: preference, fact, context, skill'
      }, { status: 400 })
    }

    await storeUserMemory(
      userId,
      type,
      category || 'general',
      key,
      value,
      confidence,
      'explicit'
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Memory stored successfully' }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating memory:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/user/memories - Delete memory
export async function DELETE(request: NextRequest) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memoryId = searchParams.get('id')
    const key = searchParams.get('key')

    if (!memoryId && !key) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Either id or key parameter is required'
      }, { status: 400 })
    }

    const whereClause = memoryId 
      ? { id: memoryId, userId }
      : { userId, key: key! }

    const deletedMemory = await prisma.userMemory.deleteMany({
      where: whereClause
    })

    if (deletedMemory.count === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Memory not found'
      }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Memory deleted successfully' }
    })

  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}