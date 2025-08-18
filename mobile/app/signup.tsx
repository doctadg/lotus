import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import { useAuth } from '../src/hooks/useAuth'
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
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async () => {
    // Validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await register(formData.email, formData.password, formData.name || undefined)
      router.replace('/home')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Signup failed. Please try again.')
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
              placeholder="Password"
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
