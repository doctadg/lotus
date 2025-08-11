import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, Alert } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ChatScreen } from './src/screens/ChatScreen'
import { Sidebar } from './src/components/Sidebar'
import { apiService } from './src/services/api'

export default function App() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      const authenticated = await apiService.isAuthenticated()
      if (!authenticated) {
        // For demo purposes, create a default user
        await apiService.createUser('demo@example.com', 'Demo User')
      }
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error initializing app:', error)
      Alert.alert('Error', 'Failed to initialize app')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleNewChat = async () => {
    try {
      const newChat = await apiService.createChat({
        title: 'New Chat'
      })
      setSelectedChatId(newChat.id)
    } catch (error) {
      console.error('Error creating new chat:', error)
      Alert.alert('Error', 'Failed to create new chat')
    }
  }

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId)
  }

  const handleChatCreated = (chatId: string) => {
    setSelectedChatId(chatId)
  }

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
  }

  if (isInitializing) {
    return <View style={styles.container} />
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ChatScreen
          chatId={selectedChatId}
          onMenuPress={toggleSidebar}
          onChatCreated={handleChatCreated}
        />
        
        <Sidebar
          isVisible={isSidebarVisible}
          onClose={() => setIsSidebarVisible(false)}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          selectedChatId={selectedChatId || undefined}
        />
        
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  }
})
