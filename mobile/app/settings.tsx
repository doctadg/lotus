import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch
} from 'react-native'
import { useAuth } from '../src/hooks/useAuth'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'
import { theme } from '../src/constants/theme'
import { Card } from '../src/components/ui/Card'
import { Feather } from '@expo/vector-icons'

export default function SettingsScreen() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [darkMode, setDarkMode] = React.useState(true)

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout()
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to logout')
            }
          }
        }
      ]
    )
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Feather name="mail" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Email</Text>
              </View>
              <Text style={styles.settingValue}>{user?.email || 'Not available'}</Text>
            </View>
            <View style={[styles.settingItem, styles.settingItemLast]}>
              <View style={styles.settingLeft}>
                <Feather name="user" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Name</Text>
              </View>
              <Text style={styles.settingValue}>{user?.name || 'Not set'}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card>
            <View style={[styles.settingItem, styles.settingItemLast]}>
              <View style={styles.settingLeft}>
                <Feather name="moon" size={20} color={theme.colors.text} />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                thumbColor={theme.colors.text}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <TouchableOpacity onPress={() => router.push('/subscription')}>
            <Card>
              <View style={[styles.settingItem, styles.settingItemLast]}>
                <View style={styles.settingLeft}>
                  <Feather name="star" size={20} color={theme.colors.accent} />
                  <Text style={styles.settingLabel}>Current Plan</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>Free</Text>
                  <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout}>
            <Card style={styles.dangerCard}>
              <View style={[styles.settingItem, styles.settingItemLast]}>
                <View style={styles.settingLeft}>
                  <Feather name="log-out" size={20} color={theme.colors.error} />
                  <Text style={[styles.settingLabel, styles.logoutLabel]}>Logout</Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.colors.error} />
              </View>
            </Card>
          </TouchableOpacity>
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
  section: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.letterSpacing.wide
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  settingItemLast: {
    borderBottomWidth: 0
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text
  },
  settingValue: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary
  },
  logoutLabel: {
    color: theme.colors.error
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: theme.colors.error + '20'
  }
})
