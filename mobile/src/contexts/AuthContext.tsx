import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react'
import { ClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo'
import Constants from 'expo-constants'
import { User } from '../types'
import {
  initializeRevenueCat,
  identifyUser as identifyRevenueCatUser,
  logoutUser as logoutRevenueCatUser,
  hasProSubscription,
  setupCustomerInfoListener,
} from '../lib/revenuecat'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  isAuthenticated: boolean
  isReady: boolean  // New: indicates auth and token provider are fully ready
  // Clerk methods exposed
  getToken: () => Promise<string | null>
  // RevenueCat subscription status
  hasRevenueCatPro: boolean
  refreshSubscriptionStatus: () => Promise<void>
  // RevenueCat initialization status
  isRevenueCatReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Inner Auth Provider that uses Clerk hooks
function InnerAuthProvider({ children, isRevenueCatReady }: { children: ReactNode; isRevenueCatReady: boolean }) {
  const { getToken, signOut, isSignedIn, isLoaded } = useClerkAuth()
  const { user: clerkUser } = useUser()
  const [isTokenProviderReady, setIsTokenProviderReady] = useState(false)
  const [hasRevenueCatPro, setHasRevenueCatPro] = useState(false)

  // Create user object compatible with existing app from Clerk user
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || '',
    role: 'user'
  } : null

  // Set up API service token provider when auth state changes
  useEffect(() => {
    const setupApiTokenProvider = async () => {
      try {
        const { apiService } = await import('../lib/api')
        const clerkJwtTemplate = Constants.expoConfig?.extra?.clerkJwtTemplate as string | undefined
        if (__DEV__) {
          console.log('Auth state changed:', { isSignedIn, isLoaded })
        }

        if (isLoaded) {
          if (isSignedIn) {
            if (__DEV__) console.log('Setting up API token provider - user is signed in')
            // Wrap getToken to allow optional JWT template configuration
            apiService.setTokenProvider(() => getToken(clerkJwtTemplate ? { template: clerkJwtTemplate } : undefined))
          } else {
            if (__DEV__) console.log('Removing API token provider - user not signed in')
            apiService.removeTokenProvider()
          }
          // Mark as ready after token provider is set/removed
          setIsTokenProviderReady(true)
        } else {
          if (__DEV__) console.log('Clerk not loaded yet, keeping current state')
          setIsTokenProviderReady(false)
        }
      } catch (error) {
        console.error('Error setting up API token provider:', error)
        setIsTokenProviderReady(false)
      }
    }

    setupApiTokenProvider()
  }, [isSignedIn, isLoaded, getToken])

  // Initialize RevenueCat when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const setupRevenueCat = async () => {
        try {
          // Identify user in RevenueCat
          await identifyRevenueCatUser(clerkUser.id)

          // Check initial subscription status
          const isPro = await hasProSubscription()
          setHasRevenueCatPro(isPro)

          if (__DEV__) {
            console.log('RevenueCat user identified, Pro status:', isPro)
          }

          // Sync subscription with backend on startup
          // This handles cases where webhooks may have failed
          if (isPro) {
            const { syncSubscriptionWithBackend } = await import('../lib/revenuecat')
            await syncSubscriptionWithBackend()
          }
        } catch (error) {
          console.error('Error setting up RevenueCat:', error)
        }
      }

      setupRevenueCat()
    }
  }, [isLoaded, isSignedIn, clerkUser])

  // Listen for subscription changes
  useEffect(() => {
    const removeListener = setupCustomerInfoListener((customerInfo) => {
      const isPro = 'pro' in customerInfo.entitlements.active
      setHasRevenueCatPro(isPro)

      if (__DEV__) {
        console.log('RevenueCat subscription updated, Pro status:', isPro)
      }
    })

    return () => {
      // Safely call removeListener
      if (typeof removeListener === 'function') {
        try {
          removeListener()
        } catch (error) {
          if (__DEV__) {
            console.warn('⚠️ Failed to remove RevenueCat listener:', error)
          }
        }
      }
    }
  }, [])

  const refreshSubscriptionStatus = async () => {
    try {
      console.log('🔄 Refreshing subscription status from RevenueCat...')
      const isPro = await hasProSubscription()
      console.log('📊 Subscription check result:', { isPro })
      setHasRevenueCatPro(isPro)
      console.log('✅ hasRevenueCatPro state updated to:', isPro)
    } catch (error) {
      console.error('❌ Error refreshing subscription status:', error)
    }
  }

  const logout = async () => {
    try {
      setIsTokenProviderReady(false)
      setHasRevenueCatPro(false)

      // Logout from RevenueCat
      await logoutRevenueCatUser()

      // Logout from Clerk
      await signOut()
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }

  const value = {
    user,
    isLoading: !isLoaded,
    logout,
    isAuthenticated: isSignedIn,
    isReady: isLoaded && isTokenProviderReady,
    getToken,
    hasRevenueCatPro,
    refreshSubscriptionStatus,
    isRevenueCatReady,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey
  const telemetryDisabled = Constants.expoConfig?.extra?.clerkTelemetryDisabled
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false)

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key. Please add it to your app configuration.')
  }

  // Initialize RevenueCat on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔧 AuthProvider: Starting RevenueCat initialization...')
        await initializeRevenueCat()
        console.log('✅ AuthProvider: RevenueCat initialization complete')
        setIsRevenueCatReady(true)
      } catch (error) {
        console.error('❌ AuthProvider: Failed to initialize RevenueCat:', error)
        setIsRevenueCatReady(false)
      }
    }
    initialize()
  }, [])

  // Persist Clerk session securely on device (if expo-secure-store is available)
  let tokenCache: { getToken: (key: string) => Promise<string | null>; saveToken: (key: string, value: string) => Promise<void> } | undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store') as any
    const getItemAsync = SecureStore?.getItemAsync
    const setItemAsync = SecureStore?.setItemAsync
    if (typeof getItemAsync === 'function' && typeof setItemAsync === 'function') {
      tokenCache = {
        getToken: (key: string) => getItemAsync(key),
        saveToken: (key: string, value: string) => setItemAsync(key, value)
      }
    } else {
      tokenCache = undefined
    }
  } catch {
    // If unavailable, Clerk will fallback to in-memory storage
    tokenCache = undefined
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      telemetry={telemetryDisabled ? { disabled: true } : undefined}
    >
      <InnerAuthProvider isRevenueCatReady={isRevenueCatReady}>
        {children}
      </InnerAuthProvider>
    </ClerkProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
