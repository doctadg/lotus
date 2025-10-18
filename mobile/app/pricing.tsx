import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '../src/contexts/AuthContext'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'
import { theme } from '../src/constants/theme'
import { Card } from '../src/components/ui/Card'
import { Button } from '../src/components/ui/Button'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { PricingTable } from '@clerk/clerk-expo/web'
import { isProUser } from '../src/lib/billing'
import { useAuth as useClerkAuth } from '@clerk/clerk-expo'
import { getOfferings, getPackagePrice, getPackagePeriod } from '../src/lib/revenuecat'
import type { PurchasesPackage } from 'react-native-purchases'

export default function PricingScreen() {
  const { user, isAuthenticated, isLoading: isAuthLoading, hasRevenueCatPro, isRevenueCatReady } = useAuth()
  const { has } = useClerkAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loadingOfferings, setLoadingOfferings] = useState(false)

  const isPro = hasRevenueCatPro || isProUser(has)

  // Load RevenueCat offerings for native platforms
  useEffect(() => {
    if (Platform.OS !== 'web' && isRevenueCatReady) {
      loadOfferings()
    }
  }, [isRevenueCatReady])

  const loadOfferings = async () => {
    try {
      setLoadingOfferings(true)
      const offering = await getOfferings()
      if (offering && offering.availablePackages) {
        setPackages(offering.availablePackages)
      }
    } catch (error) {
      console.error('Error loading offerings:', error)
    } finally {
      setLoadingOfferings(false)
    }
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      // For native platforms, navigate to native paywall
      router.push('/paywall')
    } catch (error) {
      console.error('Error opening paywall:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const features = {
    free: [
      '15 messages per hour',
      'Basic AI responses',
      'Memory storage',
      'Standard search',
    ],
    pro: [
      'Unlimited messages',
      'Deep research mode',
      'Enhanced memory extraction',
      'Image generation',
      'Priority support',
      'Advanced analytics',
    ],
  }

  // For web platform, use Clerk's PricingTable
  if (Platform.OS === 'web') {
    return (
      <AuthGuard>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pricing</Text>
          </View>

          <View style={styles.content}>
            <PricingTable />
          </View>
        </ScrollView>
        <Navigation />
      </AuthGuard>
    )
  }

  // For native platforms, show custom pricing UI
  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pricing</Text>
          <Text style={styles.headerSubtitle}>
            Choose the plan that works best for you
          </Text>
        </View>

        <View style={styles.content}>
          {/* Current Plan Indicator */}
          {isPro && (
            <Card style={styles.currentPlanBanner}>
              <View style={styles.currentPlanContent}>
                <Feather name="star" size={24} color={theme.colors.primary} />
                <View style={styles.currentPlanText}>
                  <Text style={styles.currentPlanTitle}>You're on Pro!</Text>
                  <Text style={styles.currentPlanDescription}>
                    Enjoying unlimited access to all features
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Free Plan */}
          <Card style={[styles.planCard, isPro && styles.inactivePlan]}>
            <View style={styles.planHeader}>
              <Feather name="package" size={28} color={theme.colors.textSecondary} />
              <Text style={styles.planName}>Free Plan</Text>
            </View>
            <Text style={styles.planPrice}>$0/month</Text>
            <Text style={styles.planDescription}>Perfect for getting started</Text>

            <View style={styles.featuresList}>
              {features.free.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Feather name="check" size={16} color={theme.colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Pro Plan */}
          {loadingOfferings ? (
            <Card style={styles.loadingCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading pricing...</Text>
            </Card>
          ) : (
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
                <Text style={[styles.planName, styles.proPlanName]}>Mror Pro</Text>
              </View>

              {packages.length > 0 ? (
                <>
                  <Text style={styles.proPlanPrice}>
                    {getPackagePrice(packages[0])}
                  </Text>
                  <Text style={[styles.planDescription, styles.proPlanDescription]}>
                    {getPackagePeriod(packages[0])}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.proPlanPrice}>$9.99/month</Text>
                  <Text style={[styles.planDescription, styles.proPlanDescription]}>
                    Starting at just $9.99 per month
                  </Text>
                </>
              )}

              <View style={styles.featuresList}>
                {features.pro.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Feather name="check" size={16} color={theme.colors.text} />
                    <Text style={[styles.featureText, styles.proFeatureText]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}

          {/* CTA Button */}
          {!isPro && (
            <Button
              onPress={handleUpgrade}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
              fullWidth
            >
              Upgrade to Pro
            </Button>
          )}

          {isPro && (
            <Button
              onPress={() => router.push('/subscription')}
              variant="outline"
              size="lg"
              fullWidth
            >
              Manage Subscription
            </Button>
          )}

          {/* Info Text */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Payment is processed through {Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store'}.
              You can manage or cancel your subscription anytime in your {Platform.OS === 'ios' ? 'iOS Settings' : 'Google Play'} account.
            </Text>
          </View>
        </View>
      </ScrollView>
      <Navigation />
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  content: {
    padding: theme.spacing.xl,
  },
  currentPlanBanner: {
    marginBottom: theme.spacing.xl,
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  currentPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  currentPlanText: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  currentPlanDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  planCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  inactivePlan: {
    opacity: 0.6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  planName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  proPlanName: {
    color: theme.colors.text,
  },
  planPrice: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  proPlanPrice: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  planDescription: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  proPlanDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  proPlanCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  proBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  proBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  featuresList: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  proFeatureText: {
    color: theme.colors.text,
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
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
  loadingCard: {
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
})
