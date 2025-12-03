import { createServerClient } from '@/lib/supabase/server'
import { createNewWishNotifications } from '@/lib/notifications'

import type { User, Wish } from '@/types'

const APP_URL = 'https://christmas-planner.vercel.app'

type NotificationResult = {
  success: boolean
  sentTo: string[]
  errors: string[]
  dbNotifications: { created: number; errors: number }
}

/**
 * Send email notifications to family members when a user adds a new wish
 * Only sends to users who have email_notifications_enabled = true
 */
export async function sendNewWishNotifications(
  wishCreator: User,
  wish: Wish
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: true,
    sentTo: [],
    errors: [],
    dbNotifications: { created: 0, errors: 0 },
  }

  try {
    // Create in-app notifications in database (independent of email)
    const dbResult = await createNewWishNotifications(wishCreator, wish)
    result.dbNotifications = { created: dbResult.created, errors: dbResult.errors }
    if (!dbResult.success) {
      console.warn('Some DB notifications failed:', dbResult)
    }
    // Get EmailJS config
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim()
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_NOTIFICATION_TEMPLATE_ID?.trim()
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim()

    if (!serviceId || !templateId || !publicKey) {
      console.warn('EmailJS notification template not configured, skipping notifications')
      result.errors.push('EmailJS not configured')
      return result
    }

    const supabase = createServerClient()

    // Get all users except the wish creator who have notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .neq('id', wishCreator.id)

    if (usersError) {
      console.error('Error fetching users for notifications:', usersError)
      result.success = false
      result.errors.push('Error fetching users')
      return result
    }

    if (!users || users.length === 0) {
      return result // No other users to notify
    }

    // Get preferences for these users
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('user_id, email_notifications_enabled')
      .in(
        'user_id',
        users.map((u) => u.id)
      )

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError)
    }

    // Create a map of user preferences (default to true if not found)
    const prefsMap = new Map<string, boolean>()
    preferences?.forEach((p) => {
      prefsMap.set(p.user_id, p.email_notifications_enabled)
    })

    // Filter users who have notifications enabled (default true if no preference set)
    const usersToNotify = users.filter((user) => {
      const hasNotificationsEnabled = prefsMap.get(user.id)
      // If no preference set, default to true (opt-out model)
      return hasNotificationsEnabled !== false
    })

    if (usersToNotify.length === 0) {
      return result // All users have notifications disabled
    }

    // Build the wishlist link
    const wishlistLink = `${APP_URL}/family/${wishCreator.id}`

    // Send emails to all eligible users using EmailJS REST API
    // (REST API works server-side, unlike @emailjs/browser SDK)
    const sendPromises = usersToNotify.map(async (recipient) => {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              to_name: recipient.name,
              to_email: recipient.email,
              creator_name: wishCreator.name,
              gift_title: wish.title,
              gift_description: wish.description || 'Sin descripcion',
              gift_url: wish.url || '',
              wishlist_link: wishlistLink,
              app_url: APP_URL,
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`EmailJS API error: ${response.status} - ${errorText}`)
        }

        result.sentTo.push(recipient.email)
      } catch (err) {
        console.error(`Error sending notification to ${recipient.email}:`, err)
        result.errors.push(`Failed to send to ${recipient.email}`)
      }
    })

    await Promise.all(sendPromises)

    if (result.errors.length > 0 && result.sentTo.length === 0) {
      result.success = false
    }

    return result
  } catch (error) {
    console.error('Error in sendNewWishNotifications:', error)
    result.success = false
    result.errors.push('Unexpected error')
    return result
  }
}
