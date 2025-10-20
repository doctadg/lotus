import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getAuthenticatedUser } from '@/lib/clerk-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`profile-pictures/${user.userId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    // Update user's profile picture URL in database
    await prisma.user.update({
      where: { id: user.userId },
      data: { imageUrl: blob.url }
    })

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url
      }
    })

  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 })
  }
}