import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated'
import { Message } from '../types'

interface ChatMessageProps {
  message: Message
  index: number
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, index }) => {
  const isUser = message.role === 'user'
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 })
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100
    })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }))

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.assistantRow
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {message.content}
          </Text>
        </View>

        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, styles.userAvatar]}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  userRow: {
    justifyContent: 'flex-end'
  },
  assistantRow: {
    justifyContent: 'flex-start'
  },
  avatarContainer: {
    marginHorizontal: 8
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10a37f',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userAvatar: {
    backgroundColor: '#19c37d'
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  messageContainer: {
    maxWidth: '70%',
    padding: 16,
    borderRadius: 18
  },
  userMessage: {
    backgroundColor: '#10a37f',
    borderBottomRightRadius: 6
  },
  assistantMessage: {
    backgroundColor: '#f7f7f8',
    borderBottomLeftRadius: 6
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  userText: {
    color: 'white'
  },
  assistantText: {
    color: '#374151'
  }
})