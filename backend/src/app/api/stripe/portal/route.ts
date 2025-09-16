import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { ApiResponse } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findFirst({ where: { clerkId: clerkUserId } })
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No billing account found' }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
    })

    return NextResponse.json<ApiResponse>({ success: true, data: { url: portalSession.url } })
  } catch (e) {
    console.error('Error creating billing portal session:', e)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
