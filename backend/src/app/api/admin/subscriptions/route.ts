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
    const planType = searchParams.get('planType') || ''
    const status = searchParams.get('status') || ''
    
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (planType) {
      where.planType = planType
    }
    
    if (status) {
      where.status = status
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subscription.count({ where })
    ])

    await logAdminAction(adminAuth.userId, 'view_subscriptions', undefined, { 
      filters: { planType, status }, 
      page, 
      limit 
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
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
    const { userId, subscriptionData } = await request.json()
    
    if (!userId || !subscriptionData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User ID and subscription data are required'
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: subscriptionData,
      create: {
        userId,
        ...subscriptionData
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    await logAdminAction(adminAuth.userId, 'update_subscription', userId, { 
      subscriptionData 
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { subscription }
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}