"use client"

import Link from 'next/link'
import { Brain, ImageIcon, Zap, Shield, Heart, Layers, ArrowRight, CheckCircle } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import HoverCard from '@/components/landing/HoverCard'
import { Button } from '@/components/ui/button'

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Brain,
      title: "AI Memory System",
      description: "Persistent memory that learns and adapts to your unique style, preferences, and project context across all conversations.",
      benefits: [
        "Remembers your preferences and context",
        "Builds understanding over time",
        "Maintains project continuity",
        "Adapts to your communication style"
      ],
      href: "/features/memory",
      color: "blue"
    },
    {
      icon: ImageIcon,
      title: "Image Generation & Editing",
      description: "Advanced AI-powered image creation and editing tools that understand your creative vision and adapt to your style.",
      benefits: [
        "Generate images from text descriptions",
        "Edit existing images with natural language",
        "Style-consistent image variations",
        "High-resolution output for professional use"
      ],
      href: "/features/images",
      color: "purple"
    }
  ]

  const additionalFeatures = [
    {
      icon: Zap,
      title: "Multi-Modal Intelligence",
      description: "Seamlessly work with text, images, code, and documents in a unified experience.",
      color: "yellow"
    },
    {
      icon: Shield,
      title: "Privacy-First Architecture",
      description: "Your conversations are encrypted and never used for training. Complete data sovereignty.",
      color: "green"
    },
    {
      icon: Heart,
      title: "Adaptive Personalization",
      description: "AI that learns your working style and becomes more helpful over time.",
      color: "red"
    },
    {
      icon: Layers,
      title: "Advanced Model Access",
      description: "Access to Claude, GPT-4, and specialized models optimized for different tasks.",
      color: "indigo"
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        button: 'bg-green-600 hover:bg-green-700'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-700'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <PageLayout
      title="Features"
      subtitle="Discover the powerful capabilities that make Lotus the most adaptive AI assistant"
      maxWidth="6xl"
    >
      {/* Main Features */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Core Capabilities
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {mainFeatures.map((feature, index) => {
            const colorClasses = getColorClasses(feature.color)
            return (
              <HoverCard
                key={index}
                className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8"
                scale={1.02}
              >
                <div className={`w-16 h-16 ${colorClasses.bg} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-8 h-8 ${colorClasses.icon}`} />
                </div>

                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                  {feature.title}
                </h3>

                <p className="text-neutral-600 dark:text-white/70 text-lg leading-relaxed mb-6">
                  {feature.description}
                </p>

                <div className="space-y-3 mb-8">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-neutral-700 dark:text-white/80">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Link href={feature.href}>
                  <Button className={`w-full ${colorClasses.button} text-white font-semibold`}>
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </HoverCard>
            )
          })}
        </div>
      </FadeInView>

      {/* Additional Features Grid */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Additional Capabilities
        </h2>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
          {additionalFeatures.map((feature, index) => {
            const colorClasses = getColorClasses(feature.color)
            return (
              <HoverCard
                key={index}
                className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 text-center"
                scale={1.05}
              >
                <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-6 h-6 ${colorClasses.icon}`} />
                </div>

                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                  {feature.title}
                </h3>

                <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </HoverCard>
            )
          })}
        </StaggerChildren>
      </FadeInView>

      {/* Feature Comparison */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          How Lotus Compares
        </h2>
        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-white/5">
                <tr>
                  <th className="text-left p-6 font-semibold text-neutral-900 dark:text-white">Feature</th>
                  <th className="text-center p-6 font-semibold text-neutral-900 dark:text-white">Lotus</th>
                  <th className="text-center p-6 font-semibold text-neutral-600 dark:text-white/70">ChatGPT Plus</th>
                  <th className="text-center p-6 font-semibold text-neutral-600 dark:text-white/70">Claude Pro</th>
                  <th className="text-center p-6 font-semibold text-neutral-600 dark:text-white/70">Gemini Advanced</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Persistent Memory",
                    lotus: "✓ Full context retention",
                    chatgpt: "✗ Session-only",
                    claude: "✗ Limited memory",
                    gemini: "✗ Basic context"
                  },
                  {
                    feature: "Privacy Protection",
                    lotus: "✓ Never trains on your data",
                    chatgpt: "⚠ Opt-out required",
                    claude: "⚠ Data stored for safety",
                    gemini: "⚠ Default data collection"
                  },
                  {
                    feature: "Image Generation",
                    lotus: "✓ Advanced creation & editing",
                    chatgpt: "✓ DALL-E integration",
                    claude: "✗ Limited capabilities",
                    gemini: "✓ Imagen integration"
                  },
                  {
                    feature: "Model Access",
                    lotus: "✓ Multiple latest models",
                    chatgpt: "GPT-4o, o3-mini",
                    claude: "Claude 4 models",
                    gemini: "Gemini 2.5 Pro"
                  },
                  {
                    feature: "Monthly Cost",
                    lotus: "$5",
                    chatgpt: "$20",
                    claude: "$20",
                    gemini: "$20"
                  }
                ].map((row, index) => (
                  <tr key={index} className="border-t border-neutral-200 dark:border-white/10">
                    <td className="p-6 font-medium text-neutral-900 dark:text-white">{row.feature}</td>
                    <td className="p-6 text-center text-green-600 dark:text-green-400 font-medium">{row.lotus}</td>
                    <td className="p-6 text-center text-neutral-600 dark:text-white/70">{row.chatgpt}</td>
                    <td className="p-6 text-center text-neutral-600 dark:text-white/70">{row.claude}</td>
                    <td className="p-6 text-center text-neutral-600 dark:text-white/70">{row.gemini}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeInView>

      {/* CTA Section */}
      <FadeInView direction="up" className="text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Experience the Difference
          </h2>
          <p className="text-xl text-neutral-600 dark:text-white/70 mb-8 max-w-2xl mx-auto">
            Try Lotus risk-free for 14 days and discover what AI feels like when it truly adapts to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="font-semibold px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </FadeInView>
    </PageLayout>
  )
}

export const metadata = {
  title: 'Features | Lotus AI',
  description: 'Discover the powerful capabilities that make Lotus the most adaptive AI assistant. Persistent memory, privacy-first design, and advanced image tools.',
}