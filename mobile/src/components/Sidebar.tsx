import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import { useRouter, usePathname } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme } from '../constants/theme'

interface SidebarItem {
  name: string
  href: string
  icon: keyof typeof Feather.glyphMap
}

const sidebarItems: SidebarItem[] = [
  { name: 'Home', href: '/home', icon: 'home' },
  { name: 'Memories', href: '/memories', icon: 'book' },
  { name: 'Profile', href: '/profile', icon: 'user' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
  { name: 'Subscription', href: '/subscription', icon: 'credit-card' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const translateX = new Animated.Value(-300)

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -300,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [isOpen])

  const handleNavigate = (href: string) => {
    router.push(href as any)
    onClose()
  }

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  )

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent
      
      if (translationX > 100 || velocityX > 500) {
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()
      } else {
        Animated.timing(translateX, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }).start()
        onClose()
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuItems}>
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <TouchableOpacity
                  key={item.href}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive
                  ]}
                  onPress={() => handleNavigate(item.href)}
                >
                  <Feather 
                    name={item.icon} 
                    size={20} 
                    color={isActive ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: theme.colors.background,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  menuItems: {
    flex: 1,
    paddingTop: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  menuItemText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  menuItemTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
})