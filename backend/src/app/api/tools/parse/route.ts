import { NextResponse } from 'next/server'
import { parseBuffer, parseFromUrl } from '@/lib/parse-doc'

export const runtime = 'nodejs'

// POST /api/tools/parse
// Accepts either JSON: { url: string }
// Or multipart/form-data with fields: file (File)
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await (req as any).formData()
      const file = form.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
      const arrayBuf = await file.arrayBuffer()
      const buf = Buffer.from(arrayBuf)
      const parsed = await parseBuffer((file as any).name || 'document', buf)
      return NextResponse.json({ parsed })
    }

    const body = await req.json().catch(() => ({})) as any
    const { url, filename } = body
    if (!url) return NextResponse.json({ error: 'Provide url or multipart file' }, { status: 400 })

    if (filename) {
      // If caller knows the filename, fetch and parse with that extension hint
      const res = await fetch(url)
      if (!res.ok) return NextResponse.json({ error: `Failed to fetch: ${res.status}` }, { status: 400 })
      const ab = await res.arrayBuffer()
      const buf = Buffer.from(ab)
      const parsed = await parseBuffer(String(filename), buf)
      return NextResponse.json({ parsed })
    }

    const parsed = await parseFromUrl(String(url))
    return NextResponse.json({ parsed })
  } catch (err: any) {
    console.error('Parse route error:', err)
    return NextResponse.json({ error: err?.message || 'Parse error' }, { status: 500 })
  }
}

