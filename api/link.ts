/**
 * Vercel Serverless Function – attaches guest requests and reviews to the logged-in user (matched by e-mail).
 * Called by the website right after login / signup, idempotent.
 * POST with Authorization: Bearer <supabase access token>  → { orders: n, reviews: n }
 */
import { getEnv, callerInfo } from './_lib/mail.js'

type Req = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const env = getEnv(req.headers)
  if (!env.admin) return res.status(500).json({ error: 'Server nicht konfiguriert' })
  const caller = await callerInfo(env.admin, req.headers.authorization as string | undefined)
  if (!caller?.email) return res.status(401).json({ error: 'Anmeldung erforderlich' })
  const email = caller.email.toLowerCase()
  try {
    const o = await env.admin.from('orders').update({ customer_id: caller.id }).is('customer_id', null).ilike('customer_email', email).select('id')
    const r = await env.admin.from('reviews').update({ customer_id: caller.id }).is('customer_id', null).ilike('email', email).select('id')
    // keep the profile in sync with the auth metadata (name / phone entered at signup)
    const { data: u } = await env.admin.auth.getUser(String(req.headers.authorization).slice(7))
    const meta = u.user?.user_metadata ?? {}
    if (meta.full_name || meta.phone) {
      const { data: p } = await env.admin.from('profiles').select('full_name, phone').eq('id', caller.id).maybeSingle()
      const patch: Record<string, string> = {}
      if (!p?.full_name && meta.full_name) patch.full_name = String(meta.full_name)
      if (!p?.phone && meta.phone) patch.phone = String(meta.phone)
      if (Object.keys(patch).length) await env.admin.from('profiles').update(patch).eq('id', caller.id)
    }
    return res.status(200).json({ orders: o.data?.length ?? 0, reviews: r.data?.length ?? 0 })
  } catch (e) {
    return res.status(200).json({ error: String((e as Error)?.message ?? e) })
  }
}
