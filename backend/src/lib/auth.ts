import { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { hash } from 'bcryptjs'
import { prisma } from './prisma'
import { traceable } from 'langsmith/traceable'

interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export async function authenticateUser(request: NextRequest): Promise<{ userId: string; email: string; role: string } | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  if (!token || token.length === 0) {
    return null
  }

  // Check if token has proper JWT format (3 parts separated by dots)
  const tokenParts = token.split('.')
  if (tokenParts.length !== 3) {
    console.log('Invalid JWT format - expected 3 parts, got:', tokenParts.length)
    return null
  }
  
  try {
    // Verify JWT token
    const decoded = verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as JWTPayload
    
    // Verify user still exists and get current role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    })
    
    return user ? { userId: user.id, email: user.email, role: user.role } : null
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function authenticateAdmin(request: NextRequest): Promise<{ userId: string; email: string; role: string } | null> {
  const authData = await authenticateUser(request)
  
  if (!authData || authData.role !== 'admin') {
    return null
  }
  
  return authData
}

// Legacy function - kept for backwards compatibility but updated
export async function createOrGetUser(email: string, name?: string, password?: string): Promise<string> {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return existingUser.id
  }

  // For legacy compatibility, create a user with a default password if none provided
  const defaultPassword = password || 'temp-password-' + Date.now()
  const hashedPassword = await hash(defaultPassword, 12)

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword
    }
  })

  return newUser.id
}

// New helper functions for user management
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

export const getUserWithMemories = traceable(async (userId: string) => {
  console.log(`👤 [AUTH TRACE] Fetching user with memories for userId: ${userId}`)
  
  const result = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memories: {
        orderBy: { updatedAt: 'desc' },
        take: 50 // Latest 50 memories
      },
      contexts: {
        orderBy: { updatedAt: 'desc' },
        take: 1 // Latest context
      }
    }
  })
  
  console.log(`📊 [AUTH TRACE] User found: ${result ? 'Yes' : 'No'}, Memories: ${result?.memories?.length || 0}, Contexts: ${result?.contexts?.length || 0}`)
  
  return result
}, {
  name: "getUserWithMemories",
  tags: ["auth", "user", "memory", "lotus"],
  metadata: { 
    operation: "user_context_retrieval",
    service: "auth_service" 
  }
})
