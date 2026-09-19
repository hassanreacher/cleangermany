import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured, type ProfileRow, type UserRole } from './supabase'

interface AuthCtx {
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  role: UserRole | null
  /** true while the initial session / profile is loading */
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (patch: { full_name?: string; phone?: string }) => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('id, email, full_name, phone, role, created_at').eq('id', u.id).maybeSingle()
    if (data) setProfile(data as ProfileRow)
    else {
      // profile row is created by a DB trigger; fall back to auth metadata until it exists
      setProfile({ id: u.id, email: u.email ?? '', full_name: (u.user_metadata?.full_name as string) ?? null, phone: (u.user_metadata?.phone as string) ?? null, role: 'client', created_at: u.created_at })
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    let alive = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      await loadProfile(data.session?.user ?? null)
      if (alive) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      // defer the DB call – Supabase warns against awaiting inside the callback
      setTimeout(() => { loadProfile(s?.user ?? null) }, 0)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [loadProfile])

  const value: AuthCtx = {
    session, user: session?.user ?? null, profile, role: profile?.role ?? null, loading, configured: supabaseConfigured,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
    },
    async signUp(email, password, fullName, phone) {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim(), phone: phone.trim() }, emailRedirectTo: `${window.location.origin}/login?confirmed=1` } })
      if (error) throw error
      return { needsConfirmation: !data.session }
    },
    async signOut() { await supabase.auth.signOut(); setProfile(null) },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login?reset=1` })
      if (error) throw error
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    async updateProfile(patch) {
      if (!session?.user) return
      const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id)
      if (error) throw error
      await loadProfile(session.user)
    },
    async refreshProfile() { await loadProfile(session?.user ?? null) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}

/** Where a user lands after login, by role */
export const homeForRole = (role: UserRole | null) => (role === 'admin' ? '/dashboard' : role === 'team' ? '/team' : '/konto')
