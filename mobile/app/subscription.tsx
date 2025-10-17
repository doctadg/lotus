import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '../src/contexts/AuthContext'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'
import { theme } from '../src/constants/theme'
import { Card } from '../src/components/ui/Card'
import { Button } from '../src/components/ui/Button'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth as useClerkAuth } from '@clerk/clerk-expo'
import { isProUser, getPlanFeatures, getFeatureDisplayName } from '../src/lib/billing'
import {
  getCustomerInfo,
  manageSubscription,
  restorePurchases,
  getSubscriptionExpiration,
  willRenew,
  getSubscriptionPlatform,
  isCustomerInfoPro,
} from '../src/lib/revenuecat'
import type { CustomerInfo } from 'react-native-purchases'

export default function SubscriptionScreen() {
  const { user, isAuthenticated, isLoading: isAuthLoading, hasRevenueCatPro, refreshSubscriptionStatus, isRevenueCatReady } = useAuth()
  const { has } = useClerkAuth()
  const router = useRouter()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoring, setIsRestoring] = useState(false)
  const isPro = hasRevenueCatPro || isProUser(has)

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && isRevenueCatReady) {
      loadSubscription()
    }
  }, [isAuthLoading, isAuthenticated, isRevenueCatReady])

  useEffect(() => {
    // Refresh when coming back to this screen
    const unsubscribe = router.addListener('focus', () => {
      loadSubscription()
    })

    return unsubscribe
  }, [])

  const loadSubscription = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Get RevenueCat customer info
      const info = await getCustomerInfo()
      setCustomerInfo(info)

      // Refresh subscription status in auth context
      await refreshSubscriptionStatus()
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) return

    // Navigate to native paywall screen
    router.push('/paywall')
  }

  const handleManageBilling = async () => {
    try {
      if (!hasRevenueCatPro) {
        // If not subscribed via RevenueCat, open web billing
        if (Platform.OS === 'web') {
          router.push('/settings')
        } else {
          const url = 'https://lotus-backend.vercel.app/settings'
          await Linking.openURL(url)
        }
      } else {
        // Open native subscription management
        await manageSubscription()
      }
    } catch (error) {
      console.error('Error opening subscription management:', error)
      Alert.alert('Error', 'Unable to open subscription management. Please try again.')
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)

    try {
      const { customerInfo: restoredInfo, error } = await restorePurchases()

      if (error) {
        Alert.alert('Restore Failed', error.message || 'Unable to restore purchases.')
        return
      }

      if (restoredInfo) {
        setCustomerInfo(restoredInfo)
        await refreshSubscriptionStatus()

        const hasPro = isCustomerInfoPro(restoredInfo)

        if (hasPro) {
          Alert.alert('Success', 'Your purchases have been restored!')
        } else {
          Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.")
        }
      }
    } catch (error: any) {
      console.error('Restore error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsRestoring(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </AuthGuard>
    )
  }

  const expirationDate = getSubscriptionExpiration(customerInfo)
  const willAutoRenew = willRenew(customerInfo)
  const platform = getSubscriptionPlatform(customerInfo)

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subscription</Text>
        </View>

        <View style={styles.content}>
          {/* Current Plan */}
          <Card style={styles.currentPlanCard}>
            <View style={styles.planHeader}>
              {isPro ? (
                <Feather name="star" size={24} color={theme.colors.primary} />
              ) : (
                <Feather name="package" size={24} color={theme.colors.textSecondary} />
              )}
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
            </View>
            <Text style={styles.currentPlanName}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </Text>
            <Text style={styles.planDescription}>
              {isPro
                ? 'Unlimited access to all Lotus AI features'
                : 'Basic access to Lotus AI features'}
            </Text>

            {isPro && (
              <>
                <View style={styles.featuresList}>
                  {getPlanFeatures('pro').map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Feather name="check" size={14} color={theme.colors.success} />
                      <Text style={styles.featureText}>
                        {getFeatureDisplayName(feature)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Subscription Details */}
                {hasRevenueCatPro && expirationDate && (
                  <View style={styles.subscriptionDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Platform</Text>
                      <Text style={styles.detailValue}>{platform || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={[styles.detailValue, styles.activeStatus]}>
                        {willAutoRenew ? 'Active (Auto-renewing)' : 'Active (Expires)'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>
                        {willAutoRenew ? 'Renews' : 'Expires'}
                      </Text>
                      <Text style={styles.detailValue}>
                        {expirationDate.toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </Card>

          {/* Pro Plan */}
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proPlanCard}
          >
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>RECOMMENDED</Text>
            </View>
            <View style={styles.planHeader}>
              <Feather name="star" size={28} color={theme.colors.text} />
              <Text style={styles.proPlanName}>Lotus Pro</Text>
            </View>
            <Text style={styles.proPlanPrice}>$9.99/month</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Feather name="check" size={16} color={theme.colors.text} />
                <Text style={styles.featureText}>Advanced AI capabilities</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check" size={16} color={theme.colors.text} />
                <Text style={styles.featureText}>Priority support</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check" size={16} color={theme.colors.text} />
                <Text style={styles.featureText}>Unlimited memories</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check" size={16} color={theme.colors.text} />
                <Text style={styles.featureText}>Deep research mode</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check" size={16} color={theme.colors.text} />
                <Text style={styles.featureText}>Custom AI training</Text>
              </View>
            </View>
          </LinearGradient>

          {!isPro && (
            <Button
              onPress={handleSubscribe}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
              fullWidth
            >
              Upgrade to Pro
            </Button>
          )}

          {isPro && (
            <View style={{ gap: theme.spacing.md }}>
              <Button
                onPress={handleManageBilling}
                variant="outline"
                size="lg"
                fullWidth
              >
                <Feather name="settings" size={16} color={theme.colors.text} />
                <Text> Manage Subscription</Text>
              </Button>

              {!hasRevenueCatPro && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    You're subscribed via web. Manage through your Clerk account.
                  </Text>
                </View>
              )}

              {hasRevenueCatPro && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Manage your subscription through {Platform.OS === 'ios' ? 'iOS Settings' : 'Google Play'}.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Restore Purchases Button */}
          {!isPro && (
            <TouchableOpacity
              onPress={handleRestore}
              disabled={isRestoring}
              style={styles.restoreButton}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              ) : (
                <>
                  <Feather name="refresh-cw" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.restoreButtonText}>Restore Purchases</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  currentPlanCard: {
    marginBottom: theme.spacing.xl
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  currentPlanLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.letterSpacing.wide
  },
  currentPlanName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  planDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal
  },
  proPlanCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    position: 'relative',
    overflow: 'hidden'
  },
  proBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  proBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    letterSpacing: theme.typography.letterSpacing.wide
  },
  proPlanName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text
  },
  proPlanPrice: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl
  },
  featuresList: {
    gap: theme.spacing.md
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md
  },
  featureText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1
  },
  infoBox: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionDetails: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  activeStatus: {
    color: theme.colors.success,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  restoreButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
})
