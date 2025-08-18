import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { apiService } from '../../src/lib/api'
import { useRouter, useLocalSearchParams } from 'expo-router'
import AuthGuard from '../../src/components/AuthGuard'

export default function MemoryDetailScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const memoryId = Array.isArray(id) ? id[0] : id
  const [memory, setMemory] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMemory()
  }, [memoryId])

  const loadMemory = async () => {
    if (!memoryId) return
    
    try {
      // In a real app, you would fetch the memory from the API
      // For now, we'll use mock data
      const memoryData = {
        id: memoryId,
        title: 'Project Ideas',
        content: 'Discussed various project ideas for React Native apps:\n\n1. Social media app with AI-powered content suggestions\n2. Personal finance tracker with predictive analytics\n3. Language learning app with conversation practice\n4. Health and fitness companion with personalized routines\n5. Creative writing assistant with story generation capabilities',
        createdAt: new Date().toISOString()
      }
      setMemory(memoryData)
    } catch (error) {
      console.error('Error loading memory:', error)
      Alert.alert('Error', 'Failed to load memory')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading memory...</Text>
      </View>
    )
  }

  if (!memory) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memory not found</Text>
      </View>
    )
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/memories')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Memory</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.memoryTitle}>{memory.title}</Text>
          <Text style={styles.memoryDate}>
            {new Date(memory.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.memoryContent}>{memory.content}</Text>
        </View>
      </ScrollView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#999'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  backButton: {
    fontSize: 24,
    color: '#3b82f6',
    padding: 8
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center'
  },
  headerSpacer: {
    width: 42
  },
  content: {
    padding: 24
  },
  memoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  memoryDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24
  },
  memoryContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24
  }
})
