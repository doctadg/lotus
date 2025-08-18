import React from 'react'
import {
  View,
  ViewProps,
  StyleSheet,
  ViewStyle
} from 'react-native'
import { theme } from '../../constants/theme'

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  style,
  ...props
}: CardProps) {
  const cardStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    padding !== 'none' && styles[`padding_${padding}` as keyof typeof styles] as ViewStyle,
    style as ViewStyle
  ].filter(Boolean) as ViewStyle[]

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  
  // Variants
  default: {
    // No additional styles
  },
  elevated: {
    ...theme.shadows.md,
  },
  
  // Padding
  padding_sm: {
    padding: theme.spacing.sm,
  },
  padding_md: {
    padding: theme.spacing.lg,
  },
  padding_lg: {
    padding: theme.spacing.xl,
  },
})