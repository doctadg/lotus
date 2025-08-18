import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request)
  if (adminAuth instanceof NextResponse) return adminAuth

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const planType = searchParams.get('planType') || ''
    
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (planType) {
      where.subscription = {
        planType
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          subscription: true,
          _count: {
            select: {
              chats: true,
              memories: true,
              messageUsage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    await logAdminAction(adminAuth.userId, 'view_users', undefined, { 
      filters: { search, role, planType }, 
      page, 
      limit 
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
          stats: user._count,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const adminAuth = await requireAdmin(request)
  if (adminAuth instanceof NextResponse) return adminAuth

  try {
    const { userId, updates } = await request.json()
    
    if (!userId || !updates) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and updates are required'
      }, { status: 400 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.role && { role: updates.role }),
        ...(updates.name && { name: updates.name })
      },
      include: {
        subscription: true
      }
    })

    // Update subscription if provided
    if (updates.subscription) {
      if (updatedUser.subscription) {
        await prisma.subscription.update({
          where: { userId },
          data: updates.subscription
        })
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            ...updates.subscription
          }
        })
      }
    }

    await logAdminAction(adminAuth.userId, 'update_user', userId, { updates })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user: updatedUser }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}