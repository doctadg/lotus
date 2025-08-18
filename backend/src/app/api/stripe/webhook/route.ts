import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Disable Next.js body parsing for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')!
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        
        // Update or create subscription in database
        await prisma.subscription.upsert({
          where: { userId: subscription.metadata.userId },
          update: {
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            planType: 'pro', // Assuming all subscriptions are for the Pro plan
          },
          create: {
            userId: subscription.metadata.userId,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            planType: 'pro',
          },
        })
        
        // Also update user's stripeCustomerId if not already set
        await prisma.user.update({
          where: { id: subscription.metadata.userId },
          data: { stripeCustomerId: subscription.customer as string },
        })
        
        break
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        
        // Update subscription status to canceled
        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: deletedSubscription.id }
        })
        
        if (existingSubscription) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { status: 'canceled', planType: 'free' },
          })
        }
        
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
