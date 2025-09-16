import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput
} from 'react-native'
import { useAuth } from '../src/contexts/AuthContext'
import { apiService } from '../src/lib/api'
import { useRouter } from 'expo-router'
import AuthGuard from '../src/components/AuthGuard'
import Navigation from '../src/components/Navigation'

export default function QuestionsScreen() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPersonalized, setIsPersonalized] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      loadQuestions()
    }
  }, [isAuthLoading, isAuthenticated])

  const loadQuestions = async () => {
    if (!user) return
    
    try {
      const response = await apiService.getPersonalizedQuestions()
      setQuestions(response.questions || [])
      setIsPersonalized(response.isPersonalized || false)
    } catch (error) {
      console.error('Error loading questions:', error)
      Alert.alert('Error', 'Failed to load questions')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshQuestions = async () => {
    setIsLoading(true)
    await loadQuestions()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    )
  }

  return (
    <AuthGuard>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Questions</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Add questions you'd like Lotus AI to help you explore.
          </Text>

          <View style={styles.addQuestionContainer}>
            <TextInput
              style={styles.questionInput}
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="Enter a question..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={2}
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.addButton, (!newQuestion.trim() || isAdding) && styles.addButtonDisabled]}
              onPress={addQuestion}
              disabled={!newQuestion.trim() || isAdding}
            >
              <Text style={styles.addButtonText}>
                {isAdding ? 'Adding...' : 'Add Question'}
              </Text>
            </TouchableOpacity>
          </View>

          {questions.map((question) => (
            <TouchableOpacity
              key={question.id}
              style={styles.questionItem}
              onLongPress={() => deleteQuestion(question.id)}
            >
              <Text style={styles.questionContent}>{question.content}</Text>
              <Text style={styles.questionDate}>
                {new Date(question.createdAt).toLocaleDateString()}
              </Text>
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
  addQuestionContainer: {
    marginBottom: 24
  },
  questionInput: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top'
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonDisabled: {
    opacity: 0.7
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  questionItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  questionContent: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8
  },
  questionDate: {
    fontSize: 12,
    color: '#999'
  }
})
