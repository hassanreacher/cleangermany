/**
 * Data access for orders (Anfragen), reviews and slots – all through Supabase with RLS.
 * E-mails are sent by /api/notify (Vercel function with your SMTP) – called fire-and-forget after the DB write.
 */
import { supabase, type OrderRow, type OrderStatus, type ProfileRow, type ReviewRow, type OrderEventRow } from './supabase'
import type { Profile } from './types'
import { quote } from './pricing'

const ORDER_COLS = 'id, code, customer_id, customer_name, customer_email, customer_phone, property_type, cleaning_type, size_sqm, frequency, times_per_period, time_window, street, zip, city, floor, details, notes, preferred_date, preferred_time, status, price, internal_estimate, admin_notes, assigned_to, assigned_at, completed_at, source, created_at, updated_at'
const ORDER_COLS_JOINED = `${ORDER_COLS}, assignee:profiles!orders_assigned_to_fkey (id, full_name, email, phone)`

/** Fire-and-forget call to the e-mail function. Never blocks the UI. */
export function notify(payload: Record<string, unknown>, accessToken?: string) {
  fetch('/api/notify', { method: 'POST', headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify(payload), keepalive: true }).catch(() => { /* ignore */ })
}

async function token() { return (await supabase.auth.getSession()).data.session?.access_token }

/** Create an order from the wizard/chat profile. Works for guests and logged-in customers. */
export async function createOrder(p: Profile, slot: { date: string; time: string } | null, source: 'web' | 'ki' = 'web'): Promise<OrderRow> {
  const { data: s } = await supabase.auth.getSession()
  const uid = s.session?.user.id ?? null
  let internal: number | null = null
  try { const q = quote(p); internal = q.needsInspection ? null : q.perVisitNet } catch { /* estimate is only a hint */ }
  const row = {
    customer_id: uid,
    customer_name: p.name.trim(), customer_email: p.email.trim().toLowerCase(), customer_phone: p.phone.trim(),
    property_type: p.propertyType, cleaning_type: p.cleaningType, size_sqm: p.sizeSqm, frequency: p.frequency || null, times_per_period: p.timesPerPeriod,
    time_window: p.timeWindow || null, street: p.street, zip: p.zip, city: p.city, floor: p.floor,
    details: {
      floorTypes: p.floorTypes, dirt: p.dirt, access: p.access, rooms: p.rooms, bathrooms: p.bathrooms, desks: p.desks, showers: p.showers, kitchenSize: p.kitchenSize, wasteBins: p.wasteBins,
      glassSqm: p.glassSqm, glassBothSides: p.glassBothSides, entrances: p.entrances, floorsCount: p.floorsCount, basement: p.basement, windows: p.windows, hours: p.hours, elevator: p.elevator, pets: p.pets, extras: p.extras,
    },
    notes: p.notes || null, preferred_date: slot?.date ?? null, preferred_time: slot?.time ?? null, source, internal_estimate: internal,
  }
  const { data, error } = await supabase.from('orders').insert(row).select(ORDER_COLS).single()
  if (error) throw error
  notify({ type: 'order_created', orderId: data.id })
  return data as OrderRow
}

/* ---------- customer ---------- */
export async function myOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase.from('orders').select(ORDER_COLS_JOINED).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as OrderRow[]
}
export async function cancelMyOrder(id: string) {
  const { error } = await supabase.rpc('cancel_my_order', { p_order_id: id })
  if (error) throw error
  notify({ type: 'order_status', orderId: id }, await token())
}

/* ---------- team ---------- */
export async function assignedOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase.from('orders').select(ORDER_COLS).order('preferred_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as OrderRow[]
}
export async function setOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
  notify({ type: 'order_status', orderId: id }, await token())
}

/* ---------- admin ---------- */
export async function allOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase.from('orders').select(ORDER_COLS_JOINED).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as OrderRow[]
}
export async function updateOrder(id: string, patch: Partial<Pick<OrderRow, 'status' | 'price' | 'admin_notes' | 'assigned_to' | 'preferred_date' | 'preferred_time'>>, opts: { notifyStatus?: boolean; notifyAssign?: boolean } = {}) {
  const { error } = await supabase.from('orders').update(patch).eq('id', id)
  if (error) throw error
  const t = await token()
  if (opts.notifyAssign) notify({ type: 'order_assigned', orderId: id }, t)
  else if (opts.notifyStatus) notify({ type: 'order_status', orderId: id }, t)
}
export async function orderEvents(orderId: string): Promise<OrderEventRow[]> {
  const { data, error } = await supabase.from('order_events').select('id, order_id, type, message, created_at').eq('order_id', orderId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as OrderEventRow[]
}
export async function allProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase.from('profiles').select('id, email, full_name, phone, role, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProfileRow[]
}
export async function setRole(id: string, role: ProfileRow['role']) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
}
export async function adminStats(): Promise<{ open: number; active: number; done: number; revenue: number; customers: number; team: number; pending_reviews: number; by_month: { month: string; orders: number; revenue: number }[] }> {
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw error
  return data
}

/* ---------- slots ---------- */
export async function bookedSlots(from: string, to: string): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('booked_slots', { from_date: from, to_date: to })
  if (error) throw error
  return new Set((data as { slot_date: string; slot_time: string }[] ?? []).map(r => `${r.slot_date}T${r.slot_time.slice(0, 5)}`))
}
export async function listBlockedSlots(from: string, to: string) {
  const { data, error } = await supabase.from('blocked_slots').select('id, slot_date, slot_time, reason').gte('slot_date', from).lte('slot_date', to)
  if (error) throw error
  return (data ?? []) as { id: number; slot_date: string; slot_time: string; reason: string | null }[]
}
export async function toggleBlockedSlot(date: string, time: string) {
  const { data } = await supabase.from('blocked_slots').select('id').eq('slot_date', date).eq('slot_time', time).maybeSingle()
  if (data) { const { error } = await supabase.from('blocked_slots').delete().eq('id', data.id); if (error) throw error }
  else { const { error } = await supabase.from('blocked_slots').insert({ slot_date: date, slot_time: time }); if (error) throw error }
}

/* ---------- reviews ---------- */
export async function approvedReviews(limit = 12): Promise<ReviewRow[]> {
  const { data, error } = await supabase.from('reviews').select('id, order_id, author_name, email, city, rating, text, approved, created_at').eq('approved', true).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return (data ?? []) as ReviewRow[]
}
export async function reviewStats(): Promise<{ avg: number; count: number } | null> {
  const { data, error } = await supabase.rpc('review_stats')
  if (error) return null
  const r = Array.isArray(data) ? data[0] : data
  return r && Number(r.review_count) > 0 ? { avg: Number(r.avg_rating), count: Number(r.review_count) } : null
}
export async function submitReview(r: { author_name: string; email: string; city: string; rating: number; text: string; order_id?: string | null }) {
  const { data, error } = await supabase.from('reviews').insert({ ...r, email: r.email.toLowerCase() }).select('id').single()
  if (error) throw error
  notify({ type: 'review_created', reviewId: data.id })
}
export async function allReviews(): Promise<ReviewRow[]> {
  const { data, error } = await supabase.from('reviews').select('id, order_id, author_name, email, city, rating, text, approved, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ReviewRow[]
}
export async function setReviewApproved(id: string, approved: boolean) {
  const { error } = await supabase.from('reviews').update({ approved }).eq('id', id)
  if (error) throw error
}
export async function deleteReview(id: string) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}
