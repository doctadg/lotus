import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme } from '../constants/theme'

interface NavigationItem {
  name: string
  href: string
  icon: keyof typeof Feather.glyphMap
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/home', icon: 'home' },
  { name: 'Memories', href: '/memories', icon: 'book' },
  { name: 'Profile', href: '/profile', icon: 'user' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
]

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <TouchableOpacity
            key={item.href}
            style={styles.navItem}
            onPress={() => router.push(item.href)}
          >
            <Feather 
              name={item.icon} 
              size={24} 
              color={isActive ? theme.colors.text : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              isActive && styles.navItemTextActive
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs
  },
  navItemText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular
  },
  navItemTextActive: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium
  }
})
