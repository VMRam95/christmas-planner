import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// GET - Get assignments by current user
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

    const { data, error } = await supabase
      .from('christmas_assignments')
      .select('*, christmas_wishes(*)')
      .eq('assigned_by', session.user.id)

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener asignaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in assignments GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Assign a wish to current user
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
    const { wish_id } = body

    if (!wish_id) {
      return NextResponse.json(
        { success: false, error: 'wish_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if wish exists and is not owned by current user
    const { data: wish } = await supabase
      .from('christmas_wishes')
      .select('user_id')
      .eq('id', wish_id)
      .single()

    if (!wish) {
      return NextResponse.json(
        { success: false, error: 'Deseo no encontrado' },
        { status: 404 }
      )
    }

    if (wish.user_id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes asignarte tus propios deseos' },
        { status: 400 }
      )
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('christmas_assignments')
      .select('id')
      .eq('wish_id', wish_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Este deseo ya está asignado' },
        { status: 400 }
      )
    }

    // Create assignment
    const { data, error } = await supabase
      .from('christmas_assignments')
      .insert({
        wish_id,
        assigned_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json(
        { success: false, error: 'Error al asignar regalo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in assignments POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Unassign a wish
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
    const wish_id = searchParams.get('wish_id')

    if (!wish_id) {
      return NextResponse.json(
        { success: false, error: 'wish_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Can only delete own assignments
    const { error } = await supabase
      .from('christmas_assignments')
      .delete()
      .eq('wish_id', wish_id)
      .eq('assigned_by', session.user.id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json(
        { success: false, error: 'Error al quitar asignación' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error in assignments DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
