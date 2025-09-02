import { NextResponse } from 'next/server'
import { uploadToBlob } from '@/lib/blob'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Use multipart/form-data with a file field' }, { status: 400 })
    }
    const form = await (req as any).formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    const arrayBuf = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuf)
    const contentTypeHeader = (file as any).type || 'application/octet-stream'
    const originalName = (file as any).name || 'upload'
    const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const path = `uploads/${Date.now()}-${safeName}`
    const url = await uploadToBlob({ path, data: buf, contentType: contentTypeHeader })
    return NextResponse.json({ url, contentType: contentTypeHeader, name: originalName, size: (file as any).size })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 })
  }
}

