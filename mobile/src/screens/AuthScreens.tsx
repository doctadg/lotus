import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { SignInWithOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo'
import { useAuth } from '../contexts/AuthContext'
import { theme } from '../constants/theme'
import { LotusIcon } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, isLoaded } = useSignIn()

  const handleSubmit = async () => {
    if (!isLoaded) return

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password
      })

      if (result.status === 'complete') {
        // Sign-in successful - the AuthContext will handle the rest
        console.log('Sign-in successful')
      } else {
        setError('Sign-in incomplete. Please check your credentials.')
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(err.errors?.[0]?.message || 'Sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (strategy: 'oauth_google' | 'oauth_github') => {
    try {
      setIsLoading(true)
      setError('')
      
      // This will redirect to OAuth provider
      await signIn?.authenticateWithRedirect({
        strategy,
        redirectUrl: 'lotus://oauth-callback', // Deep link for your app
        redirectUrlComplete: 'lotus://oauth-complete'
      })
    } catch (err: any) {
      console.error('OAuth error:', err)
      setError('OAuth sign-in failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Lotus Chat</Text>
          </View>
          
          {/* Logo and Form Container */}
          <View style={styles.formContainer}>
            {/* Form */}
            <View style={styles.form}>
              <Input
                placeholder="Username or Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                placeholder="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                size="lg"
                fullWidth
              >
                Log In
              </Button>

              {/* OAuth Sign In Options */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                onPress={() => handleOAuthSignIn('oauth_google')}
                loading={isLoading}
                disabled={isLoading}
                size="lg"
                fullWidth
                variant="secondary"
                style={{ marginBottom: 12 }}
              >
                Continue with Google
              </Button>

              <Button
                onPress={() => handleOAuthSignIn('oauth_github')}
                loading={isLoading}
                disabled={isLoading}
                size="lg"
                fullWidth
                variant="secondary"
              >
                Continue with GitHub
              </Button>
            </View>
          </View>
        </View>
        
        {/* Bottom Image/Branding */}
        <View style={styles.bottomSection}>
          <LotusIcon size={120} color={theme.colors.text} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const { signUp, isLoaded, setActive } = useSignUp()

  const handleSubmit = async () => {
    if (!isLoaded) return

    // Validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.name.split(' ')[0] || '',
        lastName: formData.name.split(' ').slice(1).join(' ') || undefined
      })

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      console.error('Sign-up error:', err)
      setError(err.errors?.[0]?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!isLoaded) return

    setError('')
    setIsLoading(true)

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        // User is now signed up and signed in
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.errors?.[0]?.message || 'Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>We sent a verification code to {formData.email}</Text>
            </View>

            {/* Verification Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <Input
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={6}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                onPress={handleVerifyCode}
                loading={isLoading}
                disabled={isLoading || code.length < 6}
                size="lg"
                fullWidth
              >
                Verify Email
              </Button>
            </View>

            {/* Back to Registration */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                Didn't receive the code?{' '}
                <TouchableOpacity onPress={() => setPendingVerification(false)}>
                  <Text style={styles.switchLink}>Go back</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Join Lotus</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name (Optional)</Text>
              <Input
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <Input
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Input
                placeholder="Enter your password (min 8 characters)"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <Input
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
              fullWidth
            >
              Create Account
            </Button>
          </View>

          {/* Switch to Login */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.switchLink}>Sign in</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between'
  },
  content: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing['5xl'],
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.xl
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    letterSpacing: theme.typography.letterSpacing.tight
  },
  formContainer: {
    width: '100%',
    maxWidth: theme.layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xs
  },
  form: {
    marginBottom: theme.spacing['2xl']
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center'
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: theme.spacing['3xl'],
    opacity: 0.3
  },
  // Register screen specific styles
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    height: 50
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  switchContainer: {
    alignItems: 'center'
  },
  switchText: {
    color: '#999',
    fontSize: 14
  },
  switchLink: {
    color: '#3b82f6',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  // Divider styles for OAuth section
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border || '#333'
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textSecondary || '#999',
    fontSize: theme.typography.fontSize.sm
  }
})
