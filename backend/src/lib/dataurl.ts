export function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  try {
    if (!dataUrl.startsWith('data:')) return null
    const firstComma = dataUrl.indexOf(',')
    if (firstComma === -1) return null
    const header = dataUrl.slice(5, firstComma) // after 'data:'
    const base64 = dataUrl.slice(firstComma + 1)
    const isBase64 = /;base64/i.test(header)
    const mime = header.replace(/;base64/i, '') || 'application/octet-stream'
    const buffer = isBase64 ? Buffer.from(base64, 'base64') : Buffer.from(decodeURIComponent(base64), 'utf8')
    return { mime, buffer }
  } catch {
    return null
  }
}

export function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'bin'
}

