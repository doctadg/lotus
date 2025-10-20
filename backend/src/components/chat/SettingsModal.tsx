'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, User, CreditCard, Crown, Camera } from 'lucide-react'

interface Subscription {
  planType: string
  status: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, signOut } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadingPfp, setUploadingPfp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return

    // Load user data
    setName(user?.name || '')
    setEmail(user?.email || '')
    setProfilePicture(user?.imageUrl || null)

    // Load subscription data
    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.data.subscription)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      })

      if (response.ok) {
        setMessage('Profile updated successfully')
      } else {
        setMessage('Error updating profile')
      }
    } catch (error) {
      setMessage('Error updating profile')
      console.error('Error updating profile:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleProfilePictureUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setMessage('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage('Image size must be less than 5MB')
      return
    }

    setUploadingPfp(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/upload-profile-picture', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfilePicture(data.data.url)
        setMessage('Profile picture updated successfully')
      } else {
        setMessage('Error uploading profile picture')
      }
    } catch (error) {
      setMessage('Error uploading profile picture')
      console.error('Error uploading profile picture:', error)
    } finally {
      setUploadingPfp(false)
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

  const isProUser = subscription?.planType === 'pro' && subscription?.status === 'active'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
              <User className="w-5 h-5" />
              Profile Information
            </h3>
            
            {/* Profile Picture */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPfp}
                  className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 rounded-full border-2 border-black transition-colors disabled:opacity-50"
                  title="Change profile picture"
                >
                  {uploadingPfp ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleProfilePictureUpload(file)
                  }}
                />
              </div>
              <div>
                <p className="text-white font-medium">Profile Picture</p>
                <p className="text-white/60 text-sm">Upload a photo to personalize your profile</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/40"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  disabled={updating}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </div>

          {/* Subscription Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
              <CreditCard className="w-5 h-5" />
              Subscription
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-white">
                    {isProUser ? 'Pro Plan' : 'Free Plan'}
                  </div>
                  <div className="text-sm text-white/60">
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
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white"
                >
                  Upgrade to Pro - $5/month
                </Button>
              )}

              {isProUser && (
                <div className="text-sm text-white/60 space-y-3">
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
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Logout</h3>
                <p className="text-sm text-white/60">Sign out of your account</p>
              </div>
              <Button 
                onClick={signOut}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`text-center text-sm p-3 rounded-lg ${
              message.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}