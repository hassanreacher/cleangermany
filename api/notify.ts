/**
 * Vercel Serverless Function – status / assignment e-mails via your own SMTP.
 * (New orders and reviews are mailed directly by api/submit.ts.)
 *
 * POST { type: 'order_status' | 'order_assigned', orderId }  with Authorization: Bearer <access token>
 *   order_assigned → team member + customer (admin only)
 *   order_status   → customer; a customer's own cancellation notifies the owner instead
 */
import { getEnv, callerInfo, layout, orderTable, button, statusText, esc, fmtDate, OWNER, PHONE, WHATSAPP } from './_lib/mail'

type Req = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const env = getEnv(req.headers)
  if (!env.admin) return res.status(200).json({ skipped: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen' })
  if (!env.send) return res.status(200).json({ skipped: env.smtpMissing })
  const { type, orderId } = req.body ?? {}
  if (!/^[0-9a-f-]{36}$/.test(String(orderId ?? ''))) return res.status(400).json({ error: 'orderId fehlt' })

  try {
    const caller = await callerInfo(env.admin, req.headers.authorization as string | undefined)
    if (!caller) return res.status(403).json({ error: 'Anmeldung erforderlich' })
    const { data: o } = await env.admin.from('orders').select('*, assignee:profiles!orders_assigned_to_fkey (full_name, email, phone)').eq('id', orderId).maybeSingle()
    if (!o) return res.status(404).json({ error: 'order not found' })
    const isStaff = caller.role === 'admin' || caller.role === 'team'
    const isOwnerOfOrder = o.customer_id === caller.id || (caller.email && o.customer_email?.toLowerCase() === caller.email.toLowerCase())
    if (!isStaff && !isOwnerOfOrder) return res.status(403).json({ error: 'Keine Berechtigung' })

    const st = statusText[o.status] ?? o.status
    const first = esc(String(o.customer_name).split(' ')[0])
    const mails: Promise<unknown>[] = []
    if (type === 'order_assigned') {
      if (caller.role !== 'admin') return res.status(403).json({ error: 'Nur Admin' })
      if (o.assignee?.email) mails.push(env.send(o.assignee.email, `Neuer Einsatz ${o.code}: ${o.customer_name}, ${o.zip} ${o.city}`, layout('Neuer Einsatz für Sie', `<p>${esc(OWNER)} hat Ihnen einen Auftrag zugewiesen.</p>${orderTable(o)}${o.admin_notes ? `<p style="padding:12px;border-radius:12px;background:#e8f7fb"><b>Hinweis:</b> ${esc(o.admin_notes)}</p>` : ''}${button(`${env.site}/team`, 'Meine Einsätze öffnen')}`, env.site)))
      mails.push(env.send(o.customer_email, `Ihr Reinigungsteam steht fest – ${o.code}`, layout('Ihr Team ist eingeplant', `<p>Gute Nachrichten, ${first}: ${esc(o.assignee?.full_name ?? 'unser Team')} übernimmt Ihren Auftrag${o.preferred_date ? ` am ${fmtDate(o.preferred_date)}${o.preferred_time ? ' um ' + o.preferred_time + ' Uhr' : ''}` : ''}.</p>${orderTable(o)}<p style="font-size:12px;color:#5b7078">Fragen? ${PHONE} oder <a href="${WHATSAPP}" style="color:#1d4fb3">WhatsApp</a>.</p>`, env.site)))
    } else if (o.status === 'storniert' && !isStaff) {
      mails.push(env.send(env.adminTo, `Anfrage ${o.code} vom Kunden storniert`, layout('Kunde hat storniert', orderTable(o), env.site)))
    } else {
      mails.push(env.send(o.customer_email, `Ihre Anfrage ${o.code}: ${st}`, layout(`Status: ${esc(st)}`, `<p>Hallo ${first}, der Status Ihrer Anfrage hat sich geändert: <b>${esc(st)}</b>.</p>${o.status === 'angebot' ? `<p>${esc(OWNER)} hat Ihr Angebot vorbereitet und meldet sich mit den Details – für Rückfragen einfach antworten oder ${PHONE} anrufen.</p>` : ''}${o.status === 'erledigt' ? `<p>Wir hoffen, alles glänzt! Wir freuen uns über Ihre Bewertung unter <a href="${env.site}/konto" style="color:#1d4fb3">${env.site.replace(/^https?:\/\//, '')}/konto</a>.</p>` : ''}${orderTable(o)}`, env.site)))
    }
    await Promise.all(mails)
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(200).json({ error: String((e as Error)?.message ?? e) })
  }
}
