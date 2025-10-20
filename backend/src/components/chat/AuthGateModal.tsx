"use client"

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus, X } from 'lucide-react'

interface AuthGateModalProps {
  isOpen: boolean
}

export default function AuthGateModal({ isOpen }: AuthGateModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          >
            <div className="premium-card max-w-lg w-full p-8 sm:p-10 backdrop-blur-2xl border-2 border-white/20 shadow-2xl relative">
              {/* Content */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Continue?
                </h2>
                <p className="text-base sm:text-lg text-white/80 mb-8 leading-relaxed">
                  You've experienced a glimpse of MROR's adaptive AI. Sign up to unlock unlimited conversations with persistent memory.
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-8 text-left">
                  {[
                    'Unlimited conversations with adaptive AI',
                    'Persistent memory across all chats',
                    'Access to all AI models and features',
                    'Image generation and multi-modal support'
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3 text-white/90"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm sm:text-base">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Link href="/register" className="block">
                    <Button
                      size="lg"
                      className="w-full premium-button text-lg sm:text-xl font-bold py-6 sm:py-7 flex items-center justify-center gap-3"
                    >
                      <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Start Your 14-Day Free Trial</span>
                    </Button>
                  </Link>

                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white text-base sm:text-lg font-semibold py-5 sm:py-6 flex items-center justify-center gap-3 transition-all"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Already have an account? Log in</span>
                    </Button>
                  </Link>
                </div>

                <p className="mt-6 text-xs sm:text-sm text-white/60">
                  No credit card required • Cancel anytime • $5/month after trial
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
