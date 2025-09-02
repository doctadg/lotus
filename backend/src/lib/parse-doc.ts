import type { NextRequest } from 'next/server'

export type ParsedDoc = {
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'unknown'
  text: string
  meta?: Record<string, any>
}

export async function parseBuffer(filename: string, buf: Buffer): Promise<ParsedDoc> {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) {
    try {
      const pdfParse = (await import('pdf-parse')).default as any
      const result = await pdfParse(buf)
      return { type: 'pdf', text: result.text || '', meta: { info: result.info, numpages: result.numpages } }
    } catch (err: any) {
      throw new Error(`PDF parsing failed: ${err?.message || err}`)
    }
  }
  if (lower.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth') as any
      const { value } = await mammoth.extractRawText({ buffer: buf })
      return { type: 'docx', text: value || '' }
    } catch (err: any) {
      throw new Error(`DOCX parsing failed: ${err?.message || err}`)
    }
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return { type: 'md', text: buf.toString('utf8') }
  }
  if (lower.endsWith('.txt')) {
    return { type: 'txt', text: buf.toString('utf8') }
  }
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    const text = buf.toString('utf8')
    return { type: 'html', text }
  }
  return { type: 'unknown', text: buf.toString('utf8') }
}

export async function parseFromUrl(url: string): Promise<ParsedDoc> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`)
  const arrayBuf = await res.arrayBuffer()
  const buf = Buffer.from(arrayBuf)
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const filename = pathname.split('/').pop() || 'document'
  return parseBuffer(filename, buf)
}

