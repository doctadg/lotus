'use client'

import { useEffect, useState, useRef } from 'react'

export type SubscriptionInfo = {
  planType: string
  status: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

// Global cache to prevent multiple fetches across component remounts
let subscriptionCache: SubscriptionInfo | null = null
let subscriptionFetched = false
let subscriptionFetchPromise: Promise<void> | null = null

export function useSubscription() {
  const [loading, setLoading] = useState(!subscriptionFetched)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(subscriptionCache)
  const hasFetched = useRef(false)

  useEffect(() => {
    // If already fetched globally, use cached data
    if (subscriptionFetched) {
      setSubscription(subscriptionCache)
      setLoading(false)
      return
    }

    // If already fetching, wait for that promise
    if (subscriptionFetchPromise) {
      subscriptionFetchPromise.then(() => {
        setSubscription(subscriptionCache)
        setLoading(false)
      })
      return
    }

    // Only fetch once per hook instance
    if (hasFetched.current) return
    hasFetched.current = true

    let mounted = true

    subscriptionFetchPromise = (async () => {
      try {
        const res = await fetch('/api/user/subscription')
        if (!res.ok) throw new Error('Failed to load subscription')
        const data = await res.json()
        subscriptionCache = data?.data?.subscription || null
        subscriptionFetched = true
        if (mounted) setSubscription(subscriptionCache)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load subscription')
      } finally {
        if (mounted) setLoading(false)
        subscriptionFetchPromise = null
      }
    })()

    return () => { mounted = false }
  }, [])

  const isPro = subscription?.planType === 'pro' && subscription?.status === 'active'

  return { loading, error, subscription, isPro }
}

