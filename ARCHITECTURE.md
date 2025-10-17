# Lotus Hybrid Billing Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOTUS ECOSYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐                              ┌──────────────────┐
│   Web Frontend   │                              │  Mobile App      │
│   (Next.js)      │                              │  (React Native)  │
│                  │                              │                  │
│  - /pricing      │                              │  - /paywall      │
│  - /settings     │                              │  - /subscription │
│  - <PricingTable>│                              │  - RevenueCat SDK│
│  - <UserProfile> │                              │  - Native IAP    │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         │ Subscribe                                       │ Subscribe
         │ via Clerk                                       │ via RevenueCat
         ▼                                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                        BILLING SYSTEMS                              │
├─────────────────────────────────┬──────────────────────────────────┤
│                                 │                                  │
│  ┌───────────────────────┐     │     ┌───────────────────────┐   │
│  │   Clerk Billing       │     │     │   RevenueCat          │   │
│  │   (Web)               │     │     │   (Mobile)            │   │
│  │                       │     │     │                       │   │
│  │  - Stripe checkout    │     │     │  - App Store IAP      │   │
│  │  - $9.99/month        │     │     │  - Play Store billing │   │
│  │  - Instant activation │     │     │  - $9.99/month        │   │
│  │  - Portal management  │     │     │  - Native management  │   │
│  └───────┬───────────────┘     │     └───────┬───────────────┘   │
│          │                     │             │                   │
│          │ Sets                │             │ Sends             │
│          │ has({ plan: 'pro'}) │             │ webhook           │
│          ▼                     │             ▼                   │
└──────────────────────────────────────────────────────────────────┘
           │                                   │
           └───────────────┬───────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (Next.js API)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Webhook Handler: /api/webhooks/revenuecat/route.ts       │ │
│  │  - Verifies signature                                       │ │
│  │  - Processes events (PURCHASE, RENEWAL, CANCELLATION)      │ │
│  │  - Updates Clerk user metadata                             │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Subscription Status: lib/subscription-status.ts           │ │
│  │  - getUserSubscriptionStatus()                             │ │
│  │  - Checks RevenueCat first (mobile)                        │ │
│  │  - Checks Clerk Billing second (web)                       │ │
│  │  - Returns unified Pro status                              │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Feature Gating: lib/clerk-billing.ts                     │ │
│  │  - hasUnlimitedMessages() → Uses hybrid logic             │ │
│  │  - canUseDeepResearch() → Uses hybrid logic               │ │
│  │  - canGenerateImages() → Uses hybrid logic                │ │
│  │  - hasEnhancedMemory() → Uses hybrid logic                │ │
│  │  - hasPrioritySupport() → Uses hybrid logic               │ │
│  └───────────────────────────┬────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Chat API: /api/chat/[chatId]/stream/route.ts             │ │
│  │  - Rate limits free users (15 msg/hour)                   │ │
│  │  - Allows unlimited for Pro                               │ │
│  │  - Gates Deep Research feature                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                      CLERK USER METADATA                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  user.privateMetadata.revenuecatSubscription = {                 │
│    isPro: true,                                                   │
│    platform: 'app_store',                                         │
│    expiresAt: '2025-11-16',                                       │
│    productId: 'lotus_pro_monthly',                                │
│    status: 'active',                                              │
│    willRenew: true,                                               │
│    isInTrialPeriod: false,                                        │
│    lastUpdated: '2025-10-16T10:30:00Z'                            │
│  }                                                                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Subscription Flow Diagrams

### Web Subscription Flow

```
User                  Web App              Clerk              Stripe
  │                     │                    │                  │
  ├──Visit /pricing────>│                    │                  │
  │                     │                    │                  │
  │<──Show PricingTable─┤                    │                  │
  │                     │                    │                  │
  ├──Click "Subscribe"──>│                    │                  │
  │                     │                    │                  │
  │                     ├──Create session────>│                  │
  │                     │                    │                  │
  │                     │                    ├──Create checkout──>│
  │                     │                    │                  │
  │<─────────────Redirect to Stripe Checkout─────────────────────┤
  │                                          │                  │
  ├──Enter payment info──────────────────────────────────────────>│
  │                                          │                  │
  │<──────────────Payment confirmed──────────────────────────────┤
  │                                          │                  │
  │                                          │<──Webhook────────┤
  │                                          │                  │
  │                                          ├──Update user─────>│
  │                                          │  (set plan: pro) │
  │                                          │                  │
  │<─────────────Redirect to success page────┤                  │
  │                     │                    │                  │
  │                     │                    │                  │
  ├──Use Pro features───>│                    │                  │
  │                     │                    │                  │
  │                     ├──Check features────>│                  │
  │                     │  has({ plan: pro })│                  │
  │                     │                    │                  │
  │                     │<──Returns true─────┤                  │
  │                     │                    │                  │
  │<──Pro features work─┤                    │                  │
  │                     │                    │                  │
```

### Mobile Subscription Flow

```
User               Mobile App         RevenueCat       App/Play Store    Backend
  │                    │                   │                 │              │
  ├──Open /paywall────>│                   │                 │              │
  │                    │                   │                 │              │
  │                    ├──getOfferings()───>│                 │              │
  │                    │                   │                 │              │
  │                    │<──Return packages─┤                 │              │
  │                    │   ($9.99/month)   │                 │              │
  │                    │                   │                 │              │
  │<──Show pricing─────┤                   │                 │              │
  │                    │                   │                 │              │
  ├──Tap "Subscribe"───>│                   │                 │              │
  │                    │                   │                 │              │
  │                    ├──purchasePackage()─>│                 │              │
  │                    │                   │                 │              │
  │                    │                   ├──Request payment─>│              │
  │                    │                   │                 │              │
  │<────────────────Show native payment sheet───────────────┤              │
  │                                        │                 │              │
  ├──Approve (Face ID/Fingerprint)────────────────────────────>│              │
  │                                        │                 │              │
  │                                        │<──Confirm payment─┤              │
  │                                        │                 │              │
  │                                        ├──Send webhook─────────────────────>│
  │                                        │                 │              │
  │                                        │                 │              ├──Verify signature
  │                                        │                 │              │
  │                                        │                 │              ├──Update Clerk
  │                                        │                 │              │  metadata
  │                                        │                 │              │
  │                    │<──Purchase success─┤                 │              │
  │                    │  (customerInfo)   │                 │              │
  │                    │                   │                 │              │
  │                    ├──refreshSubscription()──────────────────────────────>│
  │                    │                   │                 │              │
  │                    │<──Returns isPro: true──────────────────────────────┤
  │                    │                   │                 │              │
  │<──Show success─────┤                   │                 │              │
  │   "Welcome to Pro!"│                   │                 │              │
  │                    │                   │                 │              │
  ├──Use Pro features──>│                   │                 │              │
  │                    │                   │                 │              │
  │                    ├──Check features───────────────────────────────────>│
  │                    │                   │                 │              │
  │                    │                   │                 │              ├──Check RevenueCat
  │                    │                   │                 │              │  metadata
  │                    │                   │                 │              │
  │                    │<──Returns isPro: true──────────────────────────────┤
  │                    │                   │                 │              │
  │<──Pro features work─┤                   │                 │              │
  │                    │                   │                 │              │
```

---

## Data Flow

### Subscription Status Check

```
API Request (Chat, Features, etc.)
         │
         ▼
getUserSubscriptionStatus()
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
Check RevenueCat                      Check Clerk Billing
(user.privateMetadata.                (has({ plan: 'pro' }))
 revenuecatSubscription)
         │                                     │
         ├──Has active subscription?           │
         │  └──Yes → Return Pro                │
         │                                     │
         │                                     ├──Has Pro plan?
         │                                     │  └──Yes → Return Pro
         │                                     │
         └─────────────────┬───────────────────┘
                           │
                           ▼
                    Return Free
```

### Feature Gate Example

```typescript
// User tries to use Deep Research
async function handleDeepResearchRequest() {
  // This checks BOTH billing systems automatically
  const canUse = await canUseDeepResearch()

  if (!canUse) {
    return {
      error: 'Deep Research is a Pro feature',
      upgradeUrl: '/pricing'
    }
  }

  // Allow feature
  return performDeepResearch()
}

// Behind the scenes in canUseDeepResearch():
// 1. Call getUserSubscriptionStatus()
// 2. Check RevenueCat subscription (mobile IAP)
// 3. If not Pro, check Clerk Billing (web Stripe)
// 4. Return true if Pro from either source
```

---

## Database Schema

### Clerk User Metadata Structure

```typescript
interface ClerkUser {
  id: string
  email: string

  // Public metadata (visible to client)
  publicMetadata: {
    // Not used for billing
  }

  // Private metadata (server-only)
  privateMetadata: {
    // RevenueCat subscription data (set by webhook)
    revenuecatSubscription?: {
      isPro: boolean
      platform: 'app_store' | 'play_store' | 'stripe' | 'promotional' | null
      expiresAt: string | null  // ISO 8601 date
      productId: string | null   // e.g., 'lotus_pro_monthly'
      status: 'active' | 'expired' | 'cancelled' | 'billing_issue' | null
      willRenew: boolean
      isInTrialPeriod: boolean
      lastUpdated: string  // ISO 8601 date
    }
  }
}
```

### Prisma Database Schema (Legacy/Fallback)

```prisma
model Subscription {
  id                  String    @id @default(cuid())
  userId              String    @unique
  planType            String    // 'free' or 'pro'
  status              String?   // Stripe status
  stripeSubscriptionId String?  @unique
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/subscription` | Get current user's subscription status |
| POST | `/api/stripe/checkout` | Create Stripe checkout session (web) |
| POST | `/api/stripe/portal` | Open Stripe billing portal (web) |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/revenuecat` | Handle RevenueCat events (mobile) |
| POST | `/api/webhooks/stripe` | Handle Stripe events (web) |

### Example Response: `/api/user/subscription`

```json
{
  "success": true,
  "data": {
    "subscription": {
      "planType": "pro",
      "status": "active",
      "currentPeriodStart": null,
      "currentPeriodEnd": "2025-11-16T00:00:00Z",
      "source": "revenuecat",
      "platform": "app_store",
      "willRenew": true,
      "isInTrialPeriod": false
    }
  }
}
```

---

## Security

### Webhook Verification

```typescript
// RevenueCat Webhook
const signature = request.headers.get('x-revenuecat-signature')
const payload = await request.text()
const secret = process.env.REVENUECAT_WEBHOOK_SECRET

const hmac = crypto.createHmac('sha256', secret)
hmac.update(payload)
const expectedSignature = hmac.digest('hex')

if (signature !== expectedSignature) {
  throw new Error('Invalid signature')
}
```

### Feature Gate Security

```typescript
// NEVER trust client-side checks
// Always verify on backend

// ❌ WRONG - Client can bypass this
if (hasRevenueCatPro) {
  // Allow feature
}

// ✅ CORRECT - Backend verification
const isPro = await isProUser()  // Checks backend
if (isPro) {
  // Allow feature
}
```

---

## Monitoring

### Key Metrics to Track

1. **Subscription Metrics**
   - New subscriptions per day
   - Churn rate
   - MRR (Monthly Recurring Revenue)
   - Platform split (web vs mobile)

2. **Technical Metrics**
   - Webhook delivery success rate
   - Subscription sync failures
   - Feature gate errors
   - API response times

3. **User Metrics**
   - Conversion rate (free → pro)
   - Feature usage by plan
   - Support tickets by plan

### Logging

```typescript
// All subscription operations are logged
console.log('[RevenueCat Webhook] Received INITIAL_PURCHASE for user abc123')
console.log('[Subscription Status] User abc123 has active RevenueCat subscription')
console.log('[Feature Gate] User abc123 can use deep research')
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not firing | URL not configured | Check RevenueCat Dashboard → Integrations |
| Invalid signature | Wrong webhook secret | Verify `REVENUECAT_WEBHOOK_SECRET` matches |
| Subscription not syncing | Webhook failed | Check backend logs, retry webhook |
| Features not unlocking | Cache issue | Refresh user session, check metadata |
| Different status on platforms | Source mismatch | Check which billing system was used |

---

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure production webhook URLs
- [ ] Test webhook delivery in production
- [ ] Set up monitoring and alerting
- [ ] Configure App Store Connect (iOS)
- [ ] Configure Google Play Console (Android)
- [ ] Test subscription flow end-to-end
- [ ] Test cancellation and refund flows
- [ ] Set up customer support processes
- [ ] Monitor first week of production closely

---

**Architecture implemented on: 2025-10-16**
