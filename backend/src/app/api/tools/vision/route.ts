import { NextResponse } from 'next/server'
import { getOpenRouterClient } from '@/lib/openrouter'

export const runtime = 'nodejs'

// POST /api/tools/vision
// Body: { prompt: string, imageUrl?: string, imageBase64?: string, model?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const { prompt, imageUrl, imageBase64, model } = body

    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    const client = getOpenRouterClient()

    const content: any[] = [{ type: 'text', text: String(prompt) }]
    if (imageUrl) {
      content.push({ type: 'image_url', image_url: { url: String(imageUrl) } })
    } else if (imageBase64) {
      content.push({ type: 'image_url', image_url: { url: String(imageBase64) } })
    }

    const completion = await client.chat.completions.create({
      model: model || process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    })

    const message = completion.choices?.[0]?.message || null
    return NextResponse.json({ message })
  } catch (err: any) {
    console.error('Vision route error:', err)
    return NextResponse.json({ error: err?.message || 'Vision error' }, { status: 500 })
  }
}

