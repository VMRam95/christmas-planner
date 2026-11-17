import { clearPasswordRecovery } from './recovery'
import { cookies } from 'next/headers'
import { createAuthClient } from './supabase/auth-server'
import { createServerClient } from './supabase/server'
import type { User, Session } from '@/types'

export async function getSession(): Promise<Session | null> {
  const auth = await createAuthClient()
  // getUser verifies the token against Auth. Never trust a client-supplied user cookie.
  const { data: { user }, error } = await auth.auth.getUser()
  if (error || !user?.email || !user.email_confirmed_at) return null
  const { data: member } = await createServerClient().from('users').select('*')
    .eq('email', user.email.toLowerCase()).single()
  if (!member) return null
  return { user: member as User, expires: new Date(Date.now() + 3600000).toISOString() }
}

export async function getCurrentUser(): Promise<User | null> {
  return (await getSession())?.user ?? null
}

export async function validateAndCreateSession(email: string, password: string) {
  const auth = await createAuthClient()
  const { error } = await auth.auth.signInWithPassword({ email: email.toLowerCase().trim(), password })
  if (!error) {
    const session = await getSession()
    if (session) return { success: true, user: session.user }
    await auth.auth.signOut({ scope: 'local' })
  }
  return { success: false, error: 'No se ha podido acceder. Comprueba tus credenciales y que tu cuenta pertenece a la familia.' }
}

export async function clearSession(): Promise<void> {
  const auth = await createAuthClient()
  await auth.auth.signOut({ scope: 'local' })
  await clearPasswordRecovery()
  ;(await cookies()).delete('christmas-planner-session')
}
