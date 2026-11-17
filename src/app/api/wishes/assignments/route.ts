import { isId } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// GET - Get which wishes have assignments
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
    const wishIdsParam = searchParams.get('wish_ids')

    // Handle missing or empty wish_ids - return empty array
    if (!wishIdsParam || wishIdsParam.trim() === '') {
      return NextResponse.json({ success: true, data: [] })
    }

    // Parse comma-separated wish IDs
    const wishIds = wishIdsParam.split(',').filter(Boolean)

    if (wishIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    if (wishIds.length > 100 || !wishIds.every(isId)) return NextResponse.json({ success: false, error: 'IDs inválidos' }, { status: 400 })
    const supabase = createServerClient()
    const { data: visibleWishes, error: wishesError } = await supabase.from('wishes').select('id').in('id', wishIds).neq('user_id', session.user.id)
    if (wishesError) return NextResponse.json({ success: false, error: 'No se pudo comprobar la privacidad' }, { status: 500 })
    const visibleIds = visibleWishes?.map(w => w.id) || []
    if (!visibleIds.length) return NextResponse.json({ success: true, data: [] })

    // Query assignments for the provided wish IDs (include assigned_by to detect external assignments)
    const { data, error } = await supabase
      .from('assignments')
      .select('wish_id, assigned_by')
      .in('wish_id', visibleIds)

    if (error) {
      console.error('Error fetching wish assignments:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener asignaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: data?.map(a => ({ wish_id: a.wish_id, assigned_by: a.assigned_by === session.user.id ? session.user.id : a.assigned_by === null ? null : 'reserved' })) })
  } catch (error) {
    console.error('Error in wishes/assignments GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
