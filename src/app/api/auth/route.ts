import { NextResponse } from 'next/server'
import { getSession, validateAndCreateSession, clearSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// GET - Check current session and fetch fresh user data
export async function GET() {
  try {
    const session = await getSession()

    if (session) {
      // Fetch fresh user data from database to get updated avatar, etc.
      const supabase = createServerClient()
      const { data: freshUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !freshUser) {
        // If user not found, session is invalid
        return NextResponse.json({
          success: true,
          data: { user: null },
        })
      }

      return NextResponse.json({
        success: true,
        data: { user: freshUser },
      })
    }

    return NextResponse.json({
      success: true,
      data: { user: null },
    })
  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json(
      { success: false, error: 'Error al verificar sesión' },
      { status: 500 }
    )
  }
}

// POST - Login with email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const result = await validateAndCreateSession(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: { user: result.user },
      })
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json(
      { success: false, error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}

// DELETE - Logout
export async function DELETE() {
  try {
    await clearSession()
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
