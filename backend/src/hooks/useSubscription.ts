'use client'

import { useUser } from '@clerk/nextjs'

export type SubscriptionInfo = {
  planType: string
  status: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

export function useSubscription() {
  const { user, isLoaded } = useUser()

  // Get subscription data from Clerk user unsafeMetadata (client-side accessible)
  const subscription: SubscriptionInfo | null = user?.unsafeMetadata?.subscription 
    ? (user.unsafeMetadata.subscription as SubscriptionInfo)
    : null

  // Check RevenueCat subscription from unsafeMetadata
  const revenueCatSubscription = user?.unsafeMetadata?.revenuecatSubscription as any
  const hasRevenueCatPro = revenueCatSubscription?.isPro && 
                          revenueCatSubscription?.status === 'active' &&
                          (!revenueCatSubscription?.expiresAt || 
                           new Date(revenueCatSubscription.expiresAt) > new Date())

  // Check Clerk Billing subscription from publicMetadata
  const hasClerkPro = user?.publicMetadata?.plan === 'pro'

  // Determine if user is Pro from any source
  const isPro = hasRevenueCatPro || hasClerkPro || subscription?.planType === 'pro'

  // Determine plan type and source
  const planType = hasRevenueCatPro || hasClerkPro ? 'pro' : (subscription?.planType || 'free')
  const status = hasRevenueCatPro || hasClerkPro ? 'active' : (subscription?.status || null)

  const finalSubscription: SubscriptionInfo | null = {
    planType,
    status,
    currentPeriodStart: subscription?.currentPeriodStart || null,
    currentPeriodEnd: (revenueCatSubscription?.expiresAt || subscription?.currentPeriodEnd || null) as string | null,
  }

  return { 
    loading: !isLoaded, 
    error: null, 
    subscription: finalSubscription, 
    isPro 
  }
}

