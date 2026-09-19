/**
 * Vercel Serverless Function – creates orders and reviews server-side (service role) so guests can submit
 * without needing read access to the table, and sends the confirmation e-mails right away.
 *
 * POST { kind: 'order', profile, slot?, source? }  → { order }
 * POST { kind: 'review', review }                   → { ok: true }
 * Optional header Authorization: Bearer <supabase access token> links the record to the logged-in user.
 */
import { getEnv, callerInfo, mailOrderCreated, mailReviewCreated } from './_lib/mail'

type Req = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

const PROPERTY = ['buero', 'praxis', 'kita', 'schule', 'treppenhaus', 'gewerbe', 'halle', 'wohnung', 'haus']
const CLEANING = ['unterhalt', 'grund', 'intensiv', 'bauend', 'baugrob', 'glas', 'garten', 'aussen']
const s = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null)
const b = (v: unknown) => (typeof v === 'boolean' ? v : null)
const arr = (v: unknown, max = 20) => (Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, max) : [])

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const env = getEnv(req.headers)
  if (!env.admin) return res.status(500).json({ error: 'Server nicht konfiguriert (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen).' })
  const body = req.body ?? {}
  const caller = await callerInfo(env.admin, req.headers.authorization as string | undefined)

  try {
    if (body.kind === 'order') {
      const p = body.profile ?? {}
      const email = s(p.email).toLowerCase(), name = s(p.name, 160), phone = s(p.phone, 60)
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' })
      if (name.length < 2 || phone.length < 5) return res.status(400).json({ error: 'Name und Telefonnummer sind erforderlich.' })
      if (!PROPERTY.includes(p.propertyType) || !CLEANING.includes(p.cleaningType)) return res.status(400).json({ error: 'Objektart oder Leistung fehlt.' })
      const slot = body.slot && /^\d{4}-\d{2}-\d{2}$/.test(body.slot.date ?? '') && /^\d{2}:\d{2}$/.test(body.slot.time ?? '') ? body.slot : null
      const row = {
        customer_id: caller?.id ?? null,
        customer_name: name, customer_email: email, customer_phone: phone,
        property_type: p.propertyType, cleaning_type: p.cleaningType, size_sqm: n(p.sizeSqm), frequency: s(p.frequency, 30) || null, times_per_period: n(p.timesPerPeriod),
        time_window: s(p.timeWindow, 30) || null, street: s(p.street), zip: s(p.zip, 10), city: s(p.city, 80), floor: s(p.floor, 40),
        details: {
          floorTypes: arr(p.floorTypes), dirt: s(p.dirt, 20), access: s(p.access, 20), rooms: n(p.rooms), bathrooms: n(p.bathrooms), desks: n(p.desks), showers: n(p.showers), kitchenSize: s(p.kitchenSize, 20), wasteBins: n(p.wasteBins),
          glassSqm: n(p.glassSqm), glassBothSides: !!p.glassBothSides, entrances: n(p.entrances), floorsCount: n(p.floorsCount), basement: b(p.basement), windows: n(p.windows), hours: n(p.hours), elevator: b(p.elevator), pets: b(p.pets), extras: arr(p.extras),
        },
        notes: s(p.notes, 2000) || null, preferred_date: slot?.date ?? null, preferred_time: slot?.time ?? null,
        source: body.source === 'ki' ? 'ki' : 'web', internal_estimate: typeof body.internalEstimate === 'number' ? body.internalEstimate : null,
        notified_at: env.send ? new Date().toISOString() : null,
      }
      const { data, error } = await env.admin.from('orders').insert(row).select('*').single()
      if (error) return res.status(400).json({ error: error.message })
      try { await mailOrderCreated(env, data) } catch (e) { console.error('mail failed', e) }
      return res.status(200).json({ order: data, mailed: !!env.send })
    }

    if (body.kind === 'review') {
      const r = body.review ?? {}
      const rating = n(r.rating), text = s(r.text, 1200), author = s(r.author_name, 120), email = s(r.email, 200).toLowerCase()
      if (!rating || rating < 1 || rating > 5 || text.length < 10 || author.length < 2) return res.status(400).json({ error: 'Bitte Name, Bewertung (1–5) und mindestens 10 Zeichen Text angeben.' })
      const row = { author_name: author, email: email || null, city: s(r.city, 80) || null, rating, text, order_id: typeof r.order_id === 'string' && /^[0-9a-f-]{36}$/.test(r.order_id) ? r.order_id : null, customer_id: caller?.id ?? null, approved: false, notified_at: env.send ? new Date().toISOString() : null }
      const { data, error } = await env.admin.from('reviews').insert(row).select('*').single()
      if (error) return res.status(400).json({ error: error.message })
      try { await mailReviewCreated(env, data) } catch (e) { console.error('mail failed', e) }
      return res.status(200).json({ ok: true, id: data.id })
    }
    return res.status(400).json({ error: 'unknown kind' })
  } catch (e) {
    return res.status(500).json({ error: String((e as Error)?.message ?? e) })
  }
}
