import React, { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Redirect } from 'expo-router'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  // If still loading auth state, show nothing
  if (isLoading) {
    return null
  }

  // If not authenticated, redirect to signup
  if (!isAuthenticated) {
    return <Redirect href="/signup" />
  }

  // If authenticated, show the protected content
  return <>{children}</>
}
