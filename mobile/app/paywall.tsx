import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
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
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getPackagePrice,
  getPackagePeriod,
} from '../src/lib/revenuecat'
import type { PurchasesPackage } from 'react-native-purchases'

export default function PaywallScreen() {
  const { user, hasRevenueCatPro, refreshSubscriptionStatus, isRevenueCatReady } = useAuth()
  const router = useRouter()
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    // Only load offerings when RevenueCat is ready
    if (isRevenueCatReady) {
      loadOfferings()
    }
  }, [isRevenueCatReady])

  // Log Pro status changes
  useEffect(() => {
    console.log('🎯 Paywall: hasRevenueCatPro changed to:', hasRevenueCatPro)
  }, [hasRevenueCatPro])

  const loadOfferings = async () => {
    try {
      setIsLoading(true)
      const offering = await getOfferings()

      if (offering && offering.availablePackages) {
        setPackages(offering.availablePackages)
      } else {
        Alert.alert(
          'No Offerings Available',
          'Unable to load subscription options. Please try again later.'
        )
      }
    } catch (error) {
      console.error('Error loading offerings:', error)
      Alert.alert('Error', 'Failed to load subscription options.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsPurchasing(true)

    try {
      console.log('🛒 Starting purchase for package:', pkg.identifier)
      const { customerInfo, error } = await purchasePackage(pkg)

      if (error) {
        console.error('❌ Purchase failed:', error)
        Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase.')
        return
      }

      if (customerInfo) {
        console.log('✅ Purchase successful! Customer info:', {
          originalAppUserId: customerInfo.originalAppUserId,
          activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
          entitlements: Object.keys(customerInfo.entitlements.active),
          hasPro: 'pro' in customerInfo.entitlements.active,
        })

        // Refresh subscription status
        console.log('🔄 Refreshing subscription status...')
        await refreshSubscriptionStatus()
        console.log('✅ Subscription status refreshed')

        Alert.alert(
          'Welcome to Pro! 🎉',
          'Your subscription is now active and synced across all devices. Enjoy unlimited access to all features!',
          [
            {
              text: 'Get Started',
              onPress: () => router.push('/home'),
            },
          ]
        )
      }
    } catch (error: any) {
      console.error('❌ Purchase error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleRestore = async () => {
    setIsRestoring(true)

    try {
      const { customerInfo, error } = await restorePurchases()

      if (error) {
        Alert.alert('Restore Failed', error.message || 'Unable to restore purchases.')
        return
      }

      if (customerInfo) {
        await refreshSubscriptionStatus()

        const hasPro = 'pro' in customerInfo.entitlements.active

        if (hasPro) {
          Alert.alert(
            'Purchases Restored! 🎉',
            'Your Pro subscription has been restored and synced.',
            [
              {
                text: 'Continue',
                onPress: () => router.push('/home'),
              },
            ]
          )
        } else {
          Alert.alert(
            'No Purchases Found',
            "We couldn't find any previous purchases to restore."
          )
        }
      }
    } catch (error: any) {
      console.error('Restore error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsRestoring(false)
    }
  }

  const features = [
    { icon: 'message-circle', title: 'Unlimited Messages', description: 'Chat as much as you want' },
    { icon: 'zap', title: 'Deep Research Mode', description: 'Comprehensive sources & analysis' },
    { icon: 'cpu', title: 'Enhanced Memory', description: 'Advanced context understanding' },
    { icon: 'image', title: 'Image Generation', description: 'Create images with AI' },
    { icon: 'headphones', title: 'Priority Support', description: 'Get help when you need it' },
    { icon: 'bar-chart-2', title: 'Advanced Analytics', description: 'Track your usage & insights' },
  ]

  if (hasRevenueCatPro) {
    return (
      <AuthGuard>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>You're on Pro! 🎉</Text>
          </View>

          <View style={styles.content}>
            <Card style={styles.successCard}>
              <Feather name="check-circle" size={48} color={theme.colors.success} />
              <Text style={styles.successTitle}>All Pro Features Unlocked</Text>
              <Text style={styles.successDescription}>
                Thank you for supporting Lotus! Enjoy unlimited access to all features.
              </Text>
            </Card>

            <Button onPress={() => router.push('/home')} size="lg" fullWidth>
              Start Chatting
            </Button>
          </View>
        </ScrollView>
        <Navigation />
      </AuthGuard>
    )
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Features List */}
          <Card style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Everything in Pro</Text>
            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Feather name={feature.icon as any} size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Subscription Packages */}
          {packages.map((pkg, index) => {
            const isAnnual = pkg.identifier.includes('annual')
            const isMostPopular = !isAnnual // Monthly is most popular

            return (
              <TouchableOpacity
                key={pkg.identifier}
                onPress={() => handlePurchase(pkg)}
                disabled={isPurchasing}
                style={styles.packageCard}
              >
                <LinearGradient
                  colors={isMostPopular ? ['#6366f1', '#8b5cf6'] : ['#374151', '#1f2937']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.packageGradient}
                >
                  {isMostPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}

                  <View style={styles.packageHeader}>
                    <View>
                      <Text style={styles.packageName}>
                        {isAnnual ? 'Annual' : 'Monthly'}
                      </Text>
                      <Text style={styles.packagePrice}>{getPackagePrice(pkg)}</Text>
                      <Text style={styles.packagePeriod}>{getPackagePeriod(pkg)}</Text>
                    </View>
                    <Feather
                      name="arrow-right"
                      size={24}
                      color={theme.colors.text}
                      style={styles.packageArrow}
                    />
                  </View>

                  {isAnnual && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>Save 17% vs monthly</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )
          })}

          {isPurchasing && (
            <View style={styles.purchasingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.purchasingText}>Processing purchase...</Text>
            </View>
          )}

          {/* Restore Purchases */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isRestoring}
            style={styles.restoreButton}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              Payment will be charged to your {Platform.OS === 'ios' ? 'Apple' : 'Google Play'} account.
              Subscription automatically renews unless auto-renew is turned off at least 24 hours
              before the end of the current period.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>•</Text>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing['4xl'],
    right: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  successCard: {
    alignItems: 'center',
    padding: theme.spacing['2xl'],
    marginBottom: theme.spacing.xl,
  },
  successTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  successDescription: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  featuresCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  featuresList: {
    gap: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  packageCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  packageGradient: {
    padding: theme.spacing.xl,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  popularBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    letterSpacing: theme.typography.letterSpacing.wide,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  packagePrice: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  packagePeriod: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.xs,
  },
  packageArrow: {
    opacity: 0.8,
  },
  savingsBadge: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  purchasingOverlay: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  purchasingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  restoreButton: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  legalContainer: {
    marginTop: theme.spacing['2xl'],
    alignItems: 'center',
  },
  legalText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legalLink: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  legalSeparator: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
})
