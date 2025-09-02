import { NextResponse } from 'next/server'
import { getOpenRouterClient, OPENROUTER_IMAGE_MODEL } from '@/lib/openrouter'
import { parseDataUrl, extensionForMime } from '@/lib/dataurl'
import { uploadToBlob } from '@/lib/blob'

export const runtime = 'nodejs'

// POST /api/tools/image-generate
// Body: { prompt: string, model?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const { prompt, model } = body
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

    const client = getOpenRouterClient()
    const result = await client.chat.completions.create({
      model: model || OPENROUTER_IMAGE_MODEL,
      messages: [
        { role: 'user', content: String(prompt) },
      ],
      // Ask models that support it to return images in the assistant message
      // per OpenRouter multimodal image-generation documentation
      modalities: ['image', 'text'] as any,
    } as any)

    const message: any = result.choices?.[0]?.message
    const images: any[] = message?.images || []

    // Upload any base64 data URLs to Vercel Blob and return blob URLs
    const uploaded = await Promise.all(images.map(async (img: any, idx: number) => {
      const url: string = img?.image_url?.url || ''
      if (url.startsWith('data:')) {
        const parsed = parseDataUrl(url)
        if (parsed) {
          const ext = extensionForMime(parsed.mime)
          const path = `generated/${Date.now()}-${idx}.${ext}`
          try {
            const blobUrl = await uploadToBlob({ path, data: parsed.buffer, contentType: parsed.mime })
            return { type: 'image_url', image_url: { url: blobUrl }, source: 'blob' }
          } catch (e) {
            console.warn('Blob upload failed, returning base64 image:', (e as any)?.message)
            return { type: 'image_url', image_url: { url }, source: 'base64-fallback' }
          }
        }
      }
      return { type: 'image_url', image_url: { url }, source: 'passthrough' }
    }))

    return NextResponse.json({ message: message?.content || '', images: uploaded })
  } catch (err: any) {
    console.error('Image generate route error:', err)
    return NextResponse.json({ error: err?.message || 'Image generation error' }, { status: 500 })
  }
}
