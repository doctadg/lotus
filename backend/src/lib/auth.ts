import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export async function authenticateUser(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  // For now, we'll use a simple email-based authentication
  // In production, implement proper JWT or session-based auth
  try {
    const user = await prisma.user.findFirst({
      where: { email: token } // Using email as token for simplicity
    })
    
    return user?.id || null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function createOrGetUser(email: string, name?: string): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return existingUser.id
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      name
    }
  })

  return newUser.id
}