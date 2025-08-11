import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Copy } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'

interface MathBlockProps {
  content: string
  inline?: boolean
}

export const MathBlock: React.FC<MathBlockProps> = ({ 
  content, 
  inline = false 
}) => {
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(content)
      Alert.alert('Copied', 'LaTeX source copied to clipboard')
    } catch (error) {
      Alert.alert('Error', 'Failed to copy LaTeX source')
    }
  }

  if (inline) {
    return (
      <Text style={styles.inlineMath}>
        {content}
      </Text>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Mathematical Expression</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
          <Copy size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mathContainer}>
        <Text style={styles.mathText}>
          {content}
        </Text>
      </View>
      
      <View style={styles.sourceContainer}>
        <Text style={styles.sourceLabel}>LaTeX Source:</Text>
        <Text style={styles.sourceText}>{content}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057'
  },
  copyButton: {
    padding: 4
  },
  mathContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  mathText: {
    fontSize: 18,
    color: '#212529',
    textAlign: 'center',
    fontFamily: 'serif'
  },
  sourceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef'
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4
  },
  sourceText: {
    fontSize: 13,
    color: '#495057',
    fontFamily: 'monospace'
  },
  inlineMath: {
    fontFamily: 'serif',
    fontSize: 16,
    color: '#495057'
  }
})