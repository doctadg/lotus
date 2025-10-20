import React from 'react'
import { Image, View } from 'react-native'

interface LogoProps {
  size?: number
  color?: string
}

export function MrorIcon({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('../../assets/images/icon.png')}
        style={{ width: size, height: size, tintColor: '#ffffff' }}
        resizeMode="contain"
      />
    </View>
  )
}

export function MrorFullLogo({ width = 200, height = 52 }: { width?: number; height?: number }) {
  return (
    <View style={{ width, height }}>
      <Image
        source={require('../../assets/images/mror-full.png')}
        style={{ width, height, tintColor: '#ffffff' }}
        resizeMode="contain"
      />
    </View>
  )
}

// Backwards compatibility aliases
export const LotusIcon = MrorIcon
export const LotusFullLogo = MrorFullLogo
