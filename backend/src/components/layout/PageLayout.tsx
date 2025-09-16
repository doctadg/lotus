"use client"

import { ReactNode } from 'react'
import DynamicNavbar from '@/components/landing/DynamicNavbar'
import FadeInView from '@/components/landing/FadeInView'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  backText?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full'
  className?: string
}

export default function PageLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backHref = '/',
  backText = 'Back to Home',
  maxWidth = '6xl',
  className = ''
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white">
      <DynamicNavbar />

      <main className={`pt-20 pb-16 ${className}`}>
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]}`}>
          {showBackButton && (
            <FadeInView direction="right" className="mb-8">
              <Link
                href={backHref}
                className="inline-flex items-center text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                {backText}
              </Link>
            </FadeInView>
          )}

          {(title || subtitle) && (
            <FadeInView direction="up" className="text-center mb-12 lg:mb-16">
              {title && (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-4 lg:mb-6">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg sm:text-xl text-neutral-600 dark:text-white/70 max-w-3xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </FadeInView>
          )}

          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t dark:border-white/10 border-black/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="md:col-span-2">
                <div className="flex items-center mb-4">
                  <img src="/lotus-full.svg" alt="Lotus" className="h-8 w-auto opacity-80 dark:filter dark:brightness-0 dark:invert" />
                </div>
                <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed max-w-md">
                  AI that evolves with you. Experience intelligence that adapts, learns, and grows.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4 text-neutral-900 dark:text-white">Product</h4>
                <ul className="space-y-2">
                  <li><Link href="/features" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Features</Link></li>
                  <li><Link href="/pricing" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Pricing</Link></li>
                  <li><Link href="/blog" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Blog</Link></li>
                  <li><Link href="/research" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Research</Link></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-semibold mb-4 text-neutral-900 dark:text-white">Support</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Contact</a></li>
                  <li><a href="#" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t dark:border-white/10 border-black/10 mt-8 pt-8 text-center">
              <p className="text-neutral-500 dark:text-white/50 text-sm">
                © 2024 Lotus. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}