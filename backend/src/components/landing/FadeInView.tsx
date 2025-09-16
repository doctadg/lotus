"use client"

import { useRef, useEffect, ReactNode } from 'react'
import { motion, useInView, useAnimation, Variants } from 'framer-motion'

interface FadeInViewProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  amount?: number
  once?: boolean
}

export default function FadeInView({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  direction = 'up',
  amount = 0.3,
  once = true
}: FadeInViewProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount })
  const controls = useAnimation()

  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 }
  }

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else if (!once) {
      controls.start("hidden")
    }
  }, [isInView, controls, once])

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...directionOffset[direction]
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}