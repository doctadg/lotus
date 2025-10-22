"use client"
import { memo } from 'react'
import GradientBlinds from '@/components/ui/GradientBlinds'

const HeroBackground = memo(() => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <GradientBlinds
        gradientColors={['#1a1a1a', '#404040']}
        angle={45}
        noise={0.3}
        blindCount={12}
        blindMinWidth={50}
        spotlightRadius={0.5}
        spotlightSoftness={1}
        spotlightOpacity={1}
        mouseDampening={0.15}
        distortAmount={0}
        shineDirection="left"
        mixBlendMode="lighten"
      />
    </div>
  )
})

HeroBackground.displayName = 'HeroBackground'

export default HeroBackground