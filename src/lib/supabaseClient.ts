/**
 * Supabase Client — Frontend Singleton
 *
 * Only ever holds the ANON key here, never the service-role key — RLS
 * is what makes the anon key safe to ship in a browser bundle at all.
 * Every table this touches (scan_records, persistence_failure_log, ...)
 * already enforces auth.uid() = user_id at the database layer, and
 * oauth_connections deliberately has zero policies for this key at all
 * (service-role only — see schema.sql).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env.local file.'
  )
}

// Cached on globalThis rather than re-created on every module evaluation —
// Vite's HMR in dev can re-run this module multiple times without a full
// page reload, and creating a fresh client each time triggers supabase-js's
// "Multiple GoTrueClient instances detected" warning, since each instance
// tracks its own auth state independently. One shared client is like one
// reception desk in a building lobby rather than every floor running its
// own — visitors (auth state) get one consistent answer about who's signed in.
declare global {
  // eslint-disable-next-line no-var
  var __talonvigilSupabaseClient__: SupabaseClient | undefined
}

export const supabase: SupabaseClient =
  globalThis.__talonvigilSupabaseClient__ ??
  (globalThis.__talonvigilSupabaseClient__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Pinned explicitly even though these match supabase-js's current
      // defaults — same "explicit over implicit" reasoning as
      // celery_app.py's serializer pinning: a future library default
      // change shouldn't silently alter session behavior here.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }))
