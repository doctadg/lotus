import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import crypto from 'crypto'

// RevenueCat webhook event types
type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER'
  | 'SUBSCRIBER_ALIAS'
  | 'SUBSCRIPTION_PAUSED'
  | 'SUBSCRIPTION_EXTENDED'

interface RevenueCatWebhookEvent {
  api_version: string
  event: {
    type: RevenueCatEventType
    id: string
    app_user_id: string
    original_app_user_id: string
    aliases: string[]
    product_id: string
    period_type: 'NORMAL' | 'TRIAL' | 'INTRO'
    purchased_at_ms: number
    expiration_at_ms?: number
    environment: 'SANDBOX' | 'PRODUCTION'
    presented_offering_id?: string
    transaction_id: string
    original_transaction_id: string
    is_trial_conversion: boolean
    price?: number
    currency?: string
    country_code?: string
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL'
    takehome_percentage?: number
    entitlement_id?: string
    entitlement_ids?: string[]
  }
}

interface RevenueCatSubscriptionData {
  isPro: boolean
  platform: 'app_store' | 'play_store' | 'stripe' | 'promotional' | null
  expiresAt: string | null
  productId: string | null
  status: 'active' | 'expired' | 'cancelled' | 'billing_issue' | null
  willRenew: boolean
  isInTrialPeriod: boolean
  lastUpdated: string
}

/**
 * Verify RevenueCat webhook signature
 * RevenueCat signs webhooks with HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Map RevenueCat store to user-friendly platform name
 */
function mapStoreToPlatform(
  store: RevenueCatWebhookEvent['event']['store']
): RevenueCatSubscriptionData['platform'] {
  switch (store) {
    case 'APP_STORE':
      return 'app_store'
    case 'PLAY_STORE':
      return 'play_store'
    case 'STRIPE':
      return 'stripe'
    case 'PROMOTIONAL':
      return 'promotional'
    default:
      return null
  }
}

/**
 * Determine subscription status based on event type
 */
function getSubscriptionStatus(
  eventType: RevenueCatEventType,
  expirationMs?: number
): RevenueCatSubscriptionData['status'] {
  const now = Date.now()
  const hasExpired = expirationMs && expirationMs < now

  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'SUBSCRIPTION_EXTENDED':
      return hasExpired ? 'expired' : 'active'
    case 'CANCELLATION':
      return hasExpired ? 'expired' : 'cancelled'
    case 'EXPIRATION':
      return 'expired'
    case 'BILLING_ISSUE':
      return 'billing_issue'
    case 'NON_RENEWING_PURCHASE':
      return hasExpired ? 'expired' : 'active'
    default:
      return null
  }
}

/**
 * Determine if subscription will auto-renew
 */
function getWillRenew(
  eventType: RevenueCatEventType,
  periodType: RevenueCatWebhookEvent['event']['period_type']
): boolean {
  // Non-renewing purchases and cancelled subscriptions won't renew
  if (
    eventType === 'NON_RENEWING_PURCHASE' ||
    eventType === 'CANCELLATION' ||
    eventType === 'EXPIRATION'
  ) {
    return false
  }

  // Active subscriptions in normal period will renew
  if (periodType === 'NORMAL') {
    return true
  }

  // Trial and intro periods will convert to normal
  return true
}

/**
 * Update Clerk user metadata with RevenueCat subscription data
 */
async function updateClerkUserSubscription(
  userId: string,
  subscriptionData: RevenueCatSubscriptionData
): Promise<void> {
  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        revenuecatSubscription: subscriptionData,
      },
    })

    console.log(
      `[RevenueCat Webhook] Updated subscription for user ${userId}:`,
      subscriptionData
    )
  } catch (error) {
    console.error(
      `[RevenueCat Webhook] Error updating user ${userId}:`,
      error
    )
    throw error
  }
}

/**
 * Process RevenueCat webhook event
 */
async function processWebhookEvent(
  event: RevenueCatWebhookEvent
): Promise<void> {
  const {
    app_user_id: userId,
    type: eventType,
    product_id: productId,
    expiration_at_ms: expirationMs,
    store,
    period_type: periodType,
    entitlement_ids: entitlementIds,
  } = event.event

  console.log(
    `[RevenueCat Webhook] Processing ${eventType} for user ${userId}`
  )

  // Check if user has "Pro" entitlement (case-sensitive!)
  const isPro =
    entitlementIds?.includes('Pro') ||
    entitlementIds?.includes('pro') || // Support both cases for safety
    ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'].includes(eventType)

  // Determine subscription status
  const status = getSubscriptionStatus(eventType, expirationMs)
  const willRenew = getWillRenew(eventType, periodType)

  // Build subscription data
  const subscriptionData: RevenueCatSubscriptionData = {
    isPro: isPro && status === 'active',
    platform: mapStoreToPlatform(store),
    expiresAt: expirationMs ? new Date(expirationMs).toISOString() : null,
    productId: productId || null,
    status,
    willRenew,
    isInTrialPeriod: periodType === 'TRIAL',
    lastUpdated: new Date().toISOString(),
  }

  // Update Clerk user metadata
  await updateClerkUserSubscription(userId, subscriptionData)
}

/**
 * RevenueCat webhook handler
 * Receives webhook events from RevenueCat and syncs subscription status to Clerk
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_SECRET not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Get raw body for signature verification
    const payload = await request.text()
    const signature = request.headers.get('x-revenuecat-signature')

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature, webhookSecret)

    if (!isValid) {
      console.error('[RevenueCat Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse webhook event
    const webhookEvent: RevenueCatWebhookEvent = JSON.parse(payload)

    // Log event for debugging
    console.log(
      `[RevenueCat Webhook] Received ${webhookEvent.event.type} event for user ${webhookEvent.event.app_user_id}`
    )

    // Process webhook event
    await processWebhookEvent(webhookEvent)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processed successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[RevenueCat Webhook] Error processing webhook:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler for testing
 * Returns webhook endpoint info
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: '/api/webhooks/revenuecat',
      description: 'RevenueCat webhook handler for subscription events',
      supportedEvents: [
        'INITIAL_PURCHASE',
        'RENEWAL',
        'CANCELLATION',
        'UNCANCELLATION',
        'NON_RENEWING_PURCHASE',
        'EXPIRATION',
        'BILLING_ISSUE',
        'PRODUCT_CHANGE',
        'TRANSFER',
        'SUBSCRIBER_ALIAS',
        'SUBSCRIPTION_PAUSED',
        'SUBSCRIPTION_EXTENDED',
      ],
    },
    { status: 200 }
  )
}
