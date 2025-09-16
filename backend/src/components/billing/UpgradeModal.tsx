'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onClose: () => void
}

export default function UpgradeModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const startCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start checkout')
      const data = await res.json()
      const url = data?.data?.url
      if (url) window.location.href = url
      else throw new Error('No checkout URL returned')
    } catch (e: any) {
      setError(e?.message || 'Unable to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0b0c0f] p-6 text-white shadow-xl">
        <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
        <p className="text-sm text-white/70 mb-4">
          Unlock unlimited messages, Deep Research, and image generation.
        </p>
        <ul className="text-sm text-white/80 space-y-2 mb-5 list-disc pl-5">
          <li>Unlimited messages</li>
          <li>Deep Research mode</li>
          <li>Unlimited image generation</li>
          <li>Priority features and support</li>
        </ul>
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            Not now
          </Button>
          <Button onClick={startCheckout} disabled={loading} className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 flex-1">
            {loading ? 'Starting…' : 'Upgrade – $5/month'}
          </Button>
        </div>
      </div>
    </div>
  )
}

