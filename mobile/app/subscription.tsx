import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
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

export default function SubscriptionScreen() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isSubscribed = subscription?.planType === 'pro'

  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      loadSubscription()
    }
  }, [isAuthLoading, isAuthenticated])

  const loadSubscription = async () => {
    if (!user) return
    
    try {
      const subscriptionData = await apiService.getUserSubscription()
      setSubscription(subscriptionData)
    } catch (error) {
      console.error('Error loading subscription:', error)
      // Set default free plan for new users
      setSubscription({ planType: 'free', status: null })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) return
    
    Alert.alert(
      'Subscribe to Pro',
      'Subscription management will be integrated with Stripe in production',
      [
        {
          text: 'OK',
          onPress: () => {
            // In production, this would redirect to Stripe Checkout
            console.log('Would redirect to Stripe Checkout')
          }
        }
      ]
    )
  }

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
              <Feather name="package" size={24} color={theme.colors.textSecondary} />
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
            </View>
            <Text style={styles.currentPlanName}>Free Plan</Text>
            <Text style={styles.planDescription}>
              Basic access to Lotus AI features
            </Text>
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

          <Button
            onPress={handleSubscribe}
            loading={isLoading}
            disabled={isLoading || isSubscribed}
            size="lg"
            fullWidth
          >
            {isLoading ? 'Processing...' : isSubscribed ? 'Subscribed' : 'Upgrade to Pro'}
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
  }
})
