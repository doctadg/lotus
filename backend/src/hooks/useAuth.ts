'use client'

import { useAuth as useClerkAuth, useUser, useSignIn, useSignUp, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const { isLoaded, userId, sessionId, signOut: clerkSignOut } = useClerkAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const { signIn, isLoaded: signInLoaded, setActive: signInSetActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded, setActive: signUpSetActive } = useSignUp()
  const clerk = useClerk()
  const router = useRouter()

  // Unified loading state
  const isLoading = !isLoaded || !userLoaded || !signInLoaded || !signUpLoaded

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await clerkSignOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even if signout fails
      router.push('/login')
    }
  }, [clerkSignOut, router])

  // Sign in function with proper error handling
  const signInWithEmail = useCallback(async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!signIn) {
      return { success: false, error: 'Sign in not available' }
    }

    try {
      // Create the sign in
      const result = await signIn.create({
        identifier: email,
        password,
      })

      // Handle successful sign in
      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId })
        // Don't redirect here, let the component handle it
        return { success: true }
      }

      // Handle additional authentication steps if needed
      if (result.status === 'needs_first_factor') {
        // This shouldn't happen with email/password, but handle it just in case
        return { 
          success: false, 
          error: 'Additional authentication required. Please contact support.' 
        }
      }

      return { 
        success: false, 
        error: 'Sign in incomplete. Please try again.' 
      }

    } catch (err: any) {
      console.error('Sign in error:', err)
      
      // Handle specific Clerk errors
      const errorCode = err.errors?.[0]?.code
      const errorMessage = err.errors?.[0]?.message || err.message

      // User-friendly error messages
      if (errorCode === 'form_identifier_not_found') {
        return { 
          success: false, 
          error: 'No account found with this email. Please sign up first.' 
        }
      }
      
      if (errorCode === 'form_password_incorrect') {
        return { 
          success: false, 
          error: 'Incorrect password. Please try again.' 
        }
      }

      if (errorCode === 'session_exists') {
        // User is already signed in
        return { success: true }
      }

      // Generic error message for other cases
      return { 
        success: false, 
        error: errorMessage || 'Sign in failed. Please try again.' 
      }
    }
  }, [signIn, clerk, router])

  // Sign up function with email verification
  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ 
    success: boolean; 
    needsVerification?: boolean;
    error?: string 
  }> => {
    if (!signUp) {
      return { success: false, error: 'Sign up not available' }
    }

    try {
      // Create the sign up
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name?.split(' ')[0],
        lastName: name?.split(' ').slice(1).join(' '),
      })

      // Handle successful sign up
      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId })
        // Don't redirect here, let the component handle it
        return { success: true }
      }

      // Handle email verification requirement
      if (result.status === 'missing_requirements' && 
          result.unverifiedFields?.includes('email_address')) {
        // Send verification email
        await signUp.prepareEmailAddressVerification({ 
          strategy: 'email_code' 
        })
        return { 
          success: true, 
          needsVerification: true 
        }
      }

      return { 
        success: false, 
        error: 'Sign up incomplete. Please try again.' 
      }

    } catch (err: any) {
      console.error('Sign up error:', err)
      
      const errorCode = err.errors?.[0]?.code
      const errorMessage = err.errors?.[0]?.message || err.message

      // User-friendly error messages
      if (errorCode === 'form_identifier_exists') {
        return { 
          success: false, 
          error: 'An account with this email already exists. Please sign in.' 
        }
      }

      if (errorCode === 'form_password_pwned') {
        return { 
          success: false, 
          error: 'This password has been found in a data breach. Please choose a stronger password.' 
        }
      }

      if (errorCode === 'form_param_format_invalid') {
        return { 
          success: false, 
          error: 'Please enter a valid email address.' 
        }
      }

      if (errorCode === 'form_password_length_too_short') {
        return { 
          success: false, 
          error: 'Password must be at least 8 characters long.' 
        }
      }

      return { 
        success: false, 
        error: errorMessage || 'Sign up failed. Please try again.' 
      }
    }
  }, [signUp, clerk, router])

  // Verify email with code
  const verifyEmail = useCallback(async (
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!signUp) {
      return { success: false, error: 'Verification not available' }
    }

    try {
      const result = await signUp.attemptEmailAddressVerification({ 
        code 
      })

      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId })
        // Don't redirect here, let the component handle it
        return { success: true }
      }

      return { 
        success: false, 
        error: 'Verification incomplete. Please try again.' 
      }

    } catch (err: any) {
      console.error('Verification error:', err)
      
      const errorMessage = err.errors?.[0]?.message || err.message

      if (errorMessage?.includes('invalid')) {
        return { 
          success: false, 
          error: 'Invalid verification code. Please check and try again.' 
        }
      }

      if (errorMessage?.includes('expired')) {
        return { 
          success: false, 
          error: 'Verification code expired. Please request a new one.' 
        }
      }

      return { 
        success: false, 
        error: errorMessage || 'Verification failed. Please try again.' 
      }
    }
  }, [signUp, clerk, router])

  // Resend verification email
  const resendVerificationEmail = useCallback(async (): Promise<{ 
    success: boolean; 
    error?: string 
  }> => {
    if (!signUp) {
      return { success: false, error: 'Cannot resend verification' }
    }

    try {
      await signUp.prepareEmailAddressVerification({ 
        strategy: 'email_code' 
      })
      return { success: true }
    } catch (err: any) {
      console.error('Resend verification error:', err)
      return { 
        success: false, 
        error: 'Failed to resend verification email. Please try again.' 
      }
    }
  }, [signUp])

  // OAuth sign in
  const signInWithOAuth = useCallback(async (
    provider: 'oauth_google' | 'oauth_github'
  ) => {
    if (!signIn) return

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/chat'
      })
    } catch (err: any) {
      console.error('OAuth error:', err)
      throw new Error(err.errors?.[0]?.message || 'OAuth sign in failed')
    }
  }, [signIn])

  return {
    // User state
    user: user ? {
      id: userId!,
      email: user.primaryEmailAddress?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
      imageUrl: user.imageUrl,
    } : null,
    isAuthenticated: !!userId,
    isLoading,
    sessionId,

    // Auth methods
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    verifyEmail,
    resendVerificationEmail,
  }
}