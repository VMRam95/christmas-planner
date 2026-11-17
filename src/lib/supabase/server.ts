import { createClient } from '@supabase/supabase-js'

/** Data access is server-only and requires a verified session in every API. */
export function createServerClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key || key === 'your-service-role-key-here') throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    db: { schema: 'christmas_planner' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
