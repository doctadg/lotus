import { prisma } from '@/lib/prisma'

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
      return messageUsage.count <= 15
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
