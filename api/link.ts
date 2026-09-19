/**
 * Vercel Serverless Function – runs right after login / signup:
 *  • attaches guest requests and reviews with the same e-mail to the account
 *  • copies name / phone from the signup into the profile
 *  • sends the admin a "new registration" notification (once per user)
 * Idempotent. POST with Authorization: Bearer <supabase access token> → { orders: n, reviews: n }
 */
import { getEnv, callerInfo, mailActivity } from './_lib/mail.js'

type Req = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

const roleLabel: Record<string, string> = { client: 'Kunde', team: 'Teammitglied', admin: 'Administrator' }

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

    const { data: u } = await env.admin.auth.getUser(String(req.headers.authorization).slice(7))
    const meta = (u.user?.user_metadata ?? {}) as Record<string, unknown>
    const name = String(meta.full_name ?? '').trim(), phone = String(meta.phone ?? '').trim()

    // keep the profile in sync with the data entered at signup
    const { data: p } = await env.admin.from('profiles').select('full_name, phone, created_at').eq('id', caller.id).maybeSingle()
    const patch: Record<string, string> = {}
    if (!p?.full_name && name) patch.full_name = name
    if (!p?.phone && phone) patch.phone = phone
    if (Object.keys(patch).length) await env.admin.from('profiles').update(patch).eq('id', caller.id)

    // one registration notice per user – the flag lives in the auth metadata, so no extra table is needed
    if (!meta.registered_notified) {
      const sent = await mailActivity(env, {
        who: name || p?.full_name || email,
        email, phone: phone || p?.phone,
        action: 'hat sich registriert',
        extra: [['Rolle', roleLabel[caller.role ?? 'client'] ?? String(caller.role)], ['Zugeordnete Anfragen', String(o.data?.length ?? 0)]],
        link: `${env.site}/dashboard/team`, linkLabel: 'Nutzer im Dashboard',
      })
      // retry on the next login if the mail could not be delivered yet
      if (sent) await env.admin.auth.admin.updateUserById(caller.id, { user_metadata: { ...meta, registered_notified: new Date().toISOString() } })
    }
    return res.status(200).json({ orders: o.data?.length ?? 0, reviews: r.data?.length ?? 0 })
  } catch (e) {
    return res.status(200).json({ error: String((e as Error)?.message ?? e) })
  }
}
