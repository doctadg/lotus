import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const user = await syncUserWithDatabase(clerkUserId)
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // Get user's subscription status
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    // If no subscription found, user is on free plan
    const subscriptionData = subscription || {
      planType: 'free',
      status: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { subscription: subscriptionData }
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
