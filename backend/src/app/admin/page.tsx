'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AdminStats {
  users: {
    total: number
    admins: number
    regular: number
    active: number
    recent: number
    growth: Array<{ date: string; count: number }>
  }
  subscriptions: {
    free: number
    pro: number
    distribution: Array<{ planType: string; status: string; _count: number }>
  }
  content: {
    chats: number
    messages: number
    memories: number
  }
  usage: {
    messageUsage: Array<{ hour: Date; _sum: { count: number } }>
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 403) {
            setError('Admin access required')
            return
          }
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError('Failed to load admin dashboard')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/chat">Back to Chat</Link>
            </Button>
          </div>
        </div>

        {stats && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <span className="text-2xl">👥</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.total}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.users.recent} in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
                  <span className="text-2xl">💎</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.subscriptions.pro}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.subscriptions.pro / stats.users.total) * 100).toFixed(1)}% conversion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <span className="text-2xl">⚡</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.active}</div>
                  <p className="text-xs text-muted-foreground">
                    Active in last 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <span className="text-2xl">💬</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.content.messages}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {stats.content.chats} chats
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/admin/users">View All Users</Link>
                  </Button>
                  <div className="text-sm text-gray-600">
                    <p>• {stats.users.admins} admin users</p>
                    <p>• {stats.users.regular} regular users</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Free Plan:</span>
                      <span className="font-semibold">{stats.subscriptions.free}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pro Plan:</span>
                      <span className="font-semibold">{stats.subscriptions.pro}</span>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/subscriptions">Manage Subscriptions</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Chats:</span>
                    <span className="font-semibold">{stats.content.chats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span className="font-semibold">{stats.content.messages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memories:</span>
                    <span className="font-semibold">{stats.content.memories}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}