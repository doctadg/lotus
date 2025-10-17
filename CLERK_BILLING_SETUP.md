# Clerk Billing Integration Setup Guide

This guide will walk you through setting up Clerk Billing for your Lotus application.

## Prerequisites

- Existing Clerk account with your application configured
- Stripe account (or use Clerk's development gateway for testing)
- Access to Clerk Dashboard

## Step 1: Enable Billing in Clerk Dashboard

1. Navigate to the [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Configure** → **Billing Settings**
4. Click **Enable Billing**
5. Choose your payment gateway:
   - **Clerk development gateway**: For testing in development (no Stripe account needed)
   - **Stripe account**: Connect your own Stripe account for production

## Step 2: Create Plans for Users (B2C)

1. In the Clerk Dashboard, go to **Configure** → **Plans**
2. Select the **Plans for Users** tab
3. Click **Add Plan** to create each plan

### Free Plan

- **Plan ID**: `free` (must match `PLANS.FREE` in code)
- **Name**: Free Plan
- **Description**: Perfect for getting started
- **Price**: $0
- **Publicly available**: Yes

### Pro Plan

- **Plan ID**: `pro` (must match `PLANS.PRO` in code)
- **Name**: Pro Plan
- **Description**: For power users and professionals
- **Price**: $9.99/month (or your preferred pricing)
- **Publicly available**: Yes

## Step 3: Create Features

Features are used to gate access to specific functionality. Create the following features in the Clerk Dashboard:

1. Go to **Configure** → **Features**
2. Click **Add Feature** for each feature below

### Feature 1: Unlimited Messages

- **Feature ID**: `unlimited_messages` (must match `FEATURES.UNLIMITED_MESSAGES` in code)
- **Name**: Unlimited Messages
- **Description**: Send unlimited messages without hourly limits
- **Publicly available**: Yes
- **Add to Plan**: Pro Plan

### Feature 2: Deep Research

- **Feature ID**: `deep_research` (must match `FEATURES.DEEP_RESEARCH` in code)
- **Name**: Deep Research Mode
- **Description**: Access comprehensive research with multiple sources and enhanced analysis
- **Publicly available**: Yes
- **Add to Plan**: Pro Plan

### Feature 3: Enhanced Memory

- **Feature ID**: `enhanced_memory` (must match `FEATURES.ENHANCED_MEMORY` in code)
- **Name**: Enhanced Memory Extraction
- **Description**: Advanced memory extraction and context analysis
- **Publicly available**: Yes
- **Add to Plan**: Pro Plan

### Feature 4: Image Generation

- **Feature ID**: `image_generation` (must match `FEATURES.IMAGE_GENERATION` in code)
- **Name**: Image Generation
- **Description**: Generate images using AI
- **Publicly available**: Yes
- **Add to Plan**: Pro Plan

### Feature 5: Priority Support

- **Feature ID**: `priority_support` (must match `FEATURES.PRIORITY_SUPPORT` in code)
- **Name**: Priority Support
- **Description**: Get priority support from our team
- **Publicly available**: Yes
- **Add to Plan**: Pro Plan

## Step 4: Configure Stripe (Production Only)

If using your own Stripe account:

1. In Clerk Dashboard → **Billing Settings**
2. Click **Connect Stripe Account**
3. Follow the OAuth flow to connect your Stripe account
4. Clerk will automatically sync your plans to Stripe

### Required Environment Variables

Add these to your `.env` files:

#### Backend (`backend/.env.local`)

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe Configuration (if using custom integration)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PLAN_MONTHLY_PRICE_ID=price_...

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Mobile (`mobile/.env`)

```bash
# Clerk Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# API URL
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Step 5: Test the Integration

### Testing in Development

1. Start your backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your mobile app:
   ```bash
   cd mobile
   npm start
   ```

3. Test the following flows:

#### Backend/Web Testing

1. Navigate to `http://localhost:3000/pricing`
2. Verify the Clerk `<PricingTable />` component loads
3. Sign in and try subscribing to a plan
4. Navigate to `http://localhost:3000/settings`
5. Verify the `<UserProfile />` component shows subscription management
6. Try sending messages and verify rate limiting works
7. Try enabling Deep Research mode and verify Pro feature gating works

#### Mobile Testing

1. Open the mobile app
2. Navigate to the Pricing screen
3. Verify plans are displayed correctly
4. Navigate to Subscription screen
5. Verify current plan status is shown
6. Try toggling Deep Research mode (should prompt for upgrade if not Pro)
7. Verify upgrade banner shows for free users in sidebar

### Testing Subscription Flow

1. **As a Free User**:
   - Send 15 messages in an hour
   - Verify rate limit error appears
   - Try to enable Deep Research
   - Verify upgrade prompt appears

2. **Subscribe to Pro**:
   - Click "Upgrade to Pro"
   - Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
   - Verify subscription activates

3. **As a Pro User**:
   - Send unlimited messages
   - Enable Deep Research mode
   - Verify no rate limits apply
   - Check Settings page shows Pro subscription

## Step 6: Deploy to Production

### Update Environment Variables

1. Update Clerk keys to production keys
2. Update Stripe keys to live keys
3. Update `NEXT_PUBLIC_BASE_URL` to your production domain

### Stripe Configuration

1. In Clerk Dashboard, switch to production environment
2. Connect your live Stripe account
3. Re-create plans and features in production (IDs must match)
4. Test the complete flow in production

## Feature Gating Reference

### Backend

Use the helper functions from `backend/src/lib/clerk-billing.ts`:

```typescript
import { hasFeature, hasPlan, canUseDeepResearch } from '@/lib/clerk-billing'

// Check for specific feature
const hasUnlimited = await hasFeature(FEATURES.UNLIMITED_MESSAGES)

// Check for specific plan
const isPro = await hasPlan(PLANS.PRO)

// Check specific capability
const canResearch = await canUseDeepResearch()
```

### Mobile

Use the helper functions from `mobile/src/lib/billing.ts`:

```typescript
import { useAuth } from '@clerk/clerk-expo'
import { hasFeature, isProUser, canUseDeepResearch } from '../lib/billing'

const { has } = useAuth()

// Check for specific feature
const hasUnlimited = hasFeature(has, FEATURES.UNLIMITED_MESSAGES)

// Check for specific plan
const isPro = isProUser(has)

// Check specific capability
const canResearch = canUseDeepResearch(has)
```

## Troubleshooting

### Issue: PricingTable not showing

**Solution**: Ensure you're signed in and the plans are marked as "Publicly available" in Clerk Dashboard.

### Issue: Feature gating not working

**Solution**:
1. Verify feature IDs match exactly between code and Clerk Dashboard
2. Check that features are added to the correct plan
3. Verify user has an active subscription

### Issue: Stripe checkout failing

**Solution**:
1. Verify Stripe is connected in Clerk Dashboard
2. Check that plans are synced to Stripe
3. Verify environment variables are set correctly

### Issue: Rate limiting not working

**Solution**:
1. Check that `hasUnlimitedMessages()` is being called
2. Verify the user's subscription status
3. Check database for MessageUsage records

## Support

For additional help:
- [Clerk Billing Documentation](https://clerk.com/docs/billing)
- [Clerk Discord](https://clerk.com/discord)
- [GitHub Issues](https://github.com/your-repo/issues)

## Migration from Custom Billing

If you're migrating from the existing custom Stripe integration:

1. **Dual System Approach** (Recommended):
   - Keep existing Prisma `Subscription` model
   - Add Clerk billing in parallel
   - Gradually migrate users
   - Use feature flags to control rollout

2. **Data Migration**:
   - Export existing subscription data
   - Map to Clerk plans
   - Use Clerk's API to bulk import if needed

3. **Webhook Handling**:
   - Keep existing Stripe webhooks for legacy subscriptions
   - Add Clerk webhook handling for new subscriptions
   - Implement dual-check logic in feature gating

## Important Constants

Ensure these IDs match between your code and Clerk Dashboard:

### Plan IDs
- Free: `free`
- Pro: `pro`

### Feature IDs
- Unlimited Messages: `unlimited_messages`
- Deep Research: `deep_research`
- Enhanced Memory: `enhanced_memory`
- Image Generation: `image_generation`
- Priority Support: `priority_support`

## Next Steps

After completing this setup:

1. ✅ Test thoroughly in development
2. ✅ Set up monitoring for subscription events
3. ✅ Create customer support documentation
4. ✅ Set up analytics tracking for conversions
5. ✅ Implement upgrade prompts throughout the app
6. ✅ Consider adding trial periods
7. ✅ Implement referral program (optional)

---

**Last Updated**: 2025-10-16
