import { createServerClient } from '@/lib/supabase/server'
import { createNewWishNotifications } from '@/lib/notifications'
import { sendEmail, sendEmailBatch } from './client'

import type { User, Wish } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://christmas-planner.vercel.app'

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
      result.success = false
      console.warn('Some DB notifications failed:', dbResult)
    }

    if (process.env.EMAIL_DELIVERY_ENABLED !== 'true') return result

    // Check if email service is configured
    if (!process.env.EMAIL_SERVICE_API_KEY) {
      console.warn('EMAIL_SERVICE_API_KEY not configured, skipping email notifications')
      result.success = false
      result.errors.push('Email service not configured')
      return result
    }

    const supabase = createServerClient()

    // Get all users except the wish creator
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
      result.success = false
      result.errors.push('Unable to verify email preferences; delivery skipped')
      return result
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

    // Send emails using the email service
    const batchResult = await sendEmailBatch(
      usersToNotify.map((user) => ({
        email: user.email,
        data: {
          to_name: user.name,
          creator_name: wishCreator.name,
          gift_title: wish.title,
          gift_description: wish.description || '',
          gift_url: wish.url || '',
          wishlist_link: wishlistLink,
          app_url: APP_URL,
        },
      })),
      'christmas-planner/gift-added'
    )

    result.sentTo = batchResult.sentTo
    result.errors.push(...batchResult.errors)

    if (batchResult.failed > 0) {
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

/**
 * Send reminder notification before Christmas
 */
export async function sendChristmasReminder(
  user: User,
  daysLeft: number,
  pendingGifts: number,
  unassignedWishes: number
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.EMAIL_SERVICE_API_KEY) {
    return { success: false, error: 'Email service not configured' }
  }

  const emailResult = await sendEmail({
    to: user.email,
    template: 'christmas-planner/reminder',
    data: {
      to_name: user.name,
      days_left: daysLeft,
      pending_gifts: pendingGifts > 0 ? pendingGifts : undefined,
      unassigned_wishes: unassignedWishes > 0 ? unassignedWishes : undefined,
      app_url: APP_URL,
    },
  })

  return emailResult
}
