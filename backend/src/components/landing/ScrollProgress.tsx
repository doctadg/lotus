"use client"
import { memo } from 'react'
import { motion, useScroll } from 'framer-motion'

const ScrollProgress = memo(() => {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-white via-gray-300 to-white z-50 origin-left"
      style={{ 
        scaleX: scrollYProgress,
        willChange: 'transform'
      }}
    />
  )
})

ScrollProgress.displayName = 'ScrollProgress'

export default ScrollProgress