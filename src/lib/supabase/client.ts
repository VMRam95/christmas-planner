import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase client for browser-side operations
 * Use this in Client Components
 * Uses the christmas_planner schema to isolate from other projects
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'christmas_planner' }
})
