import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { useAuth } from '../src/contexts/AuthContext'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'
import { theme } from '../src/constants/theme'
import { Card } from '../src/components/ui/Card'
import { Feather } from '@expo/vector-icons'

export default function MemoriesScreen() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [memories, setMemories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      loadMemories()
    }
  }, [isAuthLoading, isAuthenticated])

  const loadMemories = async () => {
    if (!user) return
    
    try {
      const response = await apiService.getUserMemories()
      setMemories(response.memories || [])
    } catch (error) {
      console.error('Error loading memories:', error)
      Alert.alert('Error', 'Failed to load memories')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.text} />
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
        <Navigation />
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Memories</Text>
        </View>

        {memories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No memories yet</Text>
            <Text style={styles.emptySubtext}>Your memories will appear here</Text>
          </View>
        ) : (
          <View style={styles.memoriesList}>
            {memories.map((memory) => (
              <TouchableOpacity
                key={memory.id}
                onPress={() => router.push(`/memory/${memory.id}`)}
              >
                <Card style={styles.memoryItem}>
                  <View style={styles.memoryHeader}>
                    <Text style={styles.memoryTitle}>{memory.title}</Text>
                    <Feather name="chevron-right" size={20} color={theme.colors.textSecondary} />
                  </View>
                  <Text style={styles.memoryContent} numberOfLines={2}>
                    {memory.content}
                  </Text>
                  <View style={styles.memoryFooter}>
                    <Feather name="calendar" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.memoryDate}>
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <Navigation />
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl']
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginTop: theme.spacing.lg
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm
  },
  memoriesList: {
    padding: theme.spacing.lg
  },
  memoryItem: {
    marginBottom: theme.spacing.lg
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  memoryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    flex: 1
  },
  memoryContent: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal
  },
  memoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs
  },
  memoryDate: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMuted
  }
})
