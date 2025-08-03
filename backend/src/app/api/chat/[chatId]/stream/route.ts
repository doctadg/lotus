import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'
import { aiAgent } from '@/lib/agent'

// Query analysis function (duplicated from agent.ts for now)
function analyzeQueryForSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  
  // Temporal keywords that ALWAYS require search
  const temporalKeywords = [
    'latest', 'recent', 'current', 'now', 'today', 'this year', '2024', '2025',
    'what\'s new', 'what\'s happening', 'breaking', 'update', 'news',
    'trending', 'popular', 'hot', 'viral'
  ]
  
  // Factual data keywords that ALWAYS require search
  const factualKeywords = [
    'price', 'cost', 'stock', 'market', 'exchange rate', 'worth',
    'earnings', 'revenue', 'profit', 'financial',
    'specs', 'specifications', 'availability', 'release',
    'review', 'rating', 'comparison', 'vs', 'versus',
    'statistics', 'stats', 'data', 'research findings'
  ]
  
  // Events and people keywords
  const eventKeywords = [
    'election', 'vote', 'politics', 'politician',
    'celebrity', 'public figure', 'famous person',
    'sports', 'score', 'result', 'schedule', 'standings',
    'weather', 'disaster', 'emergency'
  ]
  
  // Technology and business keywords
  const techKeywords = [
    'software update', 'new feature', 'release',
    'startup', 'ipo', 'acquisition', 'merger',
    'ai development', 'new tool', 'platform',
    'crypto', 'bitcoin', 'ethereum', 'nft', 'blockchain'
  ]
  
  const allKeywords = [...temporalKeywords, ...factualKeywords, ...eventKeywords, ...techKeywords]
  
  // Check if query contains any search-triggering keywords
  const hasSearchKeywords = allKeywords.some(keyword => lowerQuery.includes(keyword))
  
  // Additional patterns that suggest need for current information
  const questionPatterns = [
    /how much (does|is|are)/i,
    /what (is|are) the (price|cost)/i,
    /when (did|will|is)/i,
    /who (is|are|won|lost)/i,
    /where (is|are|can)/i,
    /which (company|product|service)/i
  ]
  
  const hasQuestionPattern = questionPatterns.some(pattern => pattern.test(query))
  
  // Check for numerical queries that might need current data
  const hasNumbers = /\d{4}/.test(query) || /\$\d+/.test(query) || /\b\d+%\b/.test(query)
  
  return hasSearchKeywords || hasQuestionPattern || hasNumbers
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  console.log('🚀 Streaming request received')
  try {
    const { chatId } = await params
    console.log('💬 Chat ID:', chatId)
    const userId = await authenticateUser(request)
    console.log('👤 User ID:', userId)
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { content, deepResearchMode = false } = await request.json()

    if (!content) {
      return new Response('Message content is required', { status: 400 })
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId
      }
    })

    if (!chat) {
      return new Response('Chat not found', { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role: 'user',
        content
      }
    })

    // Get chat history for context
    const chatHistory = await prisma.message.findMany({
      where: { chatId: chatId },
      orderBy: { createdAt: 'asc' },
      take: -20
    })

    // Create streaming response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        // Send user message first
        const userMessageData = JSON.stringify({
          type: 'user_message',
          data: userMessage
        })
        controller.enqueue(encoder.encode(`data: ${userMessageData}\n\n`))
        
        // Start AI processing
        processAIResponse(controller, encoder, chatId, content, chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString()
        })), deepResearchMode)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

async function processAIResponse(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  chatId: string,
  content: string,
  chatHistory: Array<{ role: string; content: string; createdAt: string }>,
  deepResearchMode = false
) {
  try {
    // Send typing indicator
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'ai_typing',
      data: { typing: true }
    })}\n\n`))

    let fullResponse = ''

    // Import search analysis function
    const needsSearch = analyzeQueryForSearch(content)
    
    // Add current date and time to the content
    const now = new Date()
    const currentDateTime = now.toISOString()
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const localDateTime = now.toLocaleString('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })

    // Prepare message for processing
    let processedContent = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] ${content}`
    
    if (deepResearchMode) {
      processedContent = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] [DEEP RESEARCH MODE] Please use the deep_research tool for comprehensive analysis: ${content}`
    } else if (needsSearch) {
      processedContent = `[CURRENT DATE & TIME: ${currentDateTime} (${localDateTime})] [SEARCH REQUIRED] You MUST use swift_search before responding. Query: ${content}`
    }

    // Stream the AI response
    for await (const chunk of aiAgent.streamMessage(
      processedContent,
      chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    )) {
      fullResponse += chunk
      
      // Send each chunk as it arrives
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'ai_chunk',
        data: { content: chunk }
      })}\n\n`))
    }

    // Stop typing indicator
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'ai_typing',
      data: { typing: false }
    })}\n\n`))

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chatId,
        role: 'assistant',
        content: fullResponse,
        metadata: JSON.parse(JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          streaming: true
        }))
      }
    })

    // Send final AI message
    const aiMessageData = JSON.stringify({
      type: 'ai_message_complete',
      data: aiMessage
    })
    controller.enqueue(encoder.encode(`data: ${aiMessageData}\n\n`))

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })

    // Send completion
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'complete',
      data: { success: true }
    })}\n\n`))

    controller.close()
  } catch (error) {
    console.error('AI processing error:', error)
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    // Send error
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      data: { message: 'Failed to process message' }
    })}\n\n`))
    
    controller.close()
  }
}