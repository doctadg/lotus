import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

// Simple in-memory cache for user sync operations
const userCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function syncUserWithDatabase(clerkUserId: string) {
  try {
    // Check cache first
    const cached = userCache.get(clerkUserId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.user
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    })

    if (existingUser) {
      // Cache the result
      userCache.set(clerkUserId, { user: existingUser, timestamp: Date.now() })
      return existingUser
    }

    // Get user details from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return null
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || ''

    // Check if user exists by email (for migration)
    const userByEmail = await prisma.user.findUnique({
      where: { email }
    })

    let user: any
    if (userByEmail) {
      // Update existing user with Clerk ID
      user = await prisma.user.update({
        where: { id: userByEmail.id },
        data: { 
          clerkId: clerkUserId,
          name: name || userByEmail.name
        }
      })
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          clerkId: clerkUserId,
          password: '', // No password needed with Clerk
          role: 'user'
        }
      })
    }

    // Cache the result
    userCache.set(clerkUserId, { user, timestamp: Date.now() })
    return user
  } catch (error) {
    console.error('Error syncing user:', error)
    return null
  }
}

// Function to clear cache for a specific user (useful for testing)
export function clearUserCache(clerkUserId?: string) {
  if (clerkUserId) {
    userCache.delete(clerkUserId)
  } else {
    userCache.clear()
  }
}