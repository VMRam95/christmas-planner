import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { sendNewWishNotifications } from '@/lib/email/notifications'

import type { NextRequest } from 'next/server'

// GET - Get wishes (own or by user_id query param)
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
    const userId = searchParams.get('user_id') || session.user.id

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching wishes:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener deseos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in wishes GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Create a new wish
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, url, priority } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El título es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('wishes')
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        url: url?.trim() || null,
        priority: priority || 2,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating wish:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear deseo' },
        { status: 500 }
      )
    }

    // Send email notifications to family members (async, don't block response)
    sendNewWishNotifications(session.user, data).then((result) => {
      if (result.sentTo.length > 0) {
        console.log(`Notifications sent to: ${result.sentTo.join(', ')}`)
      }
      if (result.errors.length > 0) {
        console.warn('Notification errors:', result.errors)
      }
    }).catch((err) => {
      console.error('Error sending notifications:', err)
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in wishes POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Update a wish
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
    const { id, title, description, url, priority } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('wishes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para editar este deseo' },
        { status: 403 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (url !== undefined) updates.url = url?.trim() || null
    if (priority !== undefined) updates.priority = priority

    const { data, error } = await supabase
      .from('wishes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating wish:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar deseo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in wishes PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a wish
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('wishes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar este deseo' },
        { status: 403 }
      )
    }

    const { error } = await supabase.from('wishes').delete().eq('id', id)

    if (error) {
      console.error('Error deleting wish:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar deseo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error in wishes DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
