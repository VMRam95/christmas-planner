import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-server'
import { getSession } from '@/lib/auth'
import { grantPasswordRecovery } from '@/lib/recovery'

export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type') || 'recovery'
  if (type !== 'recovery' && type !== 'invite') return NextResponse.redirect(new URL('/forgot-password?expired=1', request.url))
  if (!token_hash) return NextResponse.redirect(new URL('/forgot-password?expired=1', request.url))
  const auth = await createAuthClient()
  // Only provider-verified recovery/invite tokens can authorize choosing a password.
  const { error } = await auth.auth.verifyOtp({ token_hash, type })
  if (!error) {
    const session = await getSession()
    if (session) {
      await grantPasswordRecovery(session.user.id)
      return NextResponse.redirect(new URL('/reset-password', request.url))
    }
    await auth.auth.signOut({ scope: 'local' })
  }
  return NextResponse.redirect(new URL('/forgot-password?expired=1', request.url))
}
