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

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      router.replace('/home')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
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
  }
})
