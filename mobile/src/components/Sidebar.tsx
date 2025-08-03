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
            <Text style={styles.title}>AI Chat</Text>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewChat}
            >
              <Text style={styles.newChatButtonText}>+ New Chat</Text>
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
                <Text style={styles.emptyText}>No chats yet</Text>
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
    backgroundColor: 'black'
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#202123',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  safeArea: {
    flex: 1
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444654'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16
  },
  newChatButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 12
  },
  chatItem: {
    padding: 12,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent'
  },
  selectedChatItem: {
    backgroundColor: '#343541'
  },
  chatTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  chatPreview: {
    color: '#8e8ea0',
    fontSize: 12,
    lineHeight: 16
  },
  emptyState: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: '#8e8ea0',
    fontSize: 14
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#444654'
  },
  footerButton: {
    padding: 12,
    alignItems: 'center'
  },
  footerButtonText: {
    color: '#8e8ea0',
    fontSize: 14
  }
})