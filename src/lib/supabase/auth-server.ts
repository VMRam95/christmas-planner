import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Auth always uses the public key; the service role is reserved for guarded data APIs.
export async function createAuthClient() {
  const store = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values) => { values.forEach(({ name, value, options }) => store.set(name, value, options)) },
      },
    },
  )
}
