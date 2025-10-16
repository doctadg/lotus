import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

export type SubscriptionSource = 'revenuecat' | 'clerk' | 'none'

export interface SubscriptionStatus {
  isPro: boolean
  source: SubscriptionSource
  expiresAt?: Date | null
  platform?: 'app_store' | 'play_store' | 'stripe' | 'promotional' | 'web' | null
  willRenew?: boolean
  isInTrialPeriod?: boolean
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
 * Check if user has active RevenueCat subscription (mobile IAP)
 */
async function checkRevenueCatSubscription(
  userId: string
): Promise<SubscriptionStatus | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const rcSub = user.privateMetadata
      ?.revenuecatSubscription as RevenueCatSubscriptionData | undefined

    if (!rcSub) {
      return null
    }

    // Check if subscription is active and not expired
    // Note: isPro should already be correctly set by the webhook
    if (
      rcSub.isPro &&
      rcSub.status === 'active' &&
      (!rcSub.expiresAt || new Date(rcSub.expiresAt) > new Date())
    ) {
      return {
        isPro: true,
        source: 'revenuecat',
        expiresAt: new Date(rcSub.expiresAt),
        platform: rcSub.platform,
        willRenew: rcSub.willRenew,
        isInTrialPeriod: rcSub.isInTrialPeriod,
      }
    }

    return null
  } catch (error) {
    console.error(
      '[Subscription Status] Error checking RevenueCat subscription:',
      error
    )
    return null
  }
}

/**
 * Check if user has active Clerk Billing subscription (web)
 */
async function checkClerkBillingSubscription(): Promise<SubscriptionStatus | null> {
  try {
    const { has, userId } = await auth()

    if (!userId || !has) {
      return null
    }

    // Check if user has Pro plan via Clerk Billing
    const hasPro = has({ plan: 'pro' })

    if (hasPro) {
      return {
        isPro: true,
        source: 'clerk',
        platform: 'web',
      }
    }

    return null
  } catch (error) {
    console.error(
      '[Subscription Status] Error checking Clerk Billing subscription:',
      error
    )
    return null
  }
}

/**
 * Get user's subscription status from all sources
 * Priority: RevenueCat (mobile) > Clerk Billing (web) > None (free)
 */
export async function getUserSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isPro: false,
        source: 'none',
      }
    }

    // Check RevenueCat first (mobile subscriptions)
    const revenueCatStatus = await checkRevenueCatSubscription(userId)
    if (revenueCatStatus && revenueCatStatus.isPro) {
      console.log(
        `[Subscription Status] User ${userId} has active RevenueCat subscription`
      )
      return revenueCatStatus
    }

    // Check Clerk Billing second (web subscriptions)
    const clerkStatus = await checkClerkBillingSubscription()
    if (clerkStatus && clerkStatus.isPro) {
      console.log(
        `[Subscription Status] User ${userId} has active Clerk Billing subscription`
      )
      return clerkStatus
    }

    // Default to free tier
    console.log(`[Subscription Status] User ${userId} is on free tier`)
    return {
      isPro: false,
      source: 'none',
    }
  } catch (error) {
    console.error('[Subscription Status] Error getting subscription status:', error)
    return {
      isPro: false,
      source: 'none',
    }
  }
}

/**
 * Quick check if user is Pro (from any source)
 */
export async function isProUser(): Promise<boolean> {
  const status = await getUserSubscriptionStatus()
  return status.isPro
}

/**
 * Get subscription details for display
 */
export async function getSubscriptionDetails(): Promise<{
  isPro: boolean
  source: string
  platform?: string
  expiresAt?: Date | null
  willRenew?: boolean
  isInTrialPeriod?: boolean
}> {
  const status = await getUserSubscriptionStatus()

  return {
    isPro: status.isPro,
    source: status.source,
    platform: status.platform || undefined,
    expiresAt: status.expiresAt,
    willRenew: status.willRenew,
    isInTrialPeriod: status.isInTrialPeriod,
  }
}
