'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Subscription {
  id: string
  userId: string
  planType: string
  status: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  user: {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
  }
  createdAt: string
  updatedAt: string
}

interface SubscriptionsResponse {
  subscriptions: Subscription[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<SubscriptionsResponse['pagination'] | null>(null)
  const [filter, setFilter] = useState({ planType: '', status: '' })
  const router = useRouter()

  const fetchSubscriptions = async (currentPage = 1) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filter.planType && { planType: filter.planType }),
        ...(filter.status && { status: filter.status })
      })

      const response = await fetch(`/api/admin/subscriptions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          setError('Admin access required')
          return
        }
        throw new Error('Failed to fetch subscriptions')
      }

      const data = await response.json()
      if (data.success) {
        setSubscriptions(data.data.subscriptions)
        setPagination(data.data.pagination)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load subscriptions')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async (userId: string, subscriptionData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, subscriptionData })
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const data = await response.json()
      if (data.success) {
        await fetchSubscriptions(page)
        alert('Subscription updated successfully')
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to update subscription')
      console.error('Error:', err)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchSubscriptions(newPage)
  }

  const upgradeToProUntilEndOfYear = (userId: string) => {
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)
    updateSubscription(userId, {
      planType: 'pro',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: endOfYear.toISOString()
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Management</h1>
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/admin">Back to Dashboard</Link>
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
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <Button asChild variant="outline">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <select
                value={filter.planType}
                onChange={(e) => setFilter({ ...filter, planType: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setFilter({ planType: '', status: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Subscriptions ({pagination?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Plan</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Period</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{subscription.user.email}</div>
                          <div className="text-sm text-gray-500">
                            {subscription.user.name || 'No name'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            subscription.planType === 'pro'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscription.planType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            subscription.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : subscription.status === 'canceled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {subscription.status || 'unknown'}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                          <div>
                            <div>
                              From: {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                            </div>
                            <div>
                              To: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(subscription.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {subscription.planType !== 'pro' && (
                            <Button
                              size="sm"
                              onClick={() => upgradeToProUntilEndOfYear(subscription.userId)}
                            >
                              Upgrade to Pro
                            </Button>
                          )}
                          {subscription.planType === 'pro' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSubscription(subscription.userId, {
                                planType: 'free',
                                status: null,
                                currentPeriodStart: null,
                                currentPeriodEnd: null
                              })}
                            >
                              Downgrade
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === pagination.pages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}