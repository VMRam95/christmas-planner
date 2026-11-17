import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-server'
import { getSession } from '@/lib/auth'
import { grantPasswordRecovery } from '@/lib/recovery'

// A relative Location keeps the verified cookies on the incoming browser origin.
// request.url may contain Next's internal hostname behind a proxy or in development.
const redirect = (path: string) => new NextResponse(null, { status: 307, headers: { Location: path } })

export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type') || 'recovery'
  if (type !== 'recovery' && type !== 'invite') return redirect('/forgot-password?expired=1')
  if (!token_hash) return redirect('/forgot-password?expired=1')
  const auth = await createAuthClient()
  // Only provider-verified recovery/invite tokens can authorize choosing a password.
  const { error } = await auth.auth.verifyOtp({ token_hash, type })
  if (!error) {
    const session = await getSession()
    if (session) {
      await grantPasswordRecovery(session.user.id)
      return redirect('/reset-password')
    }
    await auth.auth.signOut({ scope: 'local' })
  }
  return redirect('/forgot-password?expired=1')
}
