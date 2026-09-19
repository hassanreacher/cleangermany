import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true when the environment variables are set – otherwise the site shows a setup notice instead of crashing */
export const supabaseConfigured = !!(url && anon)

export const supabase: SupabaseClient = createClient(url || 'https://placeholder.supabase.co', anon || 'public-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/* ---------- row types ---------- */
export type UserRole = 'client' | 'admin' | 'team'
export type OrderStatus = 'neu' | 'besichtigung' | 'angebot' | 'bestaetigt' | 'zugewiesen' | 'in_arbeit' | 'erledigt' | 'storniert'

export interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface OrderRow {
  id: string
  code: string
  customer_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  property_type: string
  cleaning_type: string
  size_sqm: number | null
  frequency: string | null
  times_per_period: number | null
  time_window: string | null
  street: string | null
  zip: string | null
  city: string | null
  floor: string | null
  details: Record<string, unknown>
  notes: string | null
  preferred_date: string | null
  preferred_time: string | null
  status: OrderStatus
  price: number | null
  internal_estimate: number | null
  admin_notes: string | null
  assigned_to: string | null
  assigned_at: string | null
  completed_at: string | null
  source: string
  created_at: string
  updated_at: string
  /** joined */
  assignee?: Pick<ProfileRow, 'id' | 'full_name' | 'email' | 'phone'> | null
}

export interface OrderEventRow { id: number; order_id: string; type: string; message: string | null; created_at: string }

export interface ReviewRow {
  id: string
  order_id: string | null
  author_name: string
  email: string | null
  city: string | null
  rating: number
  text: string
  approved: boolean
  created_at: string
}

export const statusLabel: Record<OrderStatus, string> = {
  neu: 'Neu', besichtigung: 'Besichtigung', angebot: 'Angebot gesendet', bestaetigt: 'Bestätigt', zugewiesen: 'Team zugewiesen', in_arbeit: 'In Arbeit', erledigt: 'Erledigt', storniert: 'Storniert',
}
export const statusTone: Record<OrderStatus, 'cyan' | 'green' | 'amber' | 'red' | 'gray'> = {
  neu: 'amber', besichtigung: 'amber', angebot: 'cyan', bestaetigt: 'green', zugewiesen: 'cyan', in_arbeit: 'cyan', erledigt: 'gray', storniert: 'red',
}
export const roleLabel: Record<UserRole, string> = { client: 'Kunde', admin: 'Admin', team: 'Team' }

/** Friendly message for Supabase / network errors */
export function errorText(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/Invalid login credentials/i.test(m)) return 'E-Mail oder Passwort ist falsch.'
  if (/Email not confirmed/i.test(m)) return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse (Link in der Bestätigungs-Mail).'
  if (/User already registered/i.test(m)) return 'Diese E-Mail ist bereits registriert – bitte anmelden.'
  if (/Password should be/i.test(m)) return 'Das Passwort muss mindestens 8 Zeichen haben.'
  if (/rate limit|too many requests/i.test(m)) return 'Der E-Mail-Versand ist gerade begrenzt – bitte in einigen Minuten erneut versuchen.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Keine Verbindung zur Datenbank. Bitte Internetverbindung prüfen.'
  return m
}
