"use client"

import { useState } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import DynamicNavbar from '@/components/landing/DynamicNavbar'
import BlogPageContent from '@/components/blog/BlogPageContent'
import GradientBlinds from '@/components/ui/GradientBlinds'

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white">
      <DynamicNavbar />

      {/* Hero Section with GradientBlinds */}
      <section className="relative overflow-hidden" style={{ minHeight: '30vh' }}>
        {/* GradientBlinds Background */}
        <div className="absolute inset-0 z-0">
          <GradientBlinds
            gradientColors={['#1a1a1a', '#404040']}
            angle={45}
            noise={0.3}
            blindCount={12}
            blindMinWidth={50}
            spotlightRadius={0.5}
            spotlightSoftness={1}
            spotlightOpacity={1}
            mouseDampening={0.15}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="lighten"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-center" style={{ minHeight: '30vh' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center py-12">
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
                Mror AI Blog
              </h1>
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Insights on AI, privacy, technology, and the future of personalized intelligence
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all backdrop-blur-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Gradient Fade at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent z-10"></div>
      </section>

      {/* Blog Content */}
      <main className="relative z-20 -mt-8 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <BlogPageContent searchTerm={searchTerm} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t dark:border-white/10 border-black/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-neutral-500 dark:text-white/50 text-sm">
              © 2025 Mror AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}