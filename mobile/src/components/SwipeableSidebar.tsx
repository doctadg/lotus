import React, { useRef, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform, ScrollView } from 'react-native'
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { useRouter, usePathname } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { theme } from '../constants/theme'
import { Image } from 'react-native'
import * as Haptics from 'expo-haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
// Responsive sidebar width: 80% of screen width, max 320px
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320)
// Edge detection zone for opening gesture (from left edge) - 20px thin strip
const EDGE_DETECTION_WIDTH = 20
// Threshold for gesture completion (40% of sidebar width)
const GESTURE_THRESHOLD = SIDEBAR_WIDTH * 0.4
// Velocity threshold for fast swipes (pixels per second)
const VELOCITY_THRESHOLD = 500

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

  // Animated values
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current
  const gestureState = useRef({ isGesturing: false })

  // Track last opened state to trigger haptic feedback
  const lastOpenState = useRef(isOpen)

  // Sync animation with isOpen prop
  useEffect(() => {
    const toValue = isOpen ? 0 : -SIDEBAR_WIDTH

    // Always animate when isOpen changes, even if gesturing
    Animated.parallel([
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start()

    // Haptic feedback on state change
    if (lastOpenState.current !== isOpen) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      lastOpenState.current = isOpen
    }
  }, [isOpen, translateX, overlayOpacity])

  const handleNavigate = useCallback((href: string) => {
    router.push(href as any)
    onClose()
  }, [router, onClose])

  const onGestureEvent = useCallback((event: any) => {
    if (!gestureState.current.isGesturing) return

    const { translationX: tx } = event.nativeEvent

    // Calculate the target position based on current state
    const basePosition = isOpen ? 0 : -SIDEBAR_WIDTH
    const targetPosition = basePosition + tx

    // Clamp position between closed (-SIDEBAR_WIDTH) and open (0)
    const clampedPosition = Math.max(-SIDEBAR_WIDTH, Math.min(0, targetPosition))

    // Update sidebar position
    translateX.setValue(clampedPosition)

    // Update overlay opacity based on position
    const progress = (clampedPosition + SIDEBAR_WIDTH) / SIDEBAR_WIDTH
    overlayOpacity.setValue(progress)
  }, [isOpen, translateX, overlayOpacity])

  const onHandlerStateChange = useCallback((event: any) => {
    const { state, translationX: tx, velocityX } = event.nativeEvent

    if (state === State.BEGAN) {
      gestureState.current.isGesturing = true
    }

    if (state === State.END || state === State.CANCELLED) {
      gestureState.current.isGesturing = false

      let shouldOpen = isOpen

      if (isOpen) {
        // When open, determine if we should close
        // Close if: swiped left past threshold OR fast left swipe
        const draggedLeft = tx < -GESTURE_THRESHOLD
        const fastLeftSwipe = velocityX < -VELOCITY_THRESHOLD

        if (draggedLeft || fastLeftSwipe) {
          shouldOpen = false
        }
      } else {
        // When closed, determine if we should open
        // Open if: swiped right past threshold OR fast right swipe
        const draggedRight = tx > GESTURE_THRESHOLD
        const fastRightSwipe = velocityX > VELOCITY_THRESHOLD

        if (draggedRight || fastRightSwipe) {
          shouldOpen = true
        }
      }

      // Update state - let useEffect handle animation
      if (shouldOpen !== isOpen) {
        if (shouldOpen) {
          onOpen()
        } else {
          onClose()
        }

        // Haptic feedback on state change
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }
      } else {
        // Gesture didn't cross threshold, animate back to current state
        const finalTranslateX = isOpen ? 0 : -SIDEBAR_WIDTH
        const finalOpacity = isOpen ? 1 : 0

        Animated.parallel([
          Animated.spring(translateX, {
            toValue: finalTranslateX,
            useNativeDriver: true,
            velocity: velocityX / 1000,
            tension: 65,
            friction: 11,
          }),
          Animated.timing(overlayOpacity, {
            toValue: finalOpacity,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start()
      }
    }
  }, [isOpen, onOpen, onClose, translateX, overlayOpacity])

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

      {/* Sidebar - only handles closing gesture when open */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={-10}
        failOffsetY={[-15, 15]}
        enabled={isOpen}
      >
        <Animated.View
          style={[
            styles.container,
            {
              width: SIDEBAR_WIDTH,
              transform: [{ translateX }]
            }
          ]}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/mror-full.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.headerSpacer} />
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

          {/* Chat Sessions - Scrollable */}
          {chatSessions.length > 0 && (
            <View style={styles.chatSection}>
              <Text style={styles.chatSectionTitle}>Chat History</Text>
              <ScrollView
                style={styles.chatScrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {chatSessions.map((chat: any) => (
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
              </ScrollView>
            </View>
          )}

          {/* Bottom Menu Section */}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing.lg,
  },
  logoImage: {
    width: 160,
    height: 40,
    tintColor: '#ffffff',
  },
  headerSpacer: {
    flex: 1,
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
    paddingHorizontal: theme.spacing.lg,
    flex: 1,
    minHeight: 0,
  },
  chatSectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  chatScrollView: {
    flex: 1,
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
  bottomMenuSection: {
    flexShrink: 0,
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
