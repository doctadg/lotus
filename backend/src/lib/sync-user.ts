import { currentUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function syncUserWithDatabase(clerkUserId: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    })

    if (existingUser) {
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

    if (userByEmail) {
      // Update existing user with Clerk ID
      return await prisma.user.update({
        where: { id: userByEmail.id },
        data: { 
          clerkId: clerkUserId,
          name: name || userByEmail.name
        }
      })
    }

    // Create new user
    return await prisma.user.create({
      data: {
        email,
        name,
        clerkId: clerkUserId,
        password: '', // No password needed with Clerk
        role: 'user'
      }
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return null
  }
}