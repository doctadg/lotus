import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request)
  if (adminAuth instanceof NextResponse) return adminAuth

  try {
    // Get user statistics
    const [
      totalUsers,
      adminUsers,
      freeUsers,
      proUsers,
      totalChats,
      totalMessages,
      totalMemories,
      recentUsers,
      messageUsageStats,
      subscriptionStats
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Admin users count
      prisma.user.count({ where: { role: 'admin' } }),
      
      // Free users count
      prisma.user.count({
        where: {
          OR: [
            { subscription: null },
            { subscription: { planType: 'free' } }
          ]
        }
      }),
      
      // Pro users count
      prisma.user.count({
        where: {
          subscription: { planType: 'pro' }
        }
      }),
      
      // Total chats
      prisma.chat.count(),
      
      // Total messages
      prisma.message.count(),
      
      // Total memories
      prisma.userMemory.count(),
      
      // Recent users (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Message usage stats (last 7 days)
      prisma.messageUsage.groupBy({
        by: ['hour'],
        _sum: { count: true },
        where: {
          hour: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { hour: 'asc' }
      }),
      
      // Subscription distribution
      prisma.subscription.groupBy({
        by: ['planType', 'status'],
        _count: true
      })
    ])

    // User growth over time (last 30 days)
    const userGrowth = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Active users (users who have sent messages in last 7 days)
    const activeUsers = await prisma.user.count({
      where: {
        chats: {
          some: {
            messages: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        }
      }
    })

    const stats = {
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: totalUsers - adminUsers,
        active: activeUsers,
        recent: recentUsers,
        growth: userGrowth
      },
      subscriptions: {
        free: freeUsers,
        pro: proUsers,
        distribution: subscriptionStats
      },
      content: {
        chats: totalChats,
        messages: totalMessages,
        memories: totalMemories
      },
      usage: {
        messageUsage: messageUsageStats
      }
    }

    await logAdminAction(adminAuth.userId, 'view_stats')

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { stats }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}