import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  hasProSubscription,
  purchasePackage,
  restorePurchases as rcRestorePurchases,
  getOfferings,
  setupCustomerInfoListener,
  isRevenueCatConfigured,
  syncSubscriptionWithBackend,
} from '../lib/revenuecat'

type SubscriptionContextType = {
  isPro: boolean
  loading: boolean
  error: string | null
  purchasePro: () => Promise<void>
  restorePurchases: () => Promise<void>
  refreshStatus: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to refresh subscription status
  const refreshStatus = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      console.warn('⚠️ RevenueCat not configured yet, skipping status refresh')
      return
    }

    try {
      console.log('🔄 Refreshing subscription status from RevenueCat...')
      const hasPro = await hasProSubscription()
      setIsPro(hasPro)
      console.log('✅ Subscription status refreshed:', hasPro ? 'Pro' : 'Free')
    } catch (e: any) {
      console.error('❌ Failed to refresh subscription status:', e)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let removeListener: (() => void) | null = null

    async function initSubscription() {
      try {
        // Wait for RevenueCat to be configured
        let attempts = 0
        while (!isRevenueCatConfigured() && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!isRevenueCatConfigured()) {
          throw new Error('RevenueCat initialization timed out')
        }

        // Fetch initial customer info
        const hasPro = await hasProSubscription()
        if (mounted) setIsPro(hasPro)

        // Setup listener for subscription updates
        removeListener = setupCustomerInfoListener(async (customerInfo) => {
          const activeNow = customerInfo?.entitlements?.active?.Pro !== undefined
          if (mounted) setIsPro(activeNow)

          // Sync with backend when subscription changes
          await syncSubscriptionWithBackend()
        })
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || 'Subscription init failed')
          console.error('❌ Subscription context initialization failed:', e)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initSubscription()

    return () => {
      mounted = false
      if (removeListener) {
        removeListener()
      }
    }
  }, [])

  const purchasePro = useCallback(async () => {
    setError(null)
    try {
      const offering = await getOfferings()
      if (!offering) {
        throw new Error('No available offerings')
      }

      // Prefer a package with identifier 'pro_monthly' or first available
      const pkg = offering.availablePackages?.find((p: any) =>
        p.identifier === 'pro_monthly' || p.identifier === '$rc_monthly'
      ) || offering.availablePackages?.[0]

      if (!pkg) {
        throw new Error('No available subscription package')
      }

      const { customerInfo, error } = await purchasePackage(pkg)

      if (error) {
        throw error
      }

      // Refresh subscription status after purchase
      await refreshStatus()
    } catch (e: any) {
      // User cancellations should not be treated as errors
      if (e?.userCancelled) return
      setError(e?.message || 'Purchase failed')
      throw e
    }
  }, [refreshStatus])

  const restorePurchases = useCallback(async () => {
    setError(null)
    try {
      const { customerInfo, error } = await rcRestorePurchases()

      if (error) {
        throw error
      }

      // Refresh subscription status after restore
      await refreshStatus()
    } catch (e: any) {
      setError(e?.message || 'Restore failed')
      throw e
    }
  }, [refreshStatus])

  const value = useMemo(
    () => ({ isPro, loading, error, purchasePro, restorePurchases, refreshStatus }),
    [isPro, loading, error, purchasePro, restorePurchases, refreshStatus]
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}

