/**
 * Supabase browser client.
 * @supabase/supabase-js is already a project dependency. Configure with:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 * in your .env.local (the backend already reads the same project's keys server-side).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null when env vars are absent (e.g. local demo without Supabase) — callers fall back gracefully. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

/** The current session's access token, or null if unauthenticated / unconfigured. */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
