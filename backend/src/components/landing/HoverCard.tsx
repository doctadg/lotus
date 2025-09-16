"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface HoverCardProps {
  children: ReactNode
  className?: string
  scale?: number
  y?: number
  shadow?: boolean
  glow?: boolean
}

export default function HoverCard({
  children,
  className = "",
  scale = 1.02,
  y = -4,
  shadow = true,
  glow = false
}: HoverCardProps) {
  return (
    <motion.div
      className={`${className} ${glow ? 'hover:white-glow' : ''}`}
      whileHover={{
        scale,
        y,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      }}
      style={shadow ? {
        transition: "box-shadow 0.3s ease"
      } : {}}
      onHoverStart={() => {
        if (shadow) {
          const element = document.activeElement as HTMLElement
          if (element) {
            element.style.boxShadow = "0 10px 30px rgba(255, 255, 255, 0.1)"
          }
        }
      }}
      onHoverEnd={() => {
        if (shadow) {
          const element = document.activeElement as HTMLElement
          if (element) {
            element.style.boxShadow = ""
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}