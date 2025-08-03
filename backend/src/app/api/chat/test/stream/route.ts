import { NextRequest, NextResponse } from 'next/server'
import { aiAgent } from '@/lib/agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Convert conversation history to proper format
    const chatHistory = conversationHistory.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content
    }))

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get the streaming response from the AI agent
          const streamingResponse = aiAgent.streamMessage(message, chatHistory)
          
          for await (const chunk of streamingResponse) {
            // Send each chunk as server-sent events format
            const data = `data: ${chunk}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = `data: {"error": "Stream processing failed"}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}