import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

// Helper to get authenticated user from Clerk
export async function getAuthenticatedUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  // Get user details from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }
  
  // Sync with our database
  const dbUser = await syncUserWithDatabase(clerkUser);
  
  return {
    userId: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    clerkId: userId
  };
}

// Sync Clerk user with our database
async function syncUserWithDatabase(clerkUser: any) {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username;
  
  // Find or create user in our database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id }
  });
  
  if (!user) {
    // Check if user exists by email (for migration)
    user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      // Update existing user with Clerk ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          clerkId: clerkUser.id,
          name: name || user.name
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          clerkId: clerkUser.id,
          password: '', // No password needed with Clerk
          role: 'user'
        }
      });
    }
  } else {
    // Update user info from Clerk
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        name: name || user.name
      }
    });
  }
  
  return user;
}

// Authenticate admin users
export async function authenticateAdmin() {
  const user = await getAuthenticatedUser();
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return user;
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

// Create session token for frontend (to maintain compatibility)
export async function createSessionToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Return user info that frontend expects
  return {
    token: 'clerk-managed', // Token is managed by Clerk
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}