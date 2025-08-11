import { NextRequest, NextResponse } from 'next/server'

interface Message {
  role: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Create a prompt for title generation using the conversation context
    const conversationContext = messages
      .slice(0, 4) // Only use first 4 messages for context
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')

    const titlePrompt = `Based on this conversation, generate a very short, 2-4 word title that captures the main topic or question. Be concise and descriptive.

Conversation:
${conversationContext}

Title (2-4 words only):`

    // Use OpenRouter with a small, fast model for title generation
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`,
        'X-Title': 'Lotus AI Chat',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // Fast, small model for title generation
        messages: [
          {
            role: 'user',
            content: titlePrompt
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
        top_p: 1
      })
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText)
      // Fallback to simple truncation if API fails
      const fallbackTitle = messages[0]?.content
        .split(' ')
        .slice(0, 3)
        .join(' ') + '...'
      
      return NextResponse.json({ 
        title: fallbackTitle || 'New conversation' 
      })
    }

    const data = await response.json()
    let title = data.choices?.[0]?.message?.content?.trim()

    if (!title) {
      // Fallback if no title generated
      title = messages[0]?.content
        .split(' ')
        .slice(0, 3)
        .join(' ') + '...'
    }

    // Clean up the title - remove quotes, extra punctuation, ensure it's short
    title = title
      .replace(/["""'']/g, '') // Remove quotes
      .replace(/[.!?]+$/, '') // Remove trailing punctuation
      .split(' ')
      .slice(0, 4) // Ensure max 4 words
      .join(' ')

    // Fallback if title is too short or empty
    if (!title || title.length < 2) {
      title = messages[0]?.content
        .split(' ')
        .slice(0, 3)
        .join(' ') || 'New conversation'
    }

    return NextResponse.json({ title })

  } catch (error) {
    console.error('Error generating chat title:', error)
    
    // Return a fallback title
    return NextResponse.json({ 
      title: 'New conversation' 
    }, { status: 200 })
  }
}