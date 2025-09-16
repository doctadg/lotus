'use client'

import { useEffect, useState } from 'react'

export type SubscriptionInfo = {
  planType: string
  status: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

export function useSubscription() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/user/subscription')
        if (!res.ok) throw new Error('Failed to load subscription')
        const data = await res.json()
        if (mounted) setSubscription(data?.data?.subscription || null)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load subscription')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const isPro = subscription?.planType === 'pro' && subscription?.status === 'active'

  return { loading, error, subscription, isPro }
}

