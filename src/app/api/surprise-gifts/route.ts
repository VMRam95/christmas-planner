import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

// GET - Get surprise gifts (given by me, or for a recipient)
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
    const recipientId = searchParams.get('recipient_id')

    const supabase = createServerClient()

    if (recipientId) {
      // Get surprise gifts for a recipient (excluding those given by the recipient themselves)
      // This is used when viewing someone else's page to see what others are giving them
      const { data, error } = await supabase
        .from('christmas_surprise_gifts')
        .select('*')
        .eq('recipient_id', recipientId)
        .neq('recipient_id', session.user.id) // Don't show surprise gifts TO the current user
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching surprise gifts:', error)
        return NextResponse.json(
          { success: false, error: 'Error al obtener regalos sorpresa' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } else {
      // Get surprise gifts given by current user
      const { data, error } = await supabase
        .from('christmas_surprise_gifts')
        .select('*, recipient:christmas_users(id, name)')
        .eq('giver_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching surprise gifts:', error)
        return NextResponse.json(
          { success: false, error: 'Error al obtener regalos sorpresa' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }
  } catch (error) {
    console.error('Error in surprise-gifts GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Create a surprise gift
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
    const { recipient_id, description } = body

    if (!recipient_id) {
      return NextResponse.json(
        { success: false, error: 'recipient_id es requerido' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'La descripción es requerida' },
        { status: 400 }
      )
    }

    if (recipient_id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes crear un regalo sorpresa para ti mismo' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify recipient exists
    const { data: recipient } = await supabase
      .from('christmas_users')
      .select('id')
      .eq('id', recipient_id)
      .single()

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Destinatario no encontrado' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('christmas_surprise_gifts')
      .insert({
        giver_id: session.user.id,
        recipient_id,
        description: description.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating surprise gift:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear regalo sorpresa' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in surprise-gifts POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a surprise gift
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

    // Can only delete own surprise gifts
    const { error } = await supabase
      .from('christmas_surprise_gifts')
      .delete()
      .eq('id', id)
      .eq('giver_id', session.user.id)

    if (error) {
      console.error('Error deleting surprise gift:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar regalo sorpresa' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error in surprise-gifts DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
