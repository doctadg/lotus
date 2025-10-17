import React, { useState } from 'react'
import { View, Text, Image, StyleSheet, Linking, Platform, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'

interface MarkdownProps {
  content: string
}

// Very lightweight Markdown renderer to handle common cases used by the backend:
// - Paragraphs and line breaks
// - Images: ![alt](url)
// - Links: [text](url)
// - Bold: **text**
// - Unordered/ordered lists (basic)
export default function Markdown({ content }: MarkdownProps) {
  const [selectedImage, setSelectedImage] = useState<{ uri: string; alt: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!content) return null

  const handleSaveImage = async (uri: string) => {
    try {
      setIsSaving(true)

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission to save images.')
        return
      }

      // Download the image
      const filename = uri.split('/').pop() || `image-${Date.now()}.jpg`
      const downloadPath = `${FileSystem.documentDirectory}${filename}`

      const { uri: localUri } = await FileSystem.downloadAsync(uri, downloadPath)

      // Save to media library
      await MediaLibrary.createAssetAsync(localUri)

      Alert.alert('Success', 'Image saved to your photo library!')
    } catch (error) {
      console.error('Error saving image:', error)
      Alert.alert('Error', 'Failed to save image. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const lines = content.split(/\r?\n/)

  const renderInline = (text: string, key: string | number) => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let index = 0

    // Handle links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/
    // Handle bold **text**
    const boldRegex = /\*\*([^*]+)\*\*/

    while (remaining.length > 0) {
      const linkMatch = remaining.match(linkRegex)
      const boldMatch = remaining.match(boldRegex)

      // Find earliest match among link/bold
      const candidates = [linkMatch, boldMatch].filter(Boolean) as RegExpMatchArray[]
      if (candidates.length === 0) {
        parts.push(<Text key={`${key}-t-${index}`}>{remaining}</Text>)
        break
      }
      const first = candidates.reduce((a, b) => (a.index! < b.index! ? a : b))
      const before = remaining.slice(0, first.index)
      if (before) parts.push(<Text key={`${key}-t-${index++}`}>{before}</Text>)

      if (first === linkMatch) {
        const [, label, url] = first
        parts.push(
          <Text
            key={`${key}-l-${index++}`}
            style={styles.link}
            onPress={() => {
              try { Linking.openURL(url) } catch {}
            }}
          >
            {label}
          </Text>
        )
        remaining = remaining.slice(first.index! + first[0].length)
      } else if (first === boldMatch) {
        const [, boldText] = first
        parts.push(
          <Text key={`${key}-b-${index++}`} style={styles.bold}>{boldText}</Text>
        )
        remaining = remaining.slice(first.index! + first[0].length)
      }
    }
    return <Text style={styles.paragraph}>{parts}</Text>
  }

  const rendered: React.ReactNode[] = []
  let inCode = false
  const codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Code fence
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLines.length = 0
      } else {
        // Close code block
        inCode = false
        const code = codeLines.join('\n')
        rendered.push(
          <View key={`code-${i}`} style={styles.codeBlock}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        )
        codeLines.length = 0
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imgMatch) {
      const [, alt, url] = imgMatch
      rendered.push(
        <TouchableOpacity
          key={`img-${i}`}
          style={styles.imageWrapper}
          onPress={() => setSelectedImage({ uri: url, alt: alt || '' })}
          activeOpacity={0.9}
        >
          <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
          {alt ? <Text style={styles.imageAlt}>{alt}</Text> : null}
          <View style={styles.imageOverlay}>
            <Feather name="maximize-2" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </TouchableOpacity>
      )
      continue
    }

    // List items
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ul || ol) {
      const itemText = (ul || ol)![1]
      rendered.push(
        <View key={`li-${i}`} style={styles.listItem}>
          <Text style={styles.bullet}>{ol ? '•' : '•'}</Text>
          <Text style={styles.listText}>{itemText}</Text>
        </View>
      )
      continue
    }

    // Regular text or empty line
    if (line.trim().length === 0) {
      rendered.push(<View key={`br-${i}`} style={{ height: 6 }} />)
    } else {
      rendered.push(
        <View key={`p-${i}`} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {renderInline(line, i)}
        </View>
      )
    }
  }

  return (
    <View>
      {rendered}

      {/* Full Screen Image Viewer Modal */}
      {selectedImage && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setSelectedImage(null)}
            />

            {/* Image Container */}
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.fullImage}
                resizeMode="contain"
              />

              {/* Top Bar */}
              <View style={styles.modalTopBar}>
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={styles.modalButton}
                >
                  <Feather name="x" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Bottom Bar */}
              <View style={styles.modalBottomBar}>
                {selectedImage.alt && (
                  <Text style={styles.modalImageAlt}>{selectedImage.alt}</Text>
                )}
                <TouchableOpacity
                  onPress={() => handleSaveImage(selectedImage.uri)}
                  style={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  ) : (
                    <>
                      <Feather name="download" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  paragraph: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.96)'
  },
  link: {
    color: '#60a5fa',
    textDecorationLine: 'underline'
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4
  },
  bullet: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2
  },
  listText: {
    color: 'rgba(255,255,255,0.92)',
    flex: 1
  },
  imageWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 220,
  },
  imageAlt: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    padding: 6,
  },
  codeBlock: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as any,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    backgroundColor: 'transparent',
  },
  modalButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 10,
  },
  modalBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  modalImageAlt: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
