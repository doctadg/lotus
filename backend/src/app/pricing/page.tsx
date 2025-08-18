'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Crown, Sparkles, Search, Zap, Shield } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  
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
    <div className="min-h-screen bg-black text-white">
      {/* Dither Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full">
          {/* Simple gradient background as a placeholder for dither effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        </div>
        {/* Overlay to soften dither effect */}
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            Choose the plan that works best for you. Upgrade or downgrade at any time.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-text-secondary'}`}>
              Monthly
            </span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative rounded-full w-14 h-7 bg-white/10 border border-white/20 transition-colors"
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${isAnnual ? 'left-8' : 'left-1'}`}></div>
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-text-secondary'}`}>
              Annual <span className="text-xs bg-gradient-to-r from-blue-400 to-purple-500 text-white px-2 py-1 rounded-full ml-1">Save 15%</span>
            </span>
          </div>
        </div>
        
        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`bg-white/5 border-white/10 relative overflow-hidden ${
                plan.popular ? 'border-2 border-purple-500' : ''
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
                  <span className="text-text-secondary text-sm ml-1">{plan.period}</span>
                </div>
                <CardDescription className="text-text-secondary">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.ctaVariant as any}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                  onClick={() => {
                    if (plan.popular) {
                      // In a real implementation, this would redirect to the checkout page
                      window.location.href = '/settings'
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Features comparison */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Feature Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-400 mr-3" />
                  <h3 className="text-lg font-semibold">Deep Research Mode</h3>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Access comprehensive research capabilities with multiple sources and enhanced analysis.
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-400 font-medium">Pro only</span>
                  <Shield className="w-4 h-4 text-green-400 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Search className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-lg font-semibold">Enhanced Search</h3>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Priority access to search results with better quality and faster response times.
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-400 font-medium">Pro only</span>
                  <Shield className="w-4 h-4 text-green-400 ml-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-400 mr-3" />
                  <h3 className="text-lg font-semibold">Unlimited Messages</h3>
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Send as many messages as you want without hitting hourly limits.
                </p>
                <div className="flex items-center text-sm">
                  <span className="text-green-400 font-medium">Pro only</span>
                  <Shield className="w-4 h-4 text-green-400 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I upgrade or downgrade at any time?</h3>
                <p className="text-text-secondary text-sm">
                  Yes, you can change your plan at any time. When upgrading, you'll get immediate access to Pro features. 
                  When downgrading, your plan will change at the end of your current billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-text-secondary text-sm">
                  We accept all major credit cards through our secure payment processor Stripe.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How does the free tier work?</h3>
                <p className="text-text-secondary text-sm">
                  The free tier allows you to send 15 messages per hour. This is perfect for casual users who 
                  want to try out the service without commitment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary mb-6">
            Ready to unlock the full potential of Lotus?
          </p>
          <Link href="/settings">
            <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white">
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
