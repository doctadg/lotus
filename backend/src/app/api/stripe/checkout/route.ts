import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, STRIPE_PLAN_IDS, STRIPE_REDIRECT_URLS } from '@/lib/stripe'
import { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const authData = await authenticateUser(request)
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = authData.userId

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
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { sessionId: session.id }
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
