import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../lib/api'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { useSubscription } from '../contexts/SubscriptionContext'

// Home/Chat Screen
export function HomeScreen({ navigation }: any) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    createNewChat()
  }, [])

  const createNewChat = async () => {
    try {
      const chat = await apiService.createChat({ title: 'New Chat' })
      setChatId(chat.id)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !chatId) return

    const userMessage = { role: 'user', content: message, id: Date.now().toString() }
    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const response = await apiService.sendMessage(chatId, { content: message })
      setMessages(prev => [...prev, response.aiMessage])
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 429) {
        Alert.alert(
          'Limit reached',
          'You have reached the free plan limit. Upgrade to Pro for unlimited access.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: async () => {
              const webBase = (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(/\/?api\/?$/, '') || 'https://www.mror.app'
              await WebBrowser.openBrowserAsync(`${webBase}/pricing`)
            }}
          ]
        )
      } else {
        Alert.alert('Error', error.message || 'Failed to send message')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mror</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('Memories')} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Memories</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessage : styles.aiMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!message.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Memories Screen
export function MemoriesScreen({ navigation }: any) {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    try {
      const response = await apiService.getUserMemories()
      setMemories(response.memories || [])
    } catch (error) {
      console.error('Failed to load memories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memories</Text>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        style={styles.content}
        renderItem={({ item }) => (
          <View style={styles.memoryCard}>
            <Text style={styles.memoryKey}>{item.key}</Text>
            <Text style={styles.memoryValue}>{item.value}</Text>
            <Text style={styles.memoryType}>{item.type}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No memories yet</Text>
        }
      />
    </View>
  )
}

// Profile Screen
export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Name</Text>
          <Text style={styles.profileValue}>{user?.name || 'N/A'}</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{user?.email}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Placeholder screens
export function SettingsScreen({ navigation }: any) {
  const webBase = (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(/\/?api\/?$/, '') || 'https://mror.app'
  const { isPro, loading: subLoading, error: subError, purchasePro, restorePurchases } = useSubscription()
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const sub = await apiService.getSubscription()
        setStatus(sub.status || null)
      } catch {
        // ignore
      } finally {
        setSubLoading(false)
      }
    })()
  }, [])
  const startCheckout = async () => {
    try {
      const { url } = await apiService.createCheckout()
      await WebBrowser.openBrowserAsync(url)
    } catch (e: any) {
      Alert.alert('Upgrade', e?.message || 'Unable to start checkout')
    }
  }
  const openPortal = async () => {
    try {
      const { url } = await apiService.createBillingPortal()
      await WebBrowser.openBrowserAsync(url)
    } catch (e: any) {
      Alert.alert('Billing', e?.message || 'Unable to open billing portal')
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Plan</Text>
          <Text style={styles.profileValue}>{isPro ? 'Pro' : 'Free'}</Text>
          {status && <Text style={{ color: '#aaa', marginTop: 4 }}>Status: {status}</Text>}
          {!isPro ? (
            <>
              <Text style={{ color: '#aaa', marginTop: 8 }}>Upgrade to Pro for unlimited messages, Deep Research, and image generation.</Text>
              <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={purchasePro} disabled={subLoading}>
                <Text style={styles.buttonText}>Subscribe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { marginTop: 12, backgroundColor: '#333' }]} onPress={restorePurchases} disabled={subLoading}>
                <Text style={styles.buttonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ color: '#aaa', marginTop: 8 }}>Thanks for subscribing!</Text>
          )}
        </View>
      </View>
    </View>
  )
}

export function ContextScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Context</Text>
      </View>
      <View style={[styles.content, styles.centered]}>
        <Text style={styles.placeholderText}>Context management coming soon...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  messagesList: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#6366f1',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  memoryCard: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  memoryKey: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memoryValue: {
    color: '#ccc',
    marginBottom: 8,
  },
  memoryType: {
    color: '#6366f1',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  profileCard: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  profileValue: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
})
