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

    if (!wishIdsParam) {
      return NextResponse.json(
        { success: false, error: 'wish_ids es requerido' },
        { status: 400 }
      )
    }

    // Parse comma-separated wish IDs
    const wishIds = wishIdsParam.split(',').filter(Boolean)

    if (wishIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const supabase = createServerClient()

    // Query assignments for the provided wish IDs
    const { data, error } = await supabase
      .from('christmas_assignments')
      .select('wish_id')
      .in('wish_id', wishIds)

    if (error) {
      console.error('Error fetching wish assignments:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener asignaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in wishes/assignments GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
