import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - Get all users (family members)
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener usuarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
