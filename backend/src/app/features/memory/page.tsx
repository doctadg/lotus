"use client"

import Link from 'next/link'
import { Brain, Clock, Users, Zap, CheckCircle, ArrowRight, RefreshCw, Database, Shield } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import HoverCard from '@/components/landing/HoverCard'
import { Button } from '@/components/ui/button'

export default function MemoryFeaturePage() {
  const memoryBenefits = [
    {
      icon: RefreshCw,
      title: "Continuous Learning",
      description: "Lotus remembers your preferences, communication style, and project context across all conversations.",
      examples: [
        "Remembers your preferred explanation style (technical vs. simple)",
        "Adapts to your communication tone and language preferences",
        "Maintains context of ongoing projects and goals"
      ]
    },
    {
      icon: Database,
      title: "Semantic Understanding",
      description: "Advanced memory system that understands relationships and context, not just text storage.",
      examples: [
        "Connects related concepts across different conversations",
        "Understands project hierarchies and dependencies",
        "Maps relationships between ideas and decisions"
      ]
    },
    {
      icon: Clock,
      title: "Temporal Awareness",
      description: "Smart memory that understands how your needs and preferences change over time.",
      examples: [
        "Prioritizes recent preferences over older ones",
        "Tracks the evolution of your projects and goals",
        "Maintains historical context while adapting to changes"
      ]
    },
    {
      icon: Shield,
      title: "Privacy-Preserving",
      description: "All memory is encrypted and belongs only to you. Never shared or used for training.",
      examples: [
        "End-to-end encrypted memory storage",
        "Complete user control over memory retention",
        "Never used to train models or shared with others"
      ]
    }
  ]

  const useCases = [
    {
      title: "Research & Analysis",
      icon: "🔬",
      description: "Build comprehensive knowledge bases over time",
      details: [
        "Maintains research context across sessions",
        "Builds on previous findings and insights",
        "Remembers research methodologies you prefer",
        "Tracks source credibility and relevance"
      ]
    },
    {
      title: "Creative Projects",
      icon: "🎨",
      description: "Consistent creative vision across all work",
      details: [
        "Maintains your creative voice and style",
        "Remembers character development and plot points",
        "Tracks design preferences and brand guidelines",
        "Builds on previous creative decisions"
      ]
    },
    {
      title: "Software Development",
      icon: "💻",
      description: "Understand your codebase and preferences",
      details: [
        "Learns your coding style and conventions",
        "Remembers project architecture and decisions",
        "Tracks technical debt and improvement areas",
        "Maintains context of development goals"
      ]
    },
    {
      title: "Business Strategy",
      icon: "📊",
      description: "Strategic thinking with full context",
      details: [
        "Remembers company goals and constraints",
        "Tracks stakeholder preferences and concerns",
        "Maintains context of strategic decisions",
        "Builds comprehensive competitive analysis"
      ]
    }
  ]

  return (
    <PageLayout
      title="AI Memory System"
      subtitle="Experience AI that remembers, learns, and grows with you across every conversation"
      showBackButton
      backHref="/features"
      backText="Back to Features"
      maxWidth="6xl"
    >
      {/* Hero Section */}
      <FadeInView direction="up" className="mb-20">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-12 text-center">
          <Brain className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            The Problem with Forgetful AI
          </h2>
          <p className="text-xl text-neutral-600 dark:text-white/70 max-w-3xl mx-auto">
            Traditional AI forgets everything between conversations. Every interaction starts from scratch,
            requiring you to re-explain context, preferences, and goals repeatedly.
          </p>
        </div>
      </FadeInView>

      {/* Memory Benefits */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          How Lotus Memory Works
        </h2>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8" stagger={0.1}>
          {memoryBenefits.map((benefit, index) => (
            <HoverCard
              key={index}
              className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8"
              scale={1.02}
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                {benefit.title}
              </h3>

              <p className="text-neutral-600 dark:text-white/70 mb-6 leading-relaxed">
                {benefit.description}
              </p>

              <div className="space-y-3">
                {benefit.examples.map((example, exampleIndex) => (
                  <div key={exampleIndex} className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-white/80 text-sm">{example}</span>
                  </div>
                ))}
              </div>
            </HoverCard>
          ))}
        </StaggerChildren>
      </FadeInView>

      {/* Use Cases */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Memory in Action
        </h2>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8" stagger={0.1}>
          {useCases.map((useCase, index) => (
            <HoverCard
              key={index}
              className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8"
              scale={1.02}
            >
              <div className="text-4xl mb-4">{useCase.icon}</div>

              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                {useCase.title}
              </h3>

              <p className="text-neutral-600 dark:text-white/70 mb-6 leading-relaxed">
                {useCase.description}
              </p>

              <div className="space-y-3">
                {useCase.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-white/80 text-sm">{detail}</span>
                  </div>
                ))}
              </div>
            </HoverCard>
          ))}
        </StaggerChildren>
      </FadeInView>

      {/* Technical Deep Dive */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Technical Architecture
        </h2>
        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Semantic Indexing</h3>
              <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed">
                We don't just store text - we create semantic representations that capture meaning and relationships.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Temporal Weighting</h3>
              <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed">
                Advanced algorithms that understand when information was discussed and how it relates to current needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Privacy Protection</h3>
              <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed">
                All memory is encrypted and isolated to your account. You maintain complete control.
              </p>
            </div>
          </div>
        </div>
      </FadeInView>

      {/* Comparison */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Memory Comparison
        </h2>
        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-white/5">
                <tr>
                  <th className="text-left p-6 font-semibold text-neutral-900 dark:text-white">Memory Feature</th>
                  <th className="text-center p-6 font-semibold text-neutral-900 dark:text-white">Lotus</th>
                  <th className="text-center p-6 font-semibold text-neutral-600 dark:text-white/70">Traditional AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Cross-session memory",
                    lotus: "✓ Full persistence",
                    traditional: "✗ Resets every time"
                  },
                  {
                    feature: "Context understanding",
                    lotus: "✓ Deep semantic memory",
                    traditional: "✗ Surface-level only"
                  },
                  {
                    feature: "Preference learning",
                    lotus: "✓ Adapts over time",
                    traditional: "✗ No learning"
                  },
                  {
                    feature: "Project continuity",
                    lotus: "✓ Maintains full context",
                    traditional: "✗ Fragmented sessions"
                  },
                  {
                    feature: "Privacy control",
                    lotus: "✓ User-controlled",
                    traditional: "⚠ Often used for training"
                  }
                ].map((row, index) => (
                  <tr key={index} className="border-t border-neutral-200 dark:border-white/10">
                    <td className="p-6 font-medium text-neutral-900 dark:text-white">{row.feature}</td>
                    <td className="p-6 text-center text-green-600 dark:text-green-400 font-medium">{row.lotus}</td>
                    <td className="p-6 text-center text-red-600 dark:text-red-400 font-medium">{row.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeInView>

      {/* CTA */}
      <FadeInView direction="up" className="text-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Experience AI with Memory
          </h2>
          <p className="text-xl text-neutral-600 dark:text-white/70 mb-8 max-w-2xl mx-auto">
            Try Lotus and discover what it feels like to work with AI that truly remembers and grows with you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="font-semibold px-8">
                View All Features
              </Button>
            </Link>
          </div>
        </div>
      </FadeInView>
    </PageLayout>
  )
}

export const metadata = {
  title: 'AI Memory System | Lotus Features',
  description: 'Discover how Lotus\'s advanced memory system creates persistent, context-aware AI that learns and adapts to your unique needs over time.',
}