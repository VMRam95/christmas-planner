import { createServerClient } from '@/lib/supabase/server'

import type { User, Wish } from '@/types'

type CreateNotificationParams = {
  user_id: string
  type: string
  title: string
  message: string
  link?: string
}

/**
 * Create a notification for a single user
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from('notifications').insert({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    })

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in createNotification:', error)
    return false
  }
}

/**
 * Create notifications for multiple users when a new wish is added
 */
export async function createNewWishNotifications(
  wishCreator: User,
  wish: Wish
): Promise<{ success: boolean; created: number; errors: number }> {
  const result = { success: true, created: 0, errors: 0 }

  try {
    const supabase = createServerClient()

    // Get all users except the wish creator
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .neq('id', wishCreator.id)

    if (usersError) {
      console.error('Error fetching users for notifications:', usersError)
      result.success = false
      return result
    }

    if (!users || users.length === 0) {
      return result // No other users to notify
    }

    // Create notifications for all other users
    const notifications = users.map((user) => ({
      user_id: user.id,
      type: 'new_wish',
      title: `${wishCreator.name} ha añadido un regalo`,
      message: wish.title,
      link: `/family/${wishCreator.id}`,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error creating notifications:', insertError)
      result.success = false
      result.errors = notifications.length
    } else {
      result.created = notifications.length
    }

    return result
  } catch (error) {
    console.error('Error in createNewWishNotifications:', error)
    result.success = false
    return result
  }
}
