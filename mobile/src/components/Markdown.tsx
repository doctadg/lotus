import React from 'react'
import { View, Text, Image, StyleSheet, Linking, Platform } from 'react-native'

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
  if (!content) return null

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
        <View key={`img-${i}`} style={styles.imageWrapper}>
          <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
          {alt ? <Text style={styles.imageAlt}>{alt}</Text> : null}
        </View>
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

  return <View>{rendered}</View>
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
    backgroundColor: 'rgba(255,255,255,0.05)'
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
  }
  ,codeBlock: {
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
})
