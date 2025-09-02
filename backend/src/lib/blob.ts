// Lightweight wrapper around Vercel Blob to upload binary data
// Requires: pnpm add @vercel/blob
// And env: BLOB_READ_WRITE_TOKEN (when running outside Vercel)

export type BlobUploadOptions = {
  path: string
  data: ArrayBuffer | Buffer | Uint8Array
  contentType?: string
  access?: 'public' | 'private'
}

export async function uploadToBlob(opts: BlobUploadOptions): Promise<string> {
  const { path, data, contentType, access = 'public' } = opts
  const token = process.env.BLOB_READ_WRITE_TOKEN

  // If no token is configured, skip upload attempt and throw immediately
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN not configured - blob uploads disabled')
    throw new Error('Blob storage not configured')
  }

  try {
    const mod: any = await import('@vercel/blob')
    const put = mod.put as (p: string, d: any, o: any) => Promise<{ url: string }>
    const res = await put(path, data, {
      access,
      contentType,
      token,
      addRandomSuffix: true,
    })
    return res.url
  } catch (err) {
    throw new Error(`Blob upload failed: ${(err as any)?.message || String(err)}`)
  }
}

