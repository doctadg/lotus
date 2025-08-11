import React, { useEffect, memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated'
import Markdown from 'react-native-markdown-display'
import SyntaxHighlighter from 'react-native-syntax-highlighter'
import { oneDark } from 'react-native-syntax-highlighter/dist/esm/styles/prism'
import { Message } from '../types'
import { CodeBlock } from './blocks/CodeBlock'
import { MathBlock } from './blocks/MathBlock'
import { TableBlock } from './blocks/TableBlock'

interface EnhancedChatMessageProps {
  message: Message
  index: number
}

export const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = memo(({ message, index }) => {
  const isUser = message.role === 'user'
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(isUser ? 10 : 0)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: isUser ? 300 : 200 })
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 120
    })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }))

  // Enhanced markdown rules for better formatting
  const markdownRules = {
    code_inline: (node: any, children: any, parent: any, styles: any) => (
      <Text key={node.key} style={[styles.code_inline, enhancedStyles.inlineCode]}>
        {children}
      </Text>
    ),
    
    code_block: (node: any, children: any, parent: any, styles: any) => {
      const { language, content } = node
      return (
        <CodeBlock
          key={node.key}
          code={content}
          language={language || 'text'}
        />
      )
    },
    
    fence: (node: any, children: any, parent: any, styles: any) => {
      return (
        <CodeBlock
          key={node.key}
          code={node.content}
          language={node.sourceInfo || 'text'}
        />
      )
    },
    
    table: (node: any, children: any, parent: any, styles: any) => (
      <TableBlock key={node.key} data={node} />
    ),
    
    blockquote: (node: any, children: any, parent: any, styles: any) => (
      <View key={node.key} style={enhancedStyles.blockquote}>
        <View style={enhancedStyles.blockquoteBorder} />
        <View style={enhancedStyles.blockquoteContent}>
          {children}
        </View>
      </View>
    ),
    
    heading1: (node: any, children: any, parent: any, styles: any) => (
      <Text key={node.key} style={[styles.heading1, enhancedStyles.heading1]}>
        {children}
      </Text>
    ),
    
    heading2: (node: any, children: any, parent: any, styles: any) => (
      <Text key={node.key} style={[styles.heading2, enhancedStyles.heading2]}>
        {children}
      </Text>
    ),
    
    heading3: (node: any, children: any, parent: any, styles: any) => (
      <Text key={node.key} style={[styles.heading3, enhancedStyles.heading3]}>
        {children}
      </Text>
    ),
  }

  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: isUser ? 'white' : '#374151'
    },
    paragraph: {
      marginBottom: 12,
      marginTop: 0
    },
    strong: {
      fontWeight: '600'
    },
    em: {
      fontStyle: 'italic'
    },
    link: {
      color: isUser ? 'rgba(255, 255, 255, 0.9)' : '#10a37f',
      textDecorationLine: 'underline'
    },
    list_item: {
      marginBottom: 4
    },
    code_inline: {
      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 163, 127, 0.1)',
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      fontFamily: 'monospace',
      fontSize: 14
    }
  })

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
          <Markdown
            rules={markdownRules}
            style={markdownStyles}
          >
            {message.content}
          </Markdown>
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
})

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
    maxWidth: '75%',
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
  }
})

const enhancedStyles = StyleSheet.create({
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 14
  },
  blockquote: {
    flexDirection: 'row',
    marginVertical: 12,
    paddingLeft: 16,
    backgroundColor: 'rgba(16, 163, 127, 0.05)'
  },
  blockquoteBorder: {
    width: 4,
    backgroundColor: '#10a37f',
    marginRight: 12,
    borderRadius: 2
  },
  blockquoteContent: {
    flex: 1,
    paddingVertical: 8
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 16,
    color: '#1a1a1a'
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 12,
    color: '#1a1a1a'
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
    color: '#1a1a1a'
  }
})