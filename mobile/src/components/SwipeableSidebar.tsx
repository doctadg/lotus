import React, { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import { useRouter, usePathname } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme } from '../constants/theme'
import { Image } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SIDEBAR_WIDTH = 300

interface SidebarItem {
  name: string
  href: string
  icon: keyof typeof Feather.glyphMap
}

const sidebarItems: SidebarItem[] = [
  { name: 'Profile', href: '/profile', icon: 'user' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
  { name: 'Subscription', href: '/subscription', icon: 'credit-card' },
]

interface SwipeableSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  user?: any
  isPro?: boolean
  chatSessions?: any[]
  onLoadChat?: (chatId: string) => void
  onNewChat?: () => void
  onLogout?: () => void
}

export default function SwipeableSidebar({
  isOpen,
  onClose,
  onOpen,
  user,
  isPro,
  chatSessions = [],
  onLoadChat,
  onNewChat,
  onLogout
}: SwipeableSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start()
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
      const { translationX, velocityX, absoluteX } = event.nativeEvent
      
      // Determine if we should open or close based on gesture
      const shouldOpen = translationX > -SIDEBAR_WIDTH / 2 || velocityX > 500
      
      if (shouldOpen) {
        onOpen()
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start()
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start()
      } else {
        onClose()
        Animated.spring(translateX, {
          toValue: -SIDEBAR_WIDTH,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start()
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start()
      }
    }
  }

  return (
    <>
      {/* Overlay */}
      <Animated.View 
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </Animated.View>

      {/* Sidebar */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/mror-full.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* User Profile */}
          <View style={styles.userProfile}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {isPro && (
                <View style={styles.proBadge}>
                  <Feather name="star" size={12} color={theme.colors.text} />
                  <Text style={styles.proText}>PRO</Text>
                </View>
              )}
            </View>
          </View>

          {/* New Chat Button */}
          <TouchableOpacity style={styles.newChatButton} onPress={onNewChat}>
            <Feather name="plus" size={20} color={theme.colors.text} />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>

          {/* Chat Sessions */}
          {chatSessions.length > 0 && (
            <View style={styles.chatSection}>
              <Text style={styles.chatSectionTitle}>Recent Chats</Text>
              <View style={styles.chatList}>
                {chatSessions.slice(0, 5).map((chat: any) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={styles.chatItem}
                    onPress={() => onLoadChat?.(chat.id)}
                  >
                    <Feather name="message-circle" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.chatItemText} numberOfLines={1}>
                      {chat.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Bottom Menu Section - 25% of sidebar */}
          <View style={styles.bottomMenuSection}>
            <Text style={styles.menuSectionTitle}>Menu</Text>
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
            
            {/* Logout */}
            {onLogout && (
              <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Feather name="log-out" size={20} color={theme.colors.error} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            )}
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
  overlayTouch: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
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
    paddingTop: theme.spacing['3xl'],
  },
  logoContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  logoImage: {
    width: 160,
    height: 40,
    tintColor: '#ffffff',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userAvatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  proText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  newChatText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  chatSection: {
    padding: theme.spacing.lg,
  },
  chatSectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  chatList: {
    gap: theme.spacing.sm,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  chatItemText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  bottomMenuSection: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  menuSectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.lg - 3,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
  },
})