"use client"

import { useEffect, useRef } from 'react'

interface GrayGlowBackgroundProps {
  className?: string
  intensity?: number
}

export default function GrayGlowBackground({ 
  className = "", 
  intensity = 0.5 
}: GrayGlowBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create floating orbs
    const orbs: HTMLDivElement[] = []
    const numOrbs = 6

    for (let i = 0; i < numOrbs; i++) {
      const orb = document.createElement('div')
      orb.className = 'absolute rounded-full pointer-events-none'
      
      // Random size between 100px and 300px
      const size = Math.random() * 200 + 100
      orb.style.width = `${size}px`
      orb.style.height = `${size}px`
      
      // Gray glow effect with different intensities
      const glowIntensity = 0.02 + Math.random() * 0.05 * intensity
      orb.style.background = `radial-gradient(circle, rgba(255, 255, 255, ${glowIntensity}) 0%, transparent 70%)`
      orb.style.filter = `blur(${Math.random() * 20 + 10}px)`
      
      // Random starting position
      orb.style.left = `${Math.random() * 100}%`
      orb.style.top = `${Math.random() * 100}%`
      
      // Animation
      const duration = 20 + Math.random() * 20 // 20-40s
      const delay = Math.random() * -20 // Start at random time
      orb.style.animation = `float ${duration}s ${delay}s infinite linear`
      
      container.appendChild(orb)
      orbs.push(orb)
    }

    return () => {
      orbs.forEach(orb => {
        if (container.contains(orb)) {
          container.removeChild(orb)
        }
      })
    }
  }, [intensity])

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(255, 255, 255, 0.01) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(255, 255, 255, 0.015) 0%, transparent 50%),
          radial-gradient(ellipse at 40% 60%, rgba(255, 255, 255, 0.008) 0%, transparent 50%)
        `
      }}
    >
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.6;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.4;
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}