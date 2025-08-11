'use client'

import React, { useState, useEffect } from 'react'
import { ExternalLink, Globe, Image as ImageIcon } from 'lucide-react'

interface LinkPreviewProps {
  url: string
  children: React.ReactNode
}

interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  domain?: string
  favicon?: string
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, children }) => {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchMetadata = async (url: string): Promise<LinkMetadata | null> => {
    try {
      // In a real implementation, this would call a backend service
      // that fetches and parses the page metadata
      const domain = new URL(url).hostname
      
      // Mock metadata for demonstration
      return {
        title: 'Example Page Title',
        description: 'This is an example description of the linked page content.',
        domain,
        favicon: `https://${domain}/favicon.ico`,
        image: undefined
      }
    } catch (error) {
      console.error('Failed to fetch link metadata:', error)
      return null
    }
  }

  useEffect(() => {
    if (showPreview && !metadata && !loading) {
      setLoading(true)
      fetchMetadata(url).then(data => {
        setMetadata(data)
        setLoading(false)
      })
    }
  }, [showPreview, url, metadata, loading])

  const isExternalLink = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname !== window.location.hostname
    } catch {
      return false
    }
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  return (
    <span className="link-preview-container relative inline-block">
      <a
        href={url}
        target={isExternalLink(url) ? '_blank' : '_self'}
        rel={isExternalLink(url) ? 'noopener noreferrer' : ''}
        className="link-with-preview inline-flex items-center gap-1 text-accent-primary hover:text-accent-primary-hover underline decoration-1 underline-offset-2 transition-colors"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {children}
        {isExternalLink(url) && (
          <ExternalLink size={12} className="opacity-70" />
        )}
      </a>

      {/* Link Preview Tooltip */}
      {showPreview && (
        <div className="link-preview-tooltip absolute bottom-full left-0 mb-2 w-80 max-w-sm bg-surface-elevated border border-border rounded-lg shadow-lg z-50 opacity-0 animate-fade-in">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full"></div>
                <span className="text-sm text-text-tertiary">Loading preview...</span>
              </div>
            ) : metadata ? (
              <>
                {/* Preview Header */}
                <div className="flex items-center space-x-2 mb-3">
                  {metadata.favicon ? (
                    <img
                      src={metadata.favicon}
                      alt=""
                      className="w-4 h-4 rounded"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <Globe size={14} className="text-text-tertiary" />
                  )}
                  <span className="text-xs text-text-tertiary truncate">
                    {metadata.domain || getDomain(url)}
                  </span>
                </div>

                {/* Preview Image */}
                {metadata.image && (
                  <div className="mb-3 rounded-md overflow-hidden">
                    <img
                      src={metadata.image}
                      alt=""
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).parentElement?.remove()
                      }}
                    />
                  </div>
                )}

                {/* Preview Content */}
                <div>
                  {metadata.title && (
                    <h4 className="font-medium text-text-primary text-sm mb-2 line-clamp-2">
                      {metadata.title}
                    </h4>
                  )}
                  {metadata.description && (
                    <p className="text-xs text-text-secondary line-clamp-3">
                      {metadata.description}
                    </p>
                  )}
                </div>

                {/* Preview URL */}
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-text-tertiary truncate block">
                    {url}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-text-tertiary">
                Unable to load preview
              </div>
            )}
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-border"></div>
        </div>
      )}

      <style jsx>{`
        .link-preview-tooltip {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </span>
  )
}