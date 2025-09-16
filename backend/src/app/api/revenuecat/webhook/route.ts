import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// RevenueCat webhook: set REVENUECAT_WEBHOOK_SECRET and configure in RevenueCat dashboard
// Payload reference: https://www.revenuecat.com/docs/integrations/webhooks

type RCEvent = {
  event: {
    type: string
    app_user_id: string
    product_id?: string
    entitlement_ids?: string[]
    expiration_at?: string | null
    expiration_at_ms?: number | null
    purchased_at?: string | null
    period_type?: string // trial, intro, normal
    auto_resume_at?: string | null
    cancellation_at?: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET
    if (!secret) return NextResponse.json({ ok: false, error: 'Webhook secret not set' }, { status: 500 })

    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ')? auth.slice(7) : ''
    if (token !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as RCEvent
    const e = body?.event
    if (!e?.app_user_id) {
      return NextResponse.json({ ok: false, error: 'Missing app_user_id' }, { status: 400 })
    }

    const userId = e.app_user_id // We expect mobile to use Clerk user ID as app_user_id

    const activeTypes = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'SUBSCRIPTION_RESUMED'])
    const cancelTypes = new Set(['CANCELLATION', 'BILLING_ISSUE', 'SUBSCRIPTION_PAUSED'])
    const expireTypes = new Set(['EXPIRATION'])

    const isActive = activeTypes.has(e.type)
    const isCanceled = cancelTypes.has(e.type) || expireTypes.has(e.type)

    const currentPeriodEnd = e.expiration_at_ms
      ? new Date(e.expiration_at_ms)
      : e.expiration_at
        ? new Date(e.expiration_at)
        : null

    if (isActive) {
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          planType: 'pro',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: currentPeriodEnd || undefined,
        },
        create: {
          userId,
          planType: 'pro',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: currentPeriodEnd || undefined,
        },
      })
    } else if (isCanceled) {
      const existing = await prisma.subscription.findUnique({ where: { userId } })
      if (existing) {
        await prisma.subscription.update({
          where: { userId },
          data: { status: 'canceled', planType: 'free' },
        })
      } else {
        await prisma.subscription.create({
          data: { userId, status: 'canceled', planType: 'free' },
        })
      }
    } else {
      // Ignore other events
      console.log('RevenueCat webhook: Ignored event type', e.type)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('RevenueCat webhook error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

