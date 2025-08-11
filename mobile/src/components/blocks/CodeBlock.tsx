import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Copy, Download } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'

interface CodeBlockProps {
  code: string
  language: string
  fileName?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  fileName
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code to clipboard')
    }
  }

  const shareCode = async () => {
    try {
      const fileExtension = getFileExtension(language)
      const filename = fileName || `code.${fileExtension}`
      const fileUri = `${FileSystem.documentDirectory}${filename}`
      
      await FileSystem.writeAsStringAsync(fileUri, code)
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri)
      } else {
        Alert.alert('Sharing not available', 'Cannot share files on this device')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share code')
    }
  }

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      css: 'css',
      html: 'html',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh'
    }
    return extensions[lang.toLowerCase()] || 'txt'
  }

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      cpp: '#00599c',
      c: '#a8b9cc',
      css: '#1572b6',
      html: '#e34f26',
      json: '#000000',
      yaml: '#cb171e',
      sql: '#336791',
      bash: '#4eaa25',
      shell: '#4eaa25'
    }
    return colors[lang.toLowerCase()] || '#6b7280'
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.languageIndicator}>
            <View 
              style={[
                styles.languageDot, 
                { backgroundColor: getLanguageColor(language) }
              ]} 
            />
            <Text style={styles.languageText}>
              {fileName || language.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={copyToClipboard}
            style={styles.actionButton}
          >
            <Copy size={16} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={shareCode}
            style={styles.actionButton}
          >
            <Download size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Code Content */}
      <ScrollView 
        horizontal 
        style={styles.codeContainer}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.codeWrapper}>
          <Text style={styles.codeText}>{code}</Text>
        </View>
      </ScrollView>

      {/* Copy Success Indicator */}
      {copied && (
        <View style={styles.copyIndicator}>
          <Text style={styles.copyText}>Copied!</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040'
  },
  headerLeft: {
    flex: 1
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  languageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  languageText: {
    color: '#e5e5e5',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  codeContainer: {
    maxHeight: 300
  },
  codeWrapper: {
    padding: 16,
    minWidth: '100%'
  },
  codeText: {
    color: '#e5e5e5',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'monospace'
  },
  copyIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  copyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  }
})