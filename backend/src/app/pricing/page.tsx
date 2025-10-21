'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Crown, Sparkles, Search, Zap, Shield } from 'lucide-react'
import Link from 'next/link'
import { SignedIn, SignedOut, PricingTable } from '@clerk/nextjs'
import DynamicNavbar from '@/components/landing/DynamicNavbar'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [useClerkBilling, setUseClerkBilling] = useState(true)

  const startCheckout = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start checkout')
      const data = await res.json()
      const url = data?.data?.url
      if (url) window.location.href = url
    } catch (e) {
      console.error('Pricing checkout error:', e)
    } finally {
      setLoading(false)
    }
  }
  
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '15 messages per hour',
        'Basic AI responses',
        'Memory storage',
        'Standard search'
      ],
      cta: 'Get Started',
      ctaVariant: 'outline',
      popular: false
    },
    {
      name: 'Pro',
      price: isAnnual ? '$50' : '$5',
      period: isAnnual ? 'per year' : 'per month',
      description: 'For power users and professionals',
      features: [
        'Unlimited messages',
        'Deep research mode',
        'Enhanced memory extraction',
        'Priority search results',
        'Advanced analytics',
        'Early access to new features'
      ],
      cta: 'Upgrade Now',
      ctaVariant: 'default',
      popular: true
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white">
      <DynamicNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 dark:text-white text-neutral-900">Simple, transparent pricing</h1>
          <p className="text-xl dark:text-white/70 text-neutral-600 max-w-2xl mx-auto mb-10">
            Choose the plan that works best for you. Upgrade or downgrade at any time.
          </p>

          {/* Toggle between Clerk and custom billing */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setUseClerkBilling(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                useClerkBilling
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-neutral-600 dark:text-white/60'
              }`}
            >
              Clerk Billing
            </button>
            <button
              onClick={() => setUseClerkBilling(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !useClerkBilling
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-neutral-600 dark:text-white/60'
              }`}
            >
              Custom Plans
            </button>
          </div>
        </div>

        {/* Clerk Billing Integration */}
        {useClerkBilling && (
          <div className="mb-16">
            <SignedIn>
              <div className="max-w-5xl mx-auto">
                <PricingTable />
              </div>
            </SignedIn>
            <SignedOut>
              <div className="text-center">
                <p className="text-lg dark:text-white/70 text-neutral-600 mb-6">
                  Please sign in to view and subscribe to plans
                </p>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        )}

        {/* Custom Plans (Legacy) */}
        {!useClerkBilling && (
          <>
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium ${!isAnnual ? 'dark:text-white text-neutral-900' : 'dark:text-white/60 text-neutral-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative rounded-full w-14 h-7 dark:bg-white/10 bg-black/5 dark:border-white/20 border-black/20 transition-colors"
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full dark:bg-white bg-neutral-700 transition-all duration-300 ${isAnnual ? 'left-8' : 'left-1'}`}></div>
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'dark:text-white text-neutral-900' : 'dark:text-white/60 text-neutral-500'}`}>
                Annual <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full ml-1">Save 15%</span>
              </span>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`bg-white dark:bg-white/5 relative overflow-hidden border ${
                plan.popular ? 'border-purple-500' : 'border-black/10 dark:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="dark:text-white/60 text-neutral-600 text-sm ml-1">{plan.period}</span>
                </div>
                <CardDescription className="dark:text-white/60 text-neutral-600">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                      <span className="dark:text-white/70 text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <SignedOut>
                  <Link href="/register">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white' 
                          : 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-neutral-900 dark:text-white hover:bg-black/10'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/settings">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white' 
                          : 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-neutral-900 dark:text-white hover:bg-black/10'
                      }`}
                    >
                      {plan.popular ? 'Manage Plan' : plan.cta}
                    </Button>
                  </Link>
                </SignedIn>
              </CardContent>
            </Card>
          ))}
            </div>
          </>
        )}
        
        {/* Features comparison */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 dark:text-white text-neutral-900">Feature Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
                  <h3 className="text-lg font-semibold dark:text-white text-neutral-900">Deep Research Mode</h3>
                </div>
                <p className="dark:text-white/70 text-neutral-700 text-sm mb-4">
                  Access comprehensive research capabilities with multiple sources and enhanced analysis.
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">Pro only</span>
                  <Shield className="w-4 h-4 text-green-700 dark:text-green-400 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold dark:text-white text-neutral-900">Enhanced Search</h3>
                </div>
                <p className="dark:text-white/70 text-neutral-700 text-sm mb-4">
                  Priority access to search results with better quality and faster response times.
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">Pro only</span>
                  <Shield className="w-4 h-4 text-green-700 dark:text-green-400 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <h3 className="text-lg font-semibold dark:text-white text-neutral-900">Unlimited Messages</h3>
                </div>
                <p className="dark:text-white/70 text-neutral-700 text-sm mb-4">
                  Send as many messages as you want without hitting hourly limits.
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">Pro only</span>
                  <Shield className="w-4 h-4 text-green-700 dark:text-green-400 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 dark:text-white text-neutral-900">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 dark:text-white text-neutral-900">Can I upgrade or downgrade at any time?</h3>
                <p className="dark:text-white/70 text-neutral-700 text-sm">
                  Yes, you can change your plan at any time. When upgrading, you'll get immediate access to Pro features. 
                  When downgrading, your plan will change at the end of your current billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 dark:text-white text-neutral-900">What payment methods do you accept?</h3>
                <p className="dark:text-white/70 text-neutral-700 text-sm">
                  We accept all major credit cards through our secure payment processor Stripe.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 dark:text-white text-neutral-900">How does the free tier work?</h3>
                <p className="dark:text-white/70 text-neutral-700 text-sm">
                  The free tier allows you to send 15 messages per hour. This is perfect for casual users who 
                  want to try out the service without commitment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="dark:text-white/70 text-neutral-600 mb-6">
            Ready to unlock the full potential of Lotus?
          </p>
          <SignedOut>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white">
                <Crown className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Button onClick={startCheckout} disabled={loading} className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white">
              <Crown className="w-5 h-5 mr-2" />
              {loading ? 'Opening…' : 'Upgrade Now'}
            </Button>
          </SignedIn>
        </div>
      </div>
    </div>
  )
}
