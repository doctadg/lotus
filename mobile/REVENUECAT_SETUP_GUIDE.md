# Complete RevenueCat + Google Play Store Setup Guide

## 🎯 Overview: How Everything Fits Together

```
User purchases in app
         ↓
Google Play Store (processes payment)
         ↓
RevenueCat (tracks subscription)
         ↓
Your Backend (receives webhook)
         ↓
User gets Pro features
```

**Why each service?**
- **Google Play Store**: Handles actual payments, required by Google
- **RevenueCat**: Simplifies subscription management, handles webhooks, provides SDK
- **Your Backend**: Grants access to Pro features based on subscription status

---

## 📋 Prerequisites

Before starting, you need:
1. A Google Play Console account ($25 one-time fee)
2. A RevenueCat account (free tier is fine)
3. Your app uploaded to Google Play Console (at least internal testing)

---

## Part 1: Google Play Store Setup

### Step 1.1: Create Your App in Google Play Console

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: `Mror AI`
   - Language: English
   - App type: App
   - Free/Paid: Free
4. Accept declarations and click **Create app**

### Step 1.2: Create In-App Products

1. In your appdashboard, go to **Monetize** → **Products** → **In-app products**
2. Click **Create product**

**Product 1: Monthly Subscription**
```
Product ID: mror_pro_monthly
Name: Mror Pro Monthly
Description: Monthly subscription to Mror Pro features
Status: Active
Price: $9.99 USD
```

**Product 2: Annual Subscription**
```
Product ID: mror_pro_annual
Name: Mror Pro Annual
Description: Annual subscription to Mror Pro features
Status: Active
Price: $99.99 USD
```

3. Click **Activate** for each product

### Step 1.3: Set Up Subscription Details

For each subscription product:
1. Click on the product
2. Under **Subscription details**:
   - Billing period: 1 month (or 1 year for annual)
   - Free trial: 7 days (optional)
   - Grace period: 3 days (recommended)
3. Add benefits text (users will see this):
   - "Advanced AI capabilities"
   - "Priority support"
   - "Unlimited memories"
   - "Deep research mode"
4. Save

### Step 1.4: Get Service Account Key

1. Go to **Setup** → **API access**
2. Under **Service accounts**, click **View service accounts**
3. This opens Google Cloud Console
4. Click **Create Service Account**
   - Name: `revenuecat-api`
   - Role: **Pub/Sub Admin** (for notifications)
5. Click **Done**
6. Click on the service account you just created
7. Go to **Keys** tab → **Add Key** → **Create new key**
8. Choose **JSON** format
9. Download the JSON file (save it securely!)

### Step 1.5: Link Service Account to Play Console

1. Back in Play Console → **Setup** → **API access**
2. Click **Grant access** on your new service account
3. Grant these permissions:
   - **View financial data**
   - **Manage orders and subscriptions**
4. Click **Invite user** → **Send invite**

---

## Part 2: RevenueCat Setup

### Step 2.1: Create RevenueCat Project

1. Go to https://app.revenuecat.com/
2. Sign up or log in
3. Click **Create new project**
   - Project name: `Mror`
4. Select **Android** as your first platform

### Step 2.2: Configure Android App

1. In your project, go to **Project Settings** → **Apps**
2. Click **+ New** → **Android**
3. Fill in:
   - App name: `Mror Android`
   - Bundle ID: `com.mror.app` (must match your app.json)
4. Click **Save**

### Step 2.3: Upload Google Play Service Account Key

1. Still in the Android app config
2. Under **Service Account Credentials**, click **Upload JSON**
3. Upload the JSON file you downloaded in Step 1.4
4. Click **Save**
5. RevenueCat will verify the connection

### Step 2.4: Add Products to RevenueCat

1. Go to **Products** in the left sidebar
2. Click **+ New**

**Add Monthly Product:**
```
Identifier: mror_pro_monthly
Store Product ID (Google): mror_pro_monthly
Type: Subscription
```

**Add Annual Product:**
```
Identifier: mror_pro_annual
Store Product ID (Google): mror_pro_annual
Type: Subscription
```

### Step 2.5: Create Entitlement

1. Go to **Entitlements** in the left sidebar
2. Click **+ New**
   - Identifier: `Pro` (capital P - must match your code)
   - Display name: `Pro Access`
3. Click **Save**

### Step 2.6: Create Offering

1. Go to **Offerings** in the left sidebar
2. Click **+ New**
   - Identifier: `default`
   - Description: `Default offering`
3. In the offering, click **+ Add Package**

**Monthly Package:**
```
Identifier: $rc_monthly (or pro_monthly)
Products: Select "mror_pro_monthly"
Entitlements: Check "Pro"
```

**Annual Package:**
```
Identifier: $rc_annual (or pro_annual)
Products: Select "mror_pro_annual"
Entitlements: Check "Pro"
```

4. Click **Save**
5. Set this offering as **Current** (toggle the switch)

### Step 2.7: Get API Keys

1. Go to **Project Settings** → **API keys**
2. Copy these keys:
   ```
   Android SDK Key: goog_xxxxxxxxxxxxxxxxx
   iOS SDK Key: appl_xxxxxxxxxxxxxxxxx (for future iOS setup)
   ```
3. **IMPORTANT**: These are different from your PUBLIC API key. Use the SDK keys!

### Step 2.8: Set Up Webhook (Backend Integration)

1. Go to **Project Settings** → **Integrations**
2. Click **+ Webhooks**
3. Add webhook URL: `https://www.mror.app/api/webhooks/revenuecat`
4. Select events to send:
   - ✅ Initial Purchase
   - ✅ Renewal
   - ✅ Cancellation
   - ✅ Expiration
   - ✅ Billing Issues
5. Copy the **Authorization header** value (you'll need this in your backend)
6. Click **Add**

---

## Part 3: Update Your Mobile App Code

### Step 3.1: Update app.json with Real API Keys

Edit `/home/d/lotus/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "revenueCatIosKey": "appl_YOUR_IOS_KEY_HERE",
      "revenueCatAndroidKey": "goog_YOUR_ANDROID_KEY_HERE"
    }
  }
}
```

### Step 3.2: Verify Product IDs Match

Check `/home/d/lotus/mobile/src/lib/revenuecat.ts` (lines 24-27):

```typescript
export const PRODUCTS = {
  PRO_MONTHLY: 'mror_pro_monthly',  // Must match Play Store
  PRO_ANNUAL: 'mror_pro_annual',    // Must match Play Store
}

export const ENTITLEMENTS = {
  PRO: 'Pro',  // Must match RevenueCat (case-sensitive!)
}
```

---

## Part 4: Backend Webhook Setup

### Step 4.1: Create RevenueCat Webhook Endpoint

Your backend needs to handle webhooks at: `https://www.mror.app/api/webhooks/revenuecat`

**Webhook payload example:**
```json
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "clerk_user_123",
    "product_id": "mror_pro_monthly",
    "period_type": "NORMAL",
    "purchased_at_ms": 1234567890,
    "expiration_at_ms": 1234567890,
    "store": "PLAY_STORE"
  }
}
```

### Step 4.2: Backend Code (Node.js/Express Example)

```typescript
// /api/webhooks/revenuecat
import { db } from '@/lib/db'

export async function POST(req: Request) {
  // Verify webhook is from RevenueCat
  const authHeader = req.headers.get('authorization')
  const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET

  if (authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await req.json()
  const event = payload.event

  // Get user ID (this should be Clerk user ID)
  const userId = event.app_user_id

  // Handle different event types
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      // Grant Pro access
      await db.user.update({
        where: { clerkId: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionPlatform: 'play_store',
          subscriptionExpiresAt: new Date(event.expiration_at_ms)
        }
      })
      break

    case 'CANCELLATION':
      // User cancelled (but still has access until expiration)
      await db.user.update({
        where: { clerkId: userId },
        data: {
          subscriptionStatus: 'cancelled',
          subscriptionExpiresAt: new Date(event.expiration_at_ms)
        }
      })
      break

    case 'EXPIRATION':
      // Subscription expired, revoke access
      await db.user.update({
        where: { clerkId: userId },
        data: {
          subscriptionStatus: 'expired',
          subscriptionExpiresAt: new Date(event.expiration_at_ms)
        }
      })
      break
  }

  return new Response('OK', { status: 200 })
}
```

### Step 4.3: Add Environment Variable

Add to your backend `.env`:
```
REVENUECAT_WEBHOOK_SECRET=your_authorization_header_from_revenuecat
```

---

## Part 5: Testing Your Setup

### Step 5.1: Enable Google Play Testing

1. In Play Console → **Testing** → **Internal testing**
2. Click **Create new release**
3. Upload your APK/AAB
4. Add test users (email addresses)
5. Save and review → **Start rollout**

### Step 5.2: Install Test App

1. Test users will receive an email
2. Click the link and opt-in to testing
3. Install the app from Play Store

### Step 5.3: Test Purchase Flow

1. Open the app
2. Go to subscription screen
3. Try to purchase Pro
4. Use a test card (Google provides test payment methods for testers)
5. Check RevenueCat dashboard for the event

### Step 5.4: Verify Webhook

1. After purchase, check your backend logs
2. Verify webhook was received
3. Verify user was granted Pro access in your database
4. Check in app that Pro features are unlocked

---

## 🔍 Troubleshooting

### "Invalid API key" Error
- Make sure you're using the **SDK keys** not the Public API key
- Keys start with `goog_` (Android) or `appl_` (iOS)
- Found in RevenueCat → Project Settings → API keys

### "No products found" Error
- Products must be **Active** in Play Console
- Product IDs must match exactly (case-sensitive)
- Wait 2-4 hours after creating products for them to propagate
- Make sure your app is signed with the same key as uploaded to Play Console

### Webhook not received
- Check webhook URL is publicly accessible
- Verify authorization header is correct
- Check backend logs for incoming requests
- Test webhook manually in RevenueCat dashboard

### "Singleton instance" Error
- Make sure API keys are in app.json correctly
- RevenueCat must initialize before any calls to it
- Check console logs for initialization errors

---

## 📊 Dashboard Quick Reference

### Google Play Console
https://play.google.com/console
- **Products**: Create in-app products
- **API Access**: Service account setup
- **Testing**: Manage test users

### RevenueCat Dashboard
https://app.revenuecat.com
- **Products**: Link Play Store products
- **Entitlements**: Define access levels (Pro)
- **Offerings**: Group products for sale
- **API Keys**: Get SDK keys for mobile app
- **Integrations**: Set up webhooks

---

## ✅ Checklist Before Production

- [ ] Products created and **Active** in Play Console
- [ ] Service account JSON uploaded to RevenueCat
- [ ] Products added to RevenueCat
- [ ] Entitlement "Pro" created
- [ ] Offering created with packages
- [ ] SDK keys added to app.json
- [ ] Webhook endpoint created and tested
- [ ] Backend handles all webhook events
- [ ] Test purchase completed successfully
- [ ] Pro features unlock after purchase
- [ ] App uploaded to Play Store (at least internal testing)

---

## 🎉 You're Done!

Once all checkboxes are complete, your subscription system is ready. Users can now:
1. Purchase Pro subscription in your app
2. Google Play processes payment
3. RevenueCat tracks the subscription
4. Your backend receives webhook and grants access
5. User enjoys Pro features!

---

## 💡 Pro Tips

1. **Start with internal testing** - Test thoroughly before going public
2. **Monitor RevenueCat dashboard** - Track purchases, cancellations, revenue
3. **Set up email receipts** - Google Play handles this automatically
4. **Enable grace periods** - Give users extra time if payment fails
5. **Test cancellation flow** - Make sure access is revoked properly
6. **Use RevenueCat's Customer Lists** - See who has active subscriptions

---

## 🆘 Need Help?

- RevenueCat Docs: https://docs.revenuecat.com/
- Play Console Help: https://support.google.com/googleplay/android-developer
- RevenueCat Support: support@revenuecat.com (they're very responsive!)

---

**Last Updated**: 2025-10-20
**App Version**: 1.0.0
