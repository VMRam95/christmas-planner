import { cookies } from 'next/headers'
import { createServerClient } from './supabase/server'

import type { User, Session } from '@/types'

const SESSION_COOKIE_NAME = 'christmas-planner-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session

    // Check if session has expired
    if (new Date(session.expires) < new Date()) {
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Validate email and create session if valid
 */
export async function validateAndCreateSession(email: string): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  const supabase = createServerClient()

  // Check if user exists in database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) {
    console.error('Auth error:', error)
    return {
      success: false,
      error: 'Este email no está autorizado para acceder',
    }
  }

  // Create session
  const session: Session = {
    user: user as User,
    expires: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return { success: true, user: user as User }
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
