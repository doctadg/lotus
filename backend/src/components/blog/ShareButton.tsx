"use client"

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  title: string
  className?: string
}

export default function ShareButton({ title, className }: ShareButtonProps) {
  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    const shareText = `Check out this article: ${title}`

    if (navigator.share) {
      navigator.share({
        title: title,
        text: shareText,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className={`inline-flex items-center space-x-2 ${className || ''}`}
    >
      <Share2 className="w-4 h-4" />
      <span>Share Article</span>
    </Button>
  )
}