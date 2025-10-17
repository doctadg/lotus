/**
 * RevenueCat Integration for Mobile In-App Purchases
 *
 * Handles iOS App Store and Google Play Store subscriptions
 * Syncs with backend Clerk billing system
 */

import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// RevenueCat entitlement IDs (must match what you configure in RevenueCat dashboard)
// Note: RevenueCat dashboard may use different casing (e.g., "Pro" vs "pro")
export const ENTITLEMENTS = {
  PRO: 'Pro', // Changed to match RevenueCat dashboard configuration
} as const

// Product identifiers (must match App Store Connect / Google Play Console)
export const PRODUCTS = {
  PRO_MONTHLY: 'lotus_pro_monthly',
  PRO_ANNUAL: 'lotus_pro_annual',
} as const

export type Entitlement = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS]
export type Product = typeof PRODUCTS[keyof typeof PRODUCTS]

// Track if RevenueCat is already configured to prevent multiple initializations
let isConfigured = false

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts, before user authentication
 */
export async function initializeRevenueCat(): Promise<void> {
  // Prevent multiple initializations
  if (isConfigured) {
    if (__DEV__) {
      console.log('⚠️ RevenueCat already initialized, skipping...')
    }
    return
  }

  const apiKey = Platform.select({
    ios: Constants.expoConfig?.extra?.revenueCatIosKey,
    android: Constants.expoConfig?.extra?.revenueCatAndroidKey,
  })

  if (__DEV__) {
    console.log('🔍 RevenueCat Configuration:', {
      platform: Platform.OS,
      hasIosKey: !!Constants.expoConfig?.extra?.revenueCatIosKey,
      hasAndroidKey: !!Constants.expoConfig?.extra?.revenueCatAndroidKey,
      selectedKey: apiKey ? 'present' : 'missing',
    })
  }

  if (!apiKey) {
    console.error('❌ RevenueCat API key not found. In-app purchases will not work.')
    console.error('Platform:', Platform.OS)
    console.error('Extra config:', Constants.expoConfig?.extra)
    throw new Error('RevenueCat API key not configured')
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG)
      console.log('🚀 Initializing RevenueCat with key:', apiKey.substring(0, 10) + '...')
    }

    // Configure RevenueCat with dangerousSettings to prevent URL-related errors
    await Purchases.configure({
      apiKey,
      dangerousSettings: {
        autoSyncPurchases: true,
      }
    })
    isConfigured = true

    if (__DEV__) {
      console.log('✅ RevenueCat initialized successfully')
    }
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error)
    throw error
  }
}

/**
 * Check if RevenueCat is configured
 */
export function isRevenueCatConfigured(): boolean {
  return isConfigured
}

/**
 * Identify user in RevenueCat
 * Call this after user signs in with Clerk
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId)
    if (__DEV__) {
      console.log('✅ User identified in RevenueCat:', userId)
    }
  } catch (error) {
    console.error('❌ Failed to identify user in RevenueCat:', error)
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user signs out
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut()
    if (__DEV__) {
      console.log('✅ User logged out from RevenueCat')
    }
  } catch (error) {
    console.error('❌ Failed to logout from RevenueCat:', error)
  }
}

/**
 * Get current customer info (subscription status)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return customerInfo
  } catch (error) {
    console.error('❌ Failed to get customer info:', error)
    return null
  }
}

/**
 * Check if user has Pro subscription
 */
export async function hasProSubscription(): Promise<boolean> {
  try {
    if (__DEV__) {
      console.log('🔍 Checking Pro subscription status...')
    }

    const customerInfo = await getCustomerInfo()
    if (!customerInfo) {
      if (__DEV__) {
        console.log('⚠️ No customer info available')
      }
      return false
    }

    const entitlements = customerInfo.entitlements.active
    const hasPro = ENTITLEMENTS.PRO in entitlements

    if (__DEV__) {
      console.log('📋 Entitlements check:', {
        activeEntitlements: Object.keys(entitlements),
        hasPro,
        lookingFor: ENTITLEMENTS.PRO,
      })
    }

    return hasPro
  } catch (error) {
    console.error('❌ Failed to check Pro subscription:', error)
    return false
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    if (!isConfigured) {
      throw new Error('RevenueCat is not configured. Call initializeRevenueCat() first.')
    }

    if (__DEV__) {
      console.log('📦 Fetching offerings from RevenueCat...')
    }

    const offerings = await Purchases.getOfferings()

    if (__DEV__) {
      console.log('✅ Offerings fetched:', {
        hasOfferings: !!offerings.current,
        packageCount: offerings.current?.availablePackages?.length || 0,
      })
    }

    return offerings.current
  } catch (error) {
    console.error('❌ Failed to get offerings:', error)
    if (!isConfigured) {
      console.error('💡 Hint: RevenueCat is not initialized. Check initialization logs above.')
    }
    return null
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  packageToPurchase: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo | null; error: Error | null }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)

    if (__DEV__) {
      console.log('✅ Purchase successful:', customerInfo)
    }

    // Sync with backend after successful purchase
    await syncSubscriptionWithBackend()

    return { customerInfo, error: null }
  } catch (error: any) {
    console.error('❌ Purchase failed:', error)

    // Handle user cancellation
    if (error.userCancelled) {
      return { customerInfo: null, error: null }
    }

    return { customerInfo: null, error }
  }
}

/**
 * Restore previous purchases
 * Use this when user reinstalls app or switches devices
 */
export async function restorePurchases(): Promise<{
  customerInfo: CustomerInfo | null
  error: Error | null
}> {
  try {
    const customerInfo = await Purchases.restorePurchases()

    if (__DEV__) {
      console.log('✅ Purchases restored:', customerInfo)
    }

    // Sync with backend after restoring purchases
    await syncSubscriptionWithBackend()

    return { customerInfo, error: null }
  } catch (error: any) {
    console.error('❌ Failed to restore purchases:', error)
    return { customerInfo: null, error }
  }
}

/**
 * Open subscription management (App Store / Play Store settings)
 */
export async function manageSubscription(): Promise<void> {
  try {
    await Purchases.showManagementUI()
  } catch (error) {
    console.error('❌ Failed to open subscription management:', error)
  }
}

/**
 * Get formatted price for a package
 */
export function getPackagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString
}

/**
 * Get subscription period for a package
 */
export function getPackagePeriod(pkg: PurchasesPackage): string {
  const product = pkg.product

  if (product.subscriptionPeriod) {
    const unit = product.subscriptionPeriod.unit
    const value = product.subscriptionPeriod.value || 1

    if (!unit) return 'subscription'

    if (unit === 'MONTH' && value === 1) return 'per month'
    if (unit === 'YEAR' && value === 1) return 'per year'

    return `per ${value} ${unit.toLowerCase()}`
  }

  return 'one-time'
}

/**
 * Check if customer info indicates active subscription
 */
export function isCustomerInfoPro(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false
  const entitlements = customerInfo.entitlements.active
  return ENTITLEMENTS.PRO in entitlements
}

/**
 * Get expiration date of subscription
 */
export function getSubscriptionExpiration(customerInfo: CustomerInfo | null): Date | null {
  if (!customerInfo) return null

  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO]
  if (!proEntitlement) return null

  return proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null
}

/**
 * Check if subscription will renew
 */
export function willRenew(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false

  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO]
  if (!proEntitlement) return false

  return proEntitlement.willRenew
}

/**
 * Get subscription platform (App Store or Play Store)
 */
export function getSubscriptionPlatform(customerInfo: CustomerInfo | null): string | null {
  if (!customerInfo) return null

  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO]
  if (!proEntitlement) return null

  return proEntitlement.store === 'APP_STORE' ? 'App Store' : 'Play Store'
}

/**
 * Setup customer info update listener
 * Call this in your app's root component
 */
export function setupCustomerInfoListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  try {
    const remove = Purchases.addCustomerInfoUpdateListener(callback)

    // Return a safe cleanup function
    if (typeof remove === 'function') {
      return remove
    } else {
      if (__DEV__) {
        console.warn('⚠️ RevenueCat listener returned invalid remove function')
      }
      return () => {} // Return no-op function
    }
  } catch (error) {
    console.error('❌ Failed to setup customer info listener:', error)
    return () => {} // Return no-op function
  }
}

/**
 * Sync RevenueCat subscription with backend
 * This is automatically called after purchases and restores
 * Can also be called manually to force sync
 */
export async function syncSubscriptionWithBackend(): Promise<void> {
  try {
    // Dynamically import to avoid circular dependency
    const { apiService } = await import('./api')

    const customerInfo = await getCustomerInfo()
    const isPro = isCustomerInfoPro(customerInfo)

    // Call backend API to sync subscription status
    await apiService.syncRevenueCatSubscription({
      isPro,
      customerInfo: customerInfo ? {
        originalAppUserId: customerInfo.originalAppUserId,
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
        entitlements: Object.keys(customerInfo.entitlements.active),
      } : null,
    })

    if (__DEV__) {
      console.log('✅ Subscription synced with backend')
    }
  } catch (error) {
    console.error('❌ Failed to sync subscription with backend:', error)
    // Don't throw - sync failures shouldn't block the app
  }
}
