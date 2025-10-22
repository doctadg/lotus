'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { LogOut, User, CreditCard, Crown } from 'lucide-react'

interface Subscription {
  planType: string
  status: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { subscription, loading } = useSubscription()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Load user data
    setName(user?.name || '')
    setEmail(user?.email || '')
  }, [user, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')

    try {
      // In a real implementation, you would update the user profile via an API call
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('Profile updated successfully')
    } catch (error) {
      setMessage('Error updating profile')
      console.error('Error updating profile:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe checkout
        const url = data?.data?.url
        if (url) {
          window.location.href = url
        } else {
          setMessage('Unable to start checkout. Please try again.')
        }
      } else {
        setMessage('Error creating checkout session')
      }
    } catch (error) {
      setMessage('Error creating checkout session')
      console.error('Error creating checkout session:', error)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        const url = data?.data?.url
        if (url) window.location.href = url
      }
    } catch (e) {
      console.error('Error opening billing portal:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const isProUser = subscription?.planType === 'pro' && subscription?.status === 'active'

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button 
            onClick={() => router.push('/chat')}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Back to Chat
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <Card className="lg:col-span-2 bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    type="submit"
                    disabled={updating}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {updating ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
                {message && (
                  <div className="text-center text-sm text-green-400">
                    {message}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium">
                    {isProUser ? 'Pro Plan' : 'Free Plan'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isProUser ? 'Unlimited messages, deep research' : '15 messages per hour'}
                  </div>
                </div>
                {isProUser ? (
                  <Crown className="w-6 h-6 text-yellow-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                )}
              </div>

              {!isProUser && (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                >
                  Upgrade to Pro - $5/month
                </Button>
              )}

              {isProUser && (
                <div className="text-sm text-gray-400 space-y-3">
                  <div>
                    <p className="mb-2">Thank you for supporting Lotus!</p>
                    <p>Status: {subscription?.status}</p>
                    {subscription?.currentPeriodEnd && (
                      <p>Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Button onClick={handleManageBilling} className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Manage Billing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Logout Section */}
        <Card className="mt-6 bg-white/5 border-white/10">
          <CardContent className="flex justify-between items-center p-6">
            <div>
              <h3 className="font-medium">Logout</h3>
              <p className="text-sm text-gray-400">Sign out of your account</p>
            </div>
            <Button 
              onClick={signOut}
              variant="outline"
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
