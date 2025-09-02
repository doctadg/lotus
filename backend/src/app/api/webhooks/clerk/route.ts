import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  // Get the headers
  const headersList = await headers()
  const svix_id = headersList.get("svix-id")
  const svix_timestamp = headersList.get("svix-timestamp")
  const svix_signature = headersList.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return new Response('Error: CLERK_WEBHOOK_SECRET not configured', {
      status: 500
    })
  }

  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  // Handle user creation/update
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data

    const email = email_addresses[0]?.email_address
    if (!email) {
      return new Response('No email found', { status: 400 })
    }

    const name = `${first_name || ''} ${last_name || ''}`.trim() || username || ''

    try {
      // Upsert user in database
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          name,
        },
        create: {
          clerkId: id,
          email,
          name,
          password: '', // No password needed with Clerk
          role: 'user',
        },
      })

      console.log(`User ${id} synced successfully`)
    } catch (error) {
      console.error('Error syncing user:', error)
      return new Response('Error syncing user', { status: 500 })
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete user from database (cascade will handle related data)
      await prisma.user.delete({
        where: { clerkId: id },
      })

      console.log(`User ${id} deleted successfully`)
    } catch (error) {
      console.error('Error deleting user:', error)
      // User might not exist in database, that's okay
    }
  }

  // Handle session creation (optional - for logging/analytics)
  if (eventType === 'session.created') {
    const { user_id } = evt.data
    console.log(`New session created for user ${user_id}`)
  }

  return new Response('Webhook processed', { status: 200 })
}