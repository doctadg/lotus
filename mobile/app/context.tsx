import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { useAuth } from '../src/contexts/AuthContext'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'

export default function ContextScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [context, setContext] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadContext()
  }, [])

  const loadContext = async () => {
    if (!user) return
    
    try {
      const userContext = await apiService.getUserContext()
      // Convert to array format for compatibility with existing UI
      setContext(userContext ? [userContext] : [])
    } catch (error) {
      console.error('Error loading context:', error)
      // Set empty context for new users
      setContext([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleContext = async (contextId: string) => {
    try {
      const contextItem = context.find(ctx => ctx.id === contextId)
      if (contextItem) {
        await apiService.updateContext(contextId, !contextItem.active)
        setContext(prev => 
          prev.map(ctx => 
            ctx.id === contextId 
              ? { ...ctx, active: !ctx.active } 
              : ctx
          )
        )
      }
    } catch (error) {
      console.error('Error updating context:', error)
      Alert.alert('Error', 'Failed to update context')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading context...</Text>
      </View>
    )
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Context</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Context helps Mror understand the background and provide more relevant responses.
          </Text>

          {context.map((ctx) => (
            <TouchableOpacity
              key={ctx.id}
              style={[styles.contextItem, ctx.active && styles.activeContextItem]}
              onPress={() => toggleContext(ctx.id)}
            >
              <View style={styles.contextHeader}>
                <Text style={[styles.contextName, ctx.active && styles.activeContextName]}>
                  {ctx.name}
                </Text>
                <View style={[styles.statusIndicator, ctx.active ? styles.activeStatus : styles.inactiveStatus]} />
              </View>
              <Text style={styles.contextDescription}>{ctx.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Navigation />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  content: {
    padding: 24
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center'
  },
  contextItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  activeContextItem: {
    backgroundColor: '#3b82f6'
  },
  contextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  contextName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  activeContextName: {
    color: '#fff'
  },
  contextDescription: {
    fontSize: 14,
    color: '#ccc'
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  activeStatus: {
    backgroundColor: '#00ff00'
  },
  inactiveStatus: {
    backgroundColor: '#ff0000'
  }
})
