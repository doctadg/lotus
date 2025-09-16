"use client"

import { motion } from 'framer-motion'

interface AnimatedBlobProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  colors?: string[]
  animate?: boolean
}

export default function AnimatedBlob({
  className = "",
  size = 'lg',
  colors = ['#ffffff', '#e5e7eb', '#d1d5db'],
  animate = true
}: AnimatedBlobProps) {
  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
    xl: 'w-[500px] h-[500px]'
  }

  const gradientId = `blob-gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <motion.svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        animate={animate ? {
          rotate: [0, 360],
        } : {}}
        transition={animate ? {
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        } : {}}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (colors.length - 1)) * 100}%`}
                stopColor={color}
                stopOpacity={index === 0 ? 0.8 : index === colors.length - 1 ? 0.2 : 0.5}
              />
            ))}
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <motion.path
          d="M 250,100
             C 350,100 400,150 400,250
             C 400,350 350,400 250,400
             C 150,400 100,350 100,250
             C 100,150 150,100 250,100 Z"
          fill={`url(#${gradientId})`}
          filter="url(#glow)"
          animate={animate ? {
            d: [
              "M 250,100 C 350,100 400,150 400,250 C 400,350 350,400 250,400 C 150,400 100,350 100,250 C 100,150 150,100 250,100 Z",
              "M 250,120 C 330,90 420,180 380,260 C 420,340 330,410 250,380 C 170,410 80,340 120,260 C 80,180 170,90 250,120 Z",
              "M 250,90 C 360,110 390,160 410,250 C 390,360 360,390 250,410 C 140,390 110,360 90,250 C 110,160 140,110 250,90 Z",
              "M 250,100 C 350,100 400,150 400,250 C 400,350 350,400 250,400 C 150,400 100,350 100,250 C 100,150 150,100 250,100 Z"
            ]
          } : {}}
          transition={animate ? {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
      </motion.svg>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl" />

      <motion.div
        className="absolute inset-0"
        animate={animate ? {
          background: [
            'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
          ]
        } : {}}
        transition={animate ? {
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
    </div>
  )
}