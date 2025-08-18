import Stripe from 'stripe'

// Initialize Stripe with your secret key
// In production, this should be stored in environment variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

// Product IDs for your Stripe products
export const STRIPE_PRODUCT_IDS = {
  PRO_PLAN: process.env.STRIPE_PRO_PLAN_PRODUCT_ID || 'prod_pro_plan',
} as const

// Plan IDs for your Stripe plans
export const STRIPE_PLAN_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_PLAN_MONTHLY_PRICE_ID || 'price_pro_monthly',
} as const

// Success and cancel URLs for Stripe checkout
export const STRIPE_REDIRECT_URLS = {
  SUCCESS: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
  CANCEL: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
} as const
