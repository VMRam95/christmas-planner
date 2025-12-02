import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use service role key if available, fallback to anon key
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase client for server-side operations
 * Use this in API routes and Server Components
 *
 * Uses the christmas_planner schema
 *
 * Note: If service role key is configured, this bypasses RLS
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseKey)
}
