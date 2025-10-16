import { prisma } from '@/lib/prisma'
import { getUserSubscriptionStatus } from '@/lib/subscription-status'

const FREE_HOURLY_MESSAGE_LIMIT = Number(process.env.FREE_HOURLY_MESSAGE_LIMIT || 15)
const FREE_DAILY_IMAGE_LIMIT = Number(process.env.FREE_DAILY_IMAGE_LIMIT || 3)
const FREE_DAILY_DEEP_RESEARCH_LIMIT = Number(process.env.FREE_DAILY_DEEP_RESEARCH_LIMIT || 2)

/**
 * Check if user is on free tier
 * Uses hybrid subscription logic: checks RevenueCat (mobile) and Clerk (web) billing
 */
async function isFreeUser(userId: string): Promise<boolean> {
  try {
    // Check hybrid subscription status (RevenueCat + Clerk)
    const subscriptionStatus = await getUserSubscriptionStatus()

    // If user has Pro from any source (RevenueCat or Clerk), they're not free
    if (subscriptionStatus.isPro) {
      console.log(`[Rate Limit] User has Pro subscription from ${subscriptionStatus.source}`)
      return false
    }

    // Fallback: check database subscription table
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    const isFree = !sub || sub.planType === 'free' || sub.status !== 'active'

    console.log(`[Rate Limit] User is ${isFree ? 'free' : 'pro'} based on database subscription`)
    return isFree
  } catch (e) {
    console.error('Error checking subscription plan:', e)
    // If there's an error, default to free tier for safety
    return true
  }
}

export async function trackMessageUsage(userId: string): Promise<boolean> {
  try {
    // Get the current hour timestamp
    const now = new Date()
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    // Find or create message usage record for this hour
    const messageUsage = await prisma.messageUsage.upsert({
      where: {
        userId_hour: {
          userId,
          hour: currentHour,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId,
        hour: currentHour,
        count: 1,
      },
    })

    // Check if user is on free plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    const isFreeUser = !subscription || subscription.planType === 'free'

    // If user is on free plan, check the limit
    if (isFreeUser) {
      return messageUsage.count <= FREE_HOURLY_MESSAGE_LIMIT
    }

    // Pro users have no limit
    return true
  } catch (error) {
    console.error('Error tracking message usage:', error)
    // If there's an error tracking usage, allow the message to go through
    return true
  }
}

export async function getMessageUsage(userId: string): Promise<number> {
  try {
    // Get the current hour timestamp
    const now = new Date()
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    // Find message usage record for this hour
    const messageUsage = await prisma.messageUsage.findUnique({
      where: {
        userId_hour: {
          userId,
          hour: currentHour,
        },
      },
    })

    return messageUsage?.count || 0
  } catch (error) {
    console.error('Error getting message usage:', error)
    return 0
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export async function trackImageGeneration(userId: string): Promise<boolean> {
  try {
    const free = await isFreeUser(userId)
    if (!free) return true

    const now = new Date()
    const day = startOfDay(now)

    const record = await prisma.imageUsage.upsert({
      where: { userId_day: { userId, day } },
      update: { count: { increment: 1 } },
      create: { userId, day, count: 1 },
    })

    return record.count <= FREE_DAILY_IMAGE_LIMIT
  } catch (error) {
    console.error('Error tracking image generation:', error)
    return true
  }
}

export async function getImageUsage(userId: string): Promise<number> {
  try {
    const now = new Date()
    const day = startOfDay(now)
    const record = await prisma.imageUsage.findUnique({
      where: { userId_day: { userId, day } },
    })
    return record?.count || 0
  } catch (e) {
    console.error('Error getting image usage:', e)
    return 0
  }
}

export async function trackDeepResearchUsage(userId: string): Promise<boolean> {
  try {
    const free = await isFreeUser(userId)
    if (!free) return true

    const now = new Date()
    const day = startOfDay(now)

    const record = await prisma.deepResearchUsage.upsert({
      where: { userId_day: { userId, day } },
      update: { count: { increment: 1 } },
      create: { userId, day, count: 1 },
    })

    return record.count <= FREE_DAILY_DEEP_RESEARCH_LIMIT
  } catch (e) {
    console.error('Error tracking deep research:', e)
    return true
  }
}

export async function getDeepResearchUsage(userId: string): Promise<number> {
  try {
    const now = new Date()
    const day = startOfDay(now)
    const record = await prisma.deepResearchUsage.findUnique({
      where: { userId_day: { userId, day } },
    })
    return record?.count || 0
  } catch (e) {
    console.error('Error getting deep research usage:', e)
    return 0
  }
}
