import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { apiService } from '../services/api'
import { Chat } from '../types'

interface ChatListScreenProps {
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  onChatSelect,
  onNewChat
}) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const chatsData = await apiService.getChats()
      setChats(chatsData)
    } catch (error) {
      console.error('Error loading chats:', error)
      Alert.alert('Error', 'Failed to load chats')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadChats()
    setIsRefreshing(false)
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
              console.error('Error deleting chat:', error)
              Alert.alert('Error', 'Failed to delete chat')
            }
          }
        }
      ]
    )
  }

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onChatSelect(item.id)}
      onLongPress={() => handleDeleteChat(item.id)}
    >
      <View style={styles.chatInfo}>
        <Text style={styles.chatTitle} numberOfLines={1}>
          {item.title || 'New Chat'}
        </Text>
        <Text style={styles.chatPreview} numberOfLines={2}>
          {item.messages && item.messages.length > 0
            ? item.messages[0].content
            : 'No messages yet'
          }
        </Text>
      </View>
      <Text style={styles.chatDate}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={onNewChat}>
          <Text style={styles.newChatButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chats yet</Text>
          <TouchableOpacity style={styles.startChatButton} onPress={onNewChat}>
            <Text style={styles.startChatButtonText}>Start your first chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          style={styles.chatsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  chatsList: {
    flex: 1
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1'
  },
  chatInfo: {
    flex: 1,
    marginRight: 8
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  },
  chatDate: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-start'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16
  },
  startChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20
  },
  startChatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
})