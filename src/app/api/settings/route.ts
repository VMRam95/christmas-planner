import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// GET - Get current user's preferences
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Get user preferences, create default if not exists
    let { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No preferences found, create default
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: session.user.id,
          email_notifications_enabled: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating default preferences:', insertError)
        return NextResponse.json(
          { success: false, error: 'Error al crear preferencias' },
          { status: 500 }
        )
      }

      data = newPrefs
    } else if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener preferencias' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in settings GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Update user's preferences
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
    const { email_notifications_enabled } = body

    if (typeof email_notifications_enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'email_notifications_enabled debe ser un booleano' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Upsert preferences (insert or update)
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: session.user.id,
          email_notifications_enabled,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar preferencias' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in settings PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
