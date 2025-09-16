import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'

type SubscriptionContextType = {
  isPro: boolean
  loading: boolean
  error: string | null
  purchasePro: () => Promise<void>
  restorePurchases: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Dynamically import so the app still runs if module not installed yet
        const Purchases = (await import('react-native-purchases')).default

        // Configure with platform keys through the config plugin at build time
        // No API key here; plugin injects keys into native projects
        await Purchases.setLogLevel('WARN')

        // Identify user if desired (we can set app user id to Clerk id elsewhere if needed)
        // Here we rely on anonymous unless you later call Purchases.logIn(userId)

        // Fetch current customer info
        const info = await Purchases.getCustomerInfo()
        const active = !!info?.entitlements?.active?.pro
        if (mounted) setIsPro(active)

        // Listen for updates
        const remove = Purchases.addCustomerInfoUpdateListener((ci: any) => {
          const activeNow = !!ci?.entitlements?.active?.pro
          setIsPro(activeNow)
        })
        return () => { remove && remove() }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Subscription init failed')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const purchasePro = useCallback(async () => {
    setError(null)
    try {
      const Purchases = (await import('react-native-purchases')).default
      const offerings = await Purchases.getOfferings()
      const current = offerings?.current
      if (!current) throw new Error('No available offerings')

      // Prefer a package with identifier 'pro_monthly' or first available
      const pkg = current.availablePackages?.find((p: any) => p.identifier === 'pro_monthly')
        || current.availablePackages?.[0]
      if (!pkg) throw new Error('No available subscription package')

      await Purchases.purchasePackage(pkg)
      const info = await Purchases.getCustomerInfo()
      setIsPro(!!info?.entitlements?.active?.pro)
    } catch (e: any) {
      // User cancellations should not be treated as errors
      if (e?.userCancelled) return
      setError(e?.message || 'Purchase failed')
      throw e
    }
  }, [])

  const restorePurchases = useCallback(async () => {
    setError(null)
    try {
      const Purchases = (await import('react-native-purchases')).default
      await Purchases.restorePurchases()
      const info = await Purchases.getCustomerInfo()
      setIsPro(!!info?.entitlements?.active?.pro)
    } catch (e: any) {
      setError(e?.message || 'Restore failed')
      throw e
    }
  }, [])

  const value = useMemo(() => ({ isPro, loading, error, purchasePro, restorePurchases }), [isPro, loading, error, purchasePro, restorePurchases])

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

