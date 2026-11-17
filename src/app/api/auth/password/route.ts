import { passwordError } from '@/lib/validation'
import { NextRequest, NextResponse } from 'next/server'
import { hasPasswordRecovery, clearPasswordRecovery } from '@/lib/recovery'
import { getSession } from '@/lib/auth'
import { createAuthClient } from '@/lib/supabase/auth-server'
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (passwordError(body?.password))
    return NextResponse.json({ success: false, error: 'La contraseña debe tener entre 12 y 128 caracteres.' }, { status: 400 })
  const auth = await createAuthClient()
  if (!await hasPasswordRecovery(session.user.id)) {
    if (typeof body.currentPassword !== 'string' || !body.currentPassword) return NextResponse.json({ success: false, error: 'El enlace ha caducado o no está verificado. Solicita otro enlace o indica tu contraseña actual desde Mi cuenta.' }, { status: 403 })
    const { error: verifyError } = await auth.auth.signInWithPassword({ email: session.user.email, password: body.currentPassword })
    if (verifyError) return NextResponse.json({ success: false, error: 'La contraseña actual no es correcta.' }, { status: 400 })
  }
  const { error } = await auth.auth.updateUser({ password: body.password })
  if (error) return NextResponse.json({ success: false, error: 'No se pudo cambiar la contraseña.' }, { status: 400 })
  await clearPasswordRecovery()
  return NextResponse.json({ success: true, data: null })
}
