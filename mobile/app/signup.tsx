import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { useSignUp, useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { theme } from '../src/constants/theme'
import { LotusIcon } from '../src/components/Logo'
import { Button } from '../src/components/ui/Button'
import { Input } from '../src/components/ui/Input'
import { Feather } from '@expo/vector-icons'

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const { signUp, isLoaded, setActive } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  // Redirect to home if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/home')
    }
  }, [isSignedIn, router])

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
      setError(err.errors?.[0]?.message || 'Sign-up failed. Please try again.')
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
        console.log('Sign-up verification successful')
        // Activate session explicitly so isSignedIn flips to true
        await setActive({ session: completeSignUp.createdSessionId })
        // AuthContext will attach token provider once signed in
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
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setPendingVerification(false)}
              >
                <Feather name="arrow-left" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <LotusIcon size={60} color={theme.colors.text} />
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>We sent a verification code to {formData.email}</Text>
            </View>

            {/* Verification Form */}
            <View style={styles.form}>
              <Input
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={6}
              />

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
            <TouchableOpacity 
              style={styles.switchContainer}
              onPress={() => setPendingVerification(false)}
            >
              <Text style={styles.switchText}>
                Didn't receive the code? <Text style={styles.switchLink}>Go back</Text>
              </Text>
            </TouchableOpacity>
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
          {/* Header with Logo */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <LotusIcon size={60} color={theme.colors.text} />
            <Text style={styles.title}>Lotus</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="Username"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
            />

            <Input
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
            />

            <Input
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
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
              Sign Up
            </Button>
          </View>

          {/* Switch to Login */}
          <TouchableOpacity 
            style={styles.switchContainer}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl']
  },
  content: {
    width: '100%',
    maxWidth: theme.layout.maxWidth,
    alignSelf: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    paddingTop: theme.spacing.xl
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: theme.spacing.xl,
    padding: theme.spacing.md,
    zIndex: 1
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    letterSpacing: theme.typography.letterSpacing.tight
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center'
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
  switchContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl
  },
  switchText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center'
  },
  switchLink: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    textDecorationLine: 'underline'
  }
})
