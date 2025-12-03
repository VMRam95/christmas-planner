import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// PUT - Update user's avatar URL
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
    const { avatar_url } = body

    if (typeof avatar_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'avatar_url debe ser una cadena de texto' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('users')
      .update({ avatar_url })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating avatar:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in profile avatar PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user's avatar (set to null)
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error removing avatar:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in profile avatar DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
