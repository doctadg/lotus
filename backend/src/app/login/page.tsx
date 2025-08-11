'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()

  // Redirect to chat if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/chat')
    }
  }, [isAuthenticated, authLoading, router])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/lotus-white.png" 
            alt="Lotus" 
            className="h-12 w-auto mx-auto mb-4 animate-pulse"
          />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('Login successful, redirecting to chat...', data.data.user)
        
        // Use the auth context to login (this will store tokens and update state)
        login(data.data.token, data.data.user)
        
        // Small delay to ensure auth state updates before redirect
        setTimeout(() => {
          router.push('/chat')
        }, 100)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img 
              src="/lotus-white.png" 
              alt="Lotus" 
              className="h-12 w-auto mx-auto hover:opacity-90 transition-opacity"
            />
          </Link>
          <p className="mt-4 text-text-secondary">Welcome back</p>
        </div>

        {/* Login Form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent outline-none transition-all"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-accent-primary hover:text-accent-primary-hover font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Account */}
        <div className="mt-4 p-4 bg-accent-subtle border border-accent-border rounded-lg">
          <p className="text-xs text-text-secondary text-center">
            Try the demo: Use any email with password &quot;demo123&quot;
          </p>
        </div>
      </div>
    </div>
  )
}