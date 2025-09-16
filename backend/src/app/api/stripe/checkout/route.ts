import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_PLAN_IDS, STRIPE_REDIRECT_URLS } from '@/lib/stripe'
import { ApiResponse } from '@/types'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userRecord = await syncUserWithDatabase(clerkUserId)
    if (!userRecord) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userRecord.id

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      })
      
      stripeCustomerId = customer.id
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId }
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: STRIPE_PLAN_IDS.PRO_MONTHLY,
          quantity: 1,
        },
      ],
      success_url: STRIPE_REDIRECT_URLS.SUCCESS,
      cancel_url: STRIPE_REDIRECT_URLS.CANCEL,
      subscription_data: {
        metadata: { userId: user.id },
      },
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { sessionId: session.id, url: (session as any).url || null }
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
