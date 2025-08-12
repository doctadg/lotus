'use client'

import { useContext } from 'react'
import { AuthContext } from '@/lib/auth-context'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return {
    user: context.user,
    token: context.token,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated,
    signIn: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        context.login(data.data.token, data.data.user)
      } else {
        throw new Error(data.error || 'Login failed')
      }
    },
    signUp: async (email: string, password: string, name?: string) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        context.login(data.data.token, data.data.user)
      } else {
        throw new Error(data.error || 'Registration failed')
      }
    },
    signOut: context.logout,
  }
}