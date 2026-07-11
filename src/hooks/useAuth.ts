/**
 * useAuth — React hook wrapping Supabase auth state.
 *
 * Relies entirely on onAuthStateChange rather than also calling
 * getSession() separately: supabase-js fires an INITIAL_SESSION event
 * immediately upon subscribing (confirmed against the installed
 * @supabase/auth-js types), carrying whatever session already exists —
 * so a second, separate getSession() call would just be redundant, with
 * both potentially setting state at slightly different times.
 *
 * Deliberately scoped to STATE + signOut only, not sign-in methods —
 * the actual sign-up/login UX isn't designed yet, and whichever page
 * builds that can call supabase.auth.signInWithPassword/signInWithOAuth
 * directly rather than this hook wrapping every possible auth method
 * speculatively.
 */
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    // Guards against setting state after unmount — React 18 StrictMode
    // (main.tsx already wraps the app in it) intentionally double-runs
    // effects in dev, mounting/unmounting/remounting once, so this also
    // prevents a stray state update from the first, discarded mount.
    let isMounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { ...state, signOut }
}
