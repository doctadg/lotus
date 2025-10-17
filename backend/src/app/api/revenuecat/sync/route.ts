import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

interface RevenueCatSyncRequest {
  isPro: boolean
  customerInfo: {
    originalAppUserId: string
    activeSubscriptions: string[]
    entitlements: string[]
  } | null
}

interface RevenueCatSubscriptionData {
  isPro: boolean
  platform: 'app_store' | 'play_store' | 'stripe' | 'promotional' | null
  expiresAt: string | null
  productId: string | null
  status: 'active' | 'expired' | 'cancelled' | 'billing_issue' | null
  willRenew: boolean
  isInTrialPeriod: boolean
  lastUpdated: string
}

/**
 * Manual RevenueCat subscription sync endpoint
 * Called by mobile app after purchases, restores, or on app startup
 *
 * This provides a fallback sync mechanism in case webhooks fail
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: RevenueCatSyncRequest = await request.json()

    if (process.env.NODE_ENV === 'development') {
      console.log('[RevenueCat Sync] Manual sync request from user:', clerkUserId)
      console.log('[RevenueCat Sync] Request data:', body)
    }

    // Verify the user is syncing their own subscription
    if (
      body.customerInfo &&
      body.customerInfo.originalAppUserId !== clerkUserId
    ) {
      console.error(
        '[RevenueCat Sync] User ID mismatch:',
        clerkUserId,
        'vs',
        body.customerInfo.originalAppUserId
      )
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    // Build subscription data to store in Clerk metadata
    const subscriptionData: RevenueCatSubscriptionData = {
      isPro: body.isPro,
      platform: inferPlatform(body.customerInfo?.activeSubscriptions || []),
      expiresAt: null, // Will be updated by webhook with actual expiration
      productId:
        body.customerInfo?.activeSubscriptions?.[0] || null,
      status: body.isPro ? 'active' : null,
      willRenew: body.isPro, // Assume true for active subscriptions
      isInTrialPeriod: false, // Can't determine from mobile, webhook will update
      lastUpdated: new Date().toISOString(),
    }

    // Update Clerk user metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(clerkUserId, {
      privateMetadata: {
        revenuecatSubscription: subscriptionData,
      },
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[RevenueCat Sync] Updated user metadata:',
        subscriptionData
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription synced successfully',
        data: { isPro: body.isPro },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[RevenueCat Sync] Error syncing subscription:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Infer platform from active subscriptions
 * This is a best-guess since we don't get platform from mobile sync
 */
function inferPlatform(
  activeSubscriptions: string[]
): RevenueCatSubscriptionData['platform'] {
  if (activeSubscriptions.length === 0) return null

  // Check product IDs for platform hints
  const productId = activeSubscriptions[0]

  // iOS products typically use bundle ID format
  if (productId.includes('ios') || productId.includes('apple')) {
    return 'app_store'
  }

  // Android products typically use package name format
  if (productId.includes('android') || productId.includes('google')) {
    return 'play_store'
  }

  // Stripe subscriptions
  if (productId.includes('stripe')) {
    return 'stripe'
  }

  // Default to app_store as it's most common for mobile
  return 'app_store'
}

/**
 * GET handler for testing
 * Returns endpoint info
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: '/api/revenuecat/sync',
      description: 'Manual RevenueCat subscription sync endpoint',
      method: 'POST',
      authentication: 'Required (Clerk JWT)',
      body: {
        isPro: 'boolean',
        customerInfo: {
          originalAppUserId: 'string',
          activeSubscriptions: 'string[]',
          entitlements: 'string[]',
        },
      },
    },
    { status: 200 }
  )
}
