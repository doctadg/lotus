import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { ClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo'
import Constants from 'expo-constants'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  isAuthenticated: boolean
  // Clerk methods exposed
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Inner Auth Provider that uses Clerk hooks
function InnerAuthProvider({ children }: { children: ReactNode }) {
  const { getToken, signOut, isSignedIn, isLoaded } = useClerkAuth()
  const { user: clerkUser } = useUser()

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
        } else {
          if (__DEV__) console.log('Clerk not loaded yet, keeping current state')
        }
      } catch (error) {
        console.error('Error setting up API token provider:', error)
      }
    }

    setupApiTokenProvider()
  }, [isSignedIn, isLoaded, getToken])

  const logout = async () => {
    try {
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
    getToken
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

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key. Please add it to your app configuration.')
  }

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
      <InnerAuthProvider>
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
