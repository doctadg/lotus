# Unified Billing Setup Guide

This guide explains how billing works across Lotus's web and mobile applications.

## Architecture Overview

Lotus uses a **hybrid billing system** that provides a seamless experience across platforms:

- **Mobile (iOS/Android)**: RevenueCat + In-App Purchases (App Store/Play Store)
- **Web**: Clerk Billing + Stripe
- **Backend**: Unified subscription checking via Clerk user metadata

### Why Hybrid?

1. **App Store Compliance**: Apple and Google require IAP for digital subscriptions
2. **Better Conversion**: Stripe provides better conversion on web
3. **Unified Experience**: One account, subscribe anywhere, works everywhere
4. **Simple**: Users don't need to think about which platform they're on

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      Single Source of Truth                  │
│                     Clerk User Metadata                      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
              ┌───────────────┴────────────────┐
              │                                │
         ┌────┴─────┐                   ┌─────┴────┐
         │  Mobile  │                   │   Web    │
         │   IAP    │                   │  Stripe  │
         └────┬─────┘                   └─────┬────┘
              │                                │
         RevenueCat                       Clerk Billing
         Webhooks                         (Built-in)
              │                                │
              └────────────┬───────────────────┘
                          │
                    Backend Syncs
                    Subscription Status
```

### Subscription Flow

1. **User subscribes** (App Store, Play Store, or Web Stripe)
2. **Webhook fires** (RevenueCat or Clerk)
3. **Backend updates** Clerk user metadata
4. **All platforms check** Clerk metadata for subscription status
5. **Works everywhere** - Subscribe once, access on all platforms

## Backend Setup

### 1. Environment Variables

Add to `backend/.env.local`:

```bash
# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# RevenueCat (Required for mobile)
REVENUECAT_WEBHOOK_SECRET=rcwh_...

# Stripe (Optional - only if using custom Stripe integration)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PLAN_MONTHLY_PRICE_ID=price_...

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important**: Get your `REVENUECAT_WEBHOOK_SECRET` from:
1. RevenueCat Dashboard → Integrations → Webhooks
2. Add webhook: `https://your-backend.com/api/webhooks/revenuecat`
3. Copy the authorization header value

### 2. Webhook Endpoints

The backend has two webhook handlers:

#### RevenueCat Webhook (Mobile IAP)
- **URL**: `POST /api/webhooks/revenuecat`
- **Purpose**: Syncs App Store/Play Store subscriptions to Clerk
- **Events**: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.

#### Manual Sync Endpoint (Fallback)
- **URL**: `POST /api/revenuecat/sync`
- **Purpose**: Mobile app can manually sync subscription status
- **When**: After purchase, on app startup, after restore
- **Why**: Provides redundancy if webhooks fail

### 3. Subscription Status Check

The backend uses priority-based checking:

```typescript
// backend/src/lib/subscription-status.ts

async function getUserSubscriptionStatus() {
  // 1. Check RevenueCat (mobile IAP) first
  const rcSub = await checkRevenueCatSubscription(userId)
  if (rcSub && rcSub.isPro) return rcSub

  // 2. Check Clerk Billing (web Stripe) second
  const clerkSub = await checkClerkBillingSubscription()
  if (clerkSub && clerkSub.isPro) return clerkSub

  // 3. Default to free
  return { isPro: false, source: 'none' }
}
```

## Mobile Setup

### 1. Environment Variables

Add to `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "clerkPublishableKey": "pk_test_...",
      "revenueCatIosKey": "appl_...",
      "revenueCatAndroidKey": "goog_...",
      "apiUrl": "https://your-backend.com/api"
    }
  }
}
```

Or use `mobile/.env`:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_API_URL=https://your-backend.com/api
```

### 2. RevenueCat Configuration

1. **Create RevenueCat Account**: https://www.revenuecat.com/
2. **Get API Keys**: Dashboard → Apps → API Keys
3. **Configure Products**:
   - Create entitlement: `Pro`
   - Create products: `lotus_pro_monthly`, `lotus_pro_annual`
4. **Link to Stores**:
   - iOS: Link to App Store Connect products
   - Android: Link to Google Play Console products

### 3. Automatic Syncing

The mobile app automatically syncs with the backend:

- ✅ **After purchase** - Immediate sync
- ✅ **After restore** - Syncs restored subscriptions
- ✅ **On app startup** - Checks for Pro status and syncs
- ✅ **Subscription changes** - Listener updates in real-time

## Web Setup

### 1. Clerk Billing

The web app uses Clerk's built-in billing:

1. **Enable in Dashboard**: Configure → Billing Settings
2. **Create Plans**:
   - Free plan: ID = `free`
   - Pro plan: ID = `pro` ($9.99/month)
3. **Create Features**:
   - `unlimited_messages`
   - `deep_research`
   - `enhanced_memory`
   - `image_generation`
   - `priority_support`

### 2. Pricing Page

Uses Clerk's `<PricingTable />` component:

```tsx
import { PricingTable } from '@clerk/nextjs'

<PricingTable />
```

That's it! Clerk handles the rest.

## Testing

### Test Mobile Subscriptions

1. **iOS**:
   - Add sandbox tester in App Store Connect
   - Sign out of App Store on device
   - Run app: `npm run ios`
   - Purchase with sandbox account
   - Verify sync in backend logs

2. **Android**:
   - Add license tester in Play Console
   - Join internal testing track
   - Run app: `npm run android`
   - Purchase with test account
   - Verify sync in backend logs

3. **Test Restore**:
   - Delete app
   - Reinstall
   - Tap "Restore Purchases"
   - Verify subscription restores and syncs

### Test Web Subscriptions

1. Navigate to `/pricing`
2. Click "Upgrade to Pro"
3. Complete Stripe checkout (test card: `4242 4242 4242 4242`)
4. Verify subscription activates
5. Open mobile app with same account
6. Verify Pro status shows

### Test Cross-Platform

1. **Subscribe on mobile**:
   - Purchase Pro on iPhone
   - Verify works on iPhone
   - Open web app → Should show Pro

2. **Subscribe on web**:
   - Purchase Pro on web
   - Verify works on web
   - Open mobile app → Should show Pro

## Troubleshooting

### Mobile subscription not syncing to web

**Check**:
1. RevenueCat webhook is configured correctly
2. `REVENUECAT_WEBHOOK_SECRET` is set in backend
3. Webhook URL is publicly accessible
4. Check RevenueCat webhook logs for errors

**Fix**:
- Mobile app automatically retries sync on startup
- Manually trigger: Open mobile app when connected

### Web subscription not showing on mobile

**Check**:
1. Using same Clerk account on both platforms
2. Clerk Billing plan is `pro` (case-sensitive)
3. Backend subscription check logic is correct

**Fix**:
- Restart mobile app
- Check backend logs for subscription status

### Webhook signature validation fails

**Cause**: Wrong `REVENUECAT_WEBHOOK_SECRET`

**Fix**:
1. Go to RevenueCat Dashboard → Webhooks
2. Copy the authorization header (not the URL)
3. Update `REVENUECAT_WEBHOOK_SECRET` in `.env.local`
4. Restart backend

### User shows as free but has subscription

**Cause**: Metadata sync failed or webhook didn't fire

**Fix**:
1. Check Clerk user metadata in dashboard
2. Mobile: Force sync by reopening app
3. Web: Check Clerk Billing subscription status
4. Manually trigger webhook from RevenueCat dashboard

## Development vs Production

### Development

- Use RevenueCat sandbox mode
- Use Clerk development keys
- Use Stripe test mode
- Test with sandbox accounts

### Production

- Switch to RevenueCat production mode
- Switch to Clerk production keys
- Switch to Stripe live mode
- Update webhook URLs to production
- Update mobile app config

## Security

✅ **Webhooks are verified** - HMAC signatures checked
✅ **User IDs are validated** - Can only sync own subscription
✅ **Secrets are protected** - Environment variables only
✅ **Sync is redundant** - Multiple mechanisms prevent failures

## Best Practices

1. **Always use Clerk user ID** as RevenueCat app user ID
2. **Test webhooks** in development before production
3. **Monitor logs** for sync failures
4. **Have fallbacks** - Manual sync handles webhook failures
5. **Keep it simple** - Users subscribe once, works everywhere

## Support

- **RevenueCat**: https://docs.revenuecat.com/
- **Clerk Billing**: https://clerk.com/docs/billing
- **App Store IAP**: https://developer.apple.com/in-app-purchase/
- **Google Play Billing**: https://developer.android.com/google/play/billing

---

**Last Updated**: 2025-10-17
