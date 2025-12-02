import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'victor.95.manuel@gmail.com'

// Helper to verify admin access
async function isAdmin() {
  const session = await getSession()
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return false
  }
  return true
}

// GET - List all family members (admin only)
export async function GET() {
  try {
    // Verify admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('christmas_users')
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
    console.error('Error in admin users API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Add new family member (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()
    const body = await request.json()
    const { email, name } = body

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('christmas_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El usuario ya existe' },
        { status: 400 }
      )
    }

    // Insert new user
    const { data, error } = await supabase
      .from('christmas_users')
      .insert([{ email, name }])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in admin users POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remove family member (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    // Delete user
    const { error } = await supabase
      .from('christmas_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch (error) {
    console.error('Error in admin users DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
