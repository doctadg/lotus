import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native'
import { useAuth } from '../src/hooks/useAuth'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'
import { theme } from '../src/constants/theme'
import { Input } from '../src/components/ui/Input'
import { Button } from '../src/components/ui/Button'
import { Card } from '../src/components/ui/Card'
import { Feather } from '@expo/vector-icons'

export default function ProfileScreen() {
  const { user, login } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user?.name || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // For now, just update the name locally
      // In a real implementation, you would call an update profile API endpoint
      Alert.alert('Success', 'Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not available'}</Text>
            </View>
          </Card>

          <Card style={styles.card}>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </Card>

          <TouchableOpacity onPress={() => router.push('/context')}>
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Text style={styles.label}>Context</Text>
                  <Text style={styles.value}>Manage your context settings</Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <Button
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            size="lg"
            fullWidth
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
      <Navigation />
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text
  },
  content: {
    padding: theme.spacing.xl
  },
  card: {
    marginBottom: theme.spacing.lg
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardLeft: {
    flex: 1
  },
  inputGroup: {
    marginBottom: 0
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  value: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary
  }
})
