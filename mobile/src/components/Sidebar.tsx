import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiService } from '../services/api'
import { Chat } from '../types'

interface SidebarProps {
  isVisible: boolean
  onClose: () => void
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  selectedChatId?: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8

export const Sidebar: React.FC<SidebarProps> = ({
  isVisible,
  onClose,
  onChatSelect,
  onNewChat,
  selectedChatId
}) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const translateX = useSharedValue(-SIDEBAR_WIDTH)
  const overlayOpacity = useSharedValue(0)

  useEffect(() => {
    if (isVisible) {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 100
      })
      overlayOpacity.value = withTiming(0.5, { duration: 300 })
      loadChats()
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 })
      overlayOpacity.value = withTiming(0, { duration: 300 })
    }
  }, [isVisible])

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value
  }))

  const loadChats = async () => {
    setIsLoading(true)
    try {
      const chatsData = await apiService.getChats()
      setChats(chatsData)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId)
    onClose()
  }

  const handleNewChat = () => {
    onNewChat()
    onClose()
  }

  const handleDeleteChat = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteChat(chatId)
              setChats(prev => prev.filter(chat => chat.id !== chatId))
            } catch (error) {
              Alert.alert('Error', 'Failed to delete chat')
            }
          }
        }
      ]
    )
  }

  if (!isVisible) return null

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, overlayStyle]}
        onTouchEnd={onClose}
      />
      
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, sidebarStyle]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Lotus AI</Text>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewChat}
            >
              <Text style={styles.newChatButtonText}>✨ New Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Chat List */}
          <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
            {chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={[
                  styles.chatItem,
                  selectedChatId === chat.id && styles.selectedChatItem
                ]}
                onPress={() => handleChatSelect(chat.id)}
                onLongPress={() => handleDeleteChat(chat.id)}
              >
                <Text style={styles.chatTitle} numberOfLines={1}>
                  {chat.title || 'New Chat'}
                </Text>
                {chat.messages && chat.messages.length > 0 && (
                  <Text style={styles.chatPreview} numberOfLines={2}>
                    {chat.messages[0].content}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            
            {chats.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>No conversations yet{"\n"}Start chatting to see your history</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fafafa', // --gray-50 (light background)
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8
  },
  safeArea: {
    flex: 1
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5' // --gray-200
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171717', // --gray-900
    marginBottom: 16,
    letterSpacing: -0.5
  },
  newChatButton: {
    backgroundColor: '#171717', // --gray-900 (primary)
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  newChatButtonText: {
    color: '#fafafa', // --gray-50 (primary-foreground)
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  chatItem: {
    padding: 16,
    marginVertical: 3,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  selectedChatItem: {
    backgroundColor: '#f5f5f5', // --gray-100
    borderColor: '#d4d4d4' // --gray-300
  },
  chatTitle: {
    color: '#171717', // --gray-900
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.2
  },
  chatPreview: {
    color: '#737373', // --gray-500
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  emptyText: {
    color: '#525252', // --gray-600
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5' // --gray-200
  },
  footerButton: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent'
  },
  footerButtonText: {
    color: '#737373', // --gray-500
    fontSize: 15,
    fontWeight: '500'
  },
  newChatIcon: {
    width: 20,
    height: 20
  }
})