import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// GET - Get user's notifications with unread count
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    const supabase = createServerClient()

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener notificaciones' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .is('read_at', null)

    if (countError) {
      console.error('Error counting unread notifications:', countError)
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        unread_count: unreadCount || 0,
      },
    })
  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notification_ids, mark_all } = body

    const supabase = createServerClient()

    if (mark_all) {
      // Mark all user's notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .is('read_at', null)

      if (error) {
        console.error('Error marking all as read:', error)
        return NextResponse.json(
          { success: false, error: 'Error al marcar notificaciones' },
          { status: 500 }
        )
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .in('id', notification_ids)
        .is('read_at', null)

      if (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json(
          { success: false, error: 'Error al marcar notificaciones' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere notification_ids o mark_all' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error in notifications PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
