'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Crown, Sparkles } from 'lucide-react'

interface UpgradePromptProps {
  onUpgrade: () => void
  onClose: () => void
}

export function UpgradePrompt({ onUpgrade, onClose }: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      await onUpgrade()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gradient-to-br from-purple-900/80 to-black border border-purple-500/30 rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <p className="text-white/80 mb-6">
            You've reached your hourly message limit. Upgrade to Pro for unlimited messages and access to advanced features.
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-sm text-white/70">Unlimited messages per hour</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-sm text-white/70">Deep research mode</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-sm text-white/70">Enhanced memory extraction</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro - $5/month
                </span>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
