'use client'

import Image from 'next/image'
import { useTheme } from '../../hooks/useTheme'

interface LogoProps {
  variant?: 'full' | 'icon'
  width?: number
  height?: number
  className?: string
}

export function Logo({ variant = 'full', width, height, className = '' }: LogoProps) {
  const { isDark } = useTheme()

  const logoSrc = variant === 'full' ? '/mror-full.png' : '/mror.png'
  
  const defaultDimensions = variant === 'full' 
    ? { width: width || 120, height: height || 40 }
    : { width: width || 32, height: height || 32 }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSrc}
        alt={variant === 'full' ? 'MROR' : 'MROR Icon'}
        {...defaultDimensions}
        className={isDark ? 'brightness-0 invert' : ''}
        priority
      />
    </div>
  )
}