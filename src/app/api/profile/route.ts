import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (typeof body?.name !== 'string' || !body.name.trim() || body.name.trim().length > 80)
    return NextResponse.json({ success: false, error: 'El nombre debe tener entre 1 y 80 caracteres.' }, { status: 400 })
  const { data, error } = await createServerClient().from('users').update({ name: body.name.trim() }).eq('id', session.user.id).select().single()
  return error ? NextResponse.json({ success: false, error: 'No se pudo guardar el perfil.' }, { status: 500 }) : NextResponse.json({ success: true, data })
}
