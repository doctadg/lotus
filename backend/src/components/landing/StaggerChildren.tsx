"use client"

import { ReactNode, Children } from 'react'
import { motion } from 'framer-motion'

interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  stagger?: number
  duration?: number
  delay?: number
  once?: boolean
}

export default function StaggerChildren({
  children,
  className = "",
  stagger = 0.1,
  duration = 0.5,
  delay = 0,
  once = true
}: StaggerChildrenProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: stagger
      }
    }
  }

  const item = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
    >
      {Children.map(children, (child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}