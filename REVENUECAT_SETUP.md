# RevenueCat + Clerk Hybrid Billing Setup

This guide explains how to set up a hybrid billing system where:
- **Mobile (iOS/Android)**: Uses native In-App Purchases via RevenueCat
- **Web**: Uses Clerk Billing with Stripe
- **Backend**: Syncs both systems for consistent subscription status

## Why This Hybrid Approach?

1. **App Store Compliance**: Apple and Google require IAP for digital subscriptions
2. **Better Mobile UX**: Users manage subscriptions through iOS/Android settings
3. **Web Flexibility**: Stripe provides better conversion rates on web
4. **Unified Experience**: Backend keeps subscription status in sync

## Architecture Overview

```
Mobile App (iOS/Android)
    ↓
RevenueCat SDK
    ↓
App Store / Play Store ← User subscribes here
    ↓
RevenueCat Webhooks
    ↓
Backend API
    ↓
Clerk User Metadata ← Subscription status synced
    ↑
Web App uses Clerk Billing
```

## Prerequisites

- Existing Clerk account
- RevenueCat account (free to start)
- Apple Developer Account (for iOS)
- Google Play Console Account (for Android)
- Stripe account (for web billing)

---

## Part 1: RevenueCat Setup

### Step 1: Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com/) and sign up
2. Create a new project for your app
3. Note your API keys:
   - iOS API key
   - Android API key

### Step 2: Configure Products in RevenueCat

1. In RevenueCat Dashboard, go to **Products**
2. Create a new entitlement: `pro`
3. Create products:
   - **Product ID**: `lotus_pro_monthly`
   - **Product ID**: `lotus_pro_annual` (optional)

### Step 3: Configure App Store Connect (iOS)

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → **Subscriptions**
3. Create a new subscription group
4. Create subscriptions:
   - **Product ID**: `lotus_pro_monthly` (must match RevenueCat)
   - **Price**: $9.99/month
   - **Subscription Duration**: 1 month

5. In RevenueCat, link the iOS product:
   - Products → iOS → Add Product
   - Enter Product ID: `lotus_pro_monthly`
   - Link to entitlement: `pro`

### Step 4: Configure Google Play Console (Android)

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app → **Monetize → Subscriptions**
3. Create a new subscription:
   - **Product ID**: `lotus_pro_monthly` (must match RevenueCat)
   - **Price**: $9.99/month
   - **Billing period**: Monthly

4. In RevenueCat, link the Android product:
   - Products → Android → Add Product
   - Enter Product ID: `lotus_pro_monthly`
   - Link to entitlement: `pro`

### Step 5: Configure RevenueCat Webhooks

1. In RevenueCat Dashboard, go to **Integrations → Webhooks**
2. Add a new webhook endpoint:
   ```
   https://your-backend.com/api/webhooks/revenuecat
   ```
3. Subscribe to events:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `EXPIRATION`
   - `PRODUCT_CHANGE`

4. Copy the webhook secret (you'll need this later)

---

## Part 2: Mobile App Configuration

### Step 1: Add Environment Variables

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

Or use `.env`:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_API_URL=https://your-backend.com/api
```

### Step 2: Test on Device

RevenueCat requires a physical device for testing (simulators won't work for IAP).

#### iOS Testing

1. Add test user in App Store Connect → Users and Access → Sandbox Testers
2. Sign out of App Store on your device
3. Run app on device:
   ```bash
   cd mobile
   npm run ios
   ```
4. When prompted, sign in with sandbox tester account
5. Test purchase flow

#### Android Testing

1. Add test user in Google Play Console → Setup → License testing
2. Join internal testing track
3. Run app on device:
   ```bash
   cd mobile
   npm run android
   ```
4. Test purchase flow

---

## Part 3: Backend Configuration

### Step 1: Add Environment Variables

Add to `backend/.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# RevenueCat
REVENUECAT_WEBHOOK_SECRET=sk_...

# Stripe (for web billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PLAN_MONTHLY_PRICE_ID=price_...

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 2: Create Webhook Handler

The webhook handler should be created at:
```
backend/src/app/api/webhooks/revenuecat/route.ts
```

This handler will:
1. Verify webhook signature
2. Parse RevenueCat events
3. Update Clerk user metadata
4. Sync with database

### Step 3: Update Clerk User Metadata

When RevenueCat webhook is received, update the Clerk user:

```typescript
import { clerkClient } from '@clerk/nextjs/server'

await clerkClient.users.updateUserMetadata(userId, {
  privateMetadata: {
    revenuecatSubscription: {
      isPro: true,
      platform: 'app_store', // or 'play_store'
      expiresAt: '2025-11-16',
      productId: 'lotus_pro_monthly',
    }
  }
})
```

---

## Part 4: Hybrid Billing Logic

### Subscription Status Priority

The backend should check subscription status in this order:

1. **RevenueCat** (for mobile users)
2. **Clerk Billing** (for web users)
3. **Database** (fallback)

```typescript
// backend/src/lib/subscription-status.ts
export async function getUserSubscriptionStatus(userId: string) {
  const user = await clerkClient.users.getUser(userId)

  // Check RevenueCat first (mobile)
  const rcSub = user.privateMetadata?.revenuecatSubscription
  if (rcSub && rcSub.isPro && new Date(rcSub.expiresAt) > new Date()) {
    return { isPro: true, source: 'revenuecat' }
  }

  // Check Clerk Billing (web)
  const { has } = await auth()
  if (has({ plan: 'pro' })) {
    return { isPro: true, source: 'clerk' }
  }

  // Default to free
  return { isPro: false, source: 'none' }
}
```

### Feature Gating

Update feature checks to use hybrid logic:

```typescript
// backend/src/lib/clerk-billing.ts
export async function isProUser(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const status = await getUserSubscriptionStatus(userId)
  return status.isPro
}
```

---

## Part 5: Mobile UI Updates

### Update Subscription Screen

The subscription screen should:
1. Show RevenueCat subscription status
2. Allow purchases through App Store/Play Store
3. Link to platform subscription management

### Update Home Screen

The home screen should:
1. Check `hasRevenueCatPro` from AuthContext
2. Show Pro badge for subscribed users
3. Show upgrade prompts for free users

### Update Pricing Screen

The pricing screen should:
1. Fetch RevenueCat offerings
2. Display prices in user's local currency
3. Handle purchases through RevenueCat
4. Restore purchases for existing subscribers

---

## Part 6: Testing

### Test iOS In-App Purchase

1. Sign out of App Store on device
2. Sign in with sandbox tester account
3. Open app and navigate to pricing
4. Purchase Pro subscription
5. Verify:
   - Purchase completes
   - Subscription status updates
   - Webhook fires
   - Backend syncs with Clerk
   - Pro features unlock

### Test Android In-App Purchase

1. Join internal testing track
2. Install app from Play Store
3. Navigate to pricing
4. Purchase Pro subscription
5. Verify same flow as iOS

### Test Web Billing

1. Open web app
2. Navigate to pricing page
3. Subscribe using Stripe
4. Verify:
   - Clerk subscription activates
   - Pro features unlock on web
   - Status syncs to mobile (if same user)

### Test Restore Purchases

1. Delete and reinstall app
2. Sign in with same account
3. Tap "Restore Purchases"
4. Verify subscription restores

---

## Part 7: Production Deployment

### iOS App Store

1. Update App Store Connect with production subscription
2. Submit app for review
3. Update RevenueCat to production mode
4. Update mobile app with production API keys

### Google Play Store

1. Update Play Console with production subscription
2. Submit app for review
3. Update RevenueCat to production mode
4. Update mobile app with production API keys

### Web Deployment

1. Deploy backend with production Clerk keys
2. Deploy frontend with production Clerk keys
3. Connect production Stripe account to Clerk
4. Test end-to-end flow

---

## Troubleshooting

### Issue: Purchases not working on iOS

**Solutions:**
1. Verify App Store Connect subscriptions are approved
2. Check you're using sandbox tester account
3. Ensure RevenueCat product IDs match exactly
4. Check RevenueCat logs for errors

### Issue: Webhook not firing

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check RevenueCat webhook logs
3. Verify webhook secret is correct
4. Test webhook manually using RevenueCat dashboard

### Issue: Subscription status not syncing

**Solutions:**
1. Check webhook handler logs
2. Verify Clerk user metadata is updating
3. Check database for sync errors
4. Try manual refresh in app

### Issue: Different status on web vs mobile

**Solutions:**
1. Check which billing system user subscribed through
2. Verify webhook fired correctly
3. Check Clerk user metadata
4. Try syncing manually

---

## Cost Analysis

### RevenueCat Pricing

- **Free**: Up to $2,500 in tracked revenue/month
- **Starter**: $250/month for up to $10k in revenue
- **Growth**: Custom pricing for higher volumes

### Clerk Billing Pricing

- **0.7%** per transaction
- No monthly fees
- Stripe fees apply (2.9% + $0.30)

### Stripe Fees

- **2.9% + $0.30** per transaction (standard)
- Lower rates available for high volume

### App Store / Play Store Fees

- **30%** for first year of subscription
- **15%** after first year (small business program)
- **15%** if under $1M annual revenue

---

## Best Practices

1. **Always use RevenueCat for mobile**
   - App Store guidelines require it
   - Better user experience
   - Automatic subscription management

2. **Use Clerk Billing for web**
   - Better conversion rates
   - More payment options
   - Easier to implement

3. **Keep systems in sync**
   - Use webhooks for real-time updates
   - Have fallback sync mechanisms
   - Log all sync operations

4. **Test thoroughly**
   - Test both platforms separately
   - Test subscription transitions
   - Test edge cases (expiration, cancellation)

5. **Monitor everything**
   - Set up alerts for webhook failures
   - Track subscription metrics
   - Monitor sync errors

---

## Support Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Clerk Billing Documentation](https://clerk.com/docs/billing)
- [Apple IAP Documentation](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)

---

## Migration Plan

If you have existing subscribers:

1. **Phase 1**: Implement RevenueCat alongside existing system
2. **Phase 2**: Test with small group of users
3. **Phase 3**: Gradually migrate existing subscribers
4. **Phase 4**: Deprecate old system
5. **Phase 5**: Remove old code

---

**Last Updated**: 2025-10-16
