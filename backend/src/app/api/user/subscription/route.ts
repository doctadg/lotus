import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'
import { getSubscriptionDetails } from '@/lib/subscription-status'

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

    // Get hybrid subscription status (RevenueCat + Clerk Billing)
    const hybridStatus = await getSubscriptionDetails()

    // Get database subscription (legacy/fallback)
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    // Build subscription data
    const subscriptionData = {
      planType: hybridStatus.isPro ? 'pro' : 'free',
      status: hybridStatus.isPro ? 'active' : (subscription?.status || null),
      currentPeriodStart: subscription?.currentPeriodStart || null,
      currentPeriodEnd: hybridStatus.expiresAt || subscription?.currentPeriodEnd || null,
      source: hybridStatus.source,
      platform: hybridStatus.platform,
      willRenew: hybridStatus.willRenew,
      isInTrialPeriod: hybridStatus.isInTrialPeriod,
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
