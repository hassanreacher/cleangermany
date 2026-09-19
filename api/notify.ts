/**
 * Vercel Serverless Function – transactional e-mails via your own SMTP (nodemailer).
 * Auth e-mails (signup confirmation, password reset) are sent by Supabase with the SMTP configured in the Supabase dashboard.
 *
 * Env (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  – read orders/profiles server-side
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM ("Glanzgeschwister <Glanzgeschwister@gmx.de>")
 *   ADMIN_EMAIL – where new requests / reviews are announced (default SMTP_FROM address)
 *   SITE_URL   – e.g. https://cleangermany.vercel.app (links in e-mails)
 */
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

type Req = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

const COMPANY = 'Glanzgeschwister'
const OWNER = 'Julia Bethke'
const PHONE = '+49 176 20465997'
const WHATSAPP = 'https://wa.me/4917620465997'

const statusText: Record<string, string> = {
  neu: 'eingegangen', besichtigung: 'Besichtigung wird vereinbart', angebot: 'Ihr Angebot ist unterwegs', bestaetigt: 'bestätigt', zugewiesen: 'unser Team ist eingeplant', in_arbeit: 'in Arbeit', erledigt: 'erledigt – vielen Dank!', storniert: 'storniert',
}
const propertyLabels: Record<string, string> = { buero: 'Büro', praxis: 'Praxis', kita: 'Kita', schule: 'Schule', treppenhaus: 'Treppenhaus', gewerbe: 'Gewerbe / Laden', halle: 'Halle / Lager', wohnung: 'Wohnung', haus: 'Haus' }
const cleaningLabels: Record<string, string> = { unterhalt: 'Unterhaltsreinigung', grund: 'Grundreinigung', intensiv: 'Intensivreinigung', bauend: 'Bauendreinigung', baugrob: 'Baugrobreinigung', glas: 'Glasreinigung', garten: 'Gartenarbeit', aussen: 'Außenreinigung (Hochdruck)' }
const frequencyLabels: Record<string, string> = { taeglich: 'täglich (Mo–Fr)', woechentlich: 'wöchentlich', zweiwoechentlich: 'alle 2 Wochen', monatlich: 'monatlich', einmalig: 'einmalig' }

function esc(s: unknown) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)) }
function fmtDate(iso?: string | null) { if (!iso) return 'nach Absprache'; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}` }
function rhythm(o: any) {
  if (!o.frequency) return 'einmalig'
  if (o.frequency === 'woechentlich' && o.times_per_period) return `${o.times_per_period}× pro Woche`
  if (o.frequency === 'monatlich' && o.times_per_period) return `${o.times_per_period}× pro Monat`
  return frequencyLabels[o.frequency] ?? o.frequency
}

function layout(title: string, body: string, site: string) {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f6fcfe;font-family:Inter,Arial,sans-serif;color:#0b2b33">
  <div style="max-width:600px;margin:0 auto;padding:28px 16px">
    <div style="font-weight:800;font-size:22px;letter-spacing:-.5px"><span style="color:#35a9cc;font-weight:300">GLANZ</span><span style="color:#1d4fb3">GESCHWISTER</span></div>
    <div style="height:3px;background:#35a9cc;margin:6px 0 22px;width:180px"></div>
    <div style="background:#fff;border:1px solid #e3eef2;border-radius:18px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${body}
    </div>
    <p style="font-size:12px;color:#5b7078;margin-top:18px">${COMPANY} · Inh. ${OWNER} · Nuthestr. 49 c · 12307 Berlin · ${PHONE} · <a href="${site}" style="color:#1d4fb3">${site.replace(/^https?:\/\//, '')}</a></p>
  </div></body></html>`
}
function orderTable(o: any) {
  const d = o.details ?? {}
  const rows: [string, string][] = [
    ['Anfragenummer', o.code], ['Objekt', `${propertyLabels[o.property_type] ?? o.property_type} · ${o.size_sqm ?? '–'} m²`], ['Leistung', `${cleaningLabels[o.cleaning_type] ?? o.cleaning_type} · ${rhythm(o)}`],
    ['Adresse', `${o.street ?? ''}, ${o.zip ?? ''} ${o.city ?? ''}`], ['Wunschtermin', `${fmtDate(o.preferred_date)}${o.preferred_time ? ' · ' + o.preferred_time + ' Uhr' : ''}`],
    ['Kontakt', `${o.customer_name} · ${o.customer_phone} · ${o.customer_email}`],
  ]
  if (Array.isArray(d.floorTypes) && d.floorTypes.length) rows.push(['Böden', d.floorTypes.join(', ')])
  if (d.dirt || d.access) rows.push(['Zustand · Zugang', `${d.dirt ?? '–'} · ${d.access ?? '–'}`])
  if (o.notes) rows.push(['Hinweise', o.notes])
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:7px 0;color:#5b7078;width:38%;vertical-align:top;border-bottom:1px solid #eef3f5">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #eef3f5">${esc(v)}</td></tr>`).join('')}</table>`
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ADMIN_EMAIL, SITE_URL } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(200).json({ skipped: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen' })
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return res.status(200).json({ skipped: 'SMTP_* fehlt – keine E-Mail versendet' })

  const site = (SITE_URL || `https://${(req.headers['x-forwarded-host'] as string) || (req.headers.host as string) || 'cleangermany.vercel.app'}`).replace(/\/$/, '')
  const from = SMTP_FROM || SMTP_USER
  const adminTo = ADMIN_EMAIL || from.replace(/.*<([^>]+)>.*/, '$1')
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  const send = (to: string, subject: string, html: string) => transport.sendMail({ from, to, subject, html, replyTo: adminTo })

  const { type, orderId, reviewId } = req.body ?? {}
  try {
    // who is calling? (needed for status / assignment mails)
    let callerRole: string | null = null
    const auth = (req.headers.authorization as string) || ''
    if (auth.startsWith('Bearer ')) {
      const { data } = await admin.auth.getUser(auth.slice(7))
      if (data.user) { const { data: p } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle(); callerRole = p?.role ?? null }
    }

    if (type === 'order_created') {
      const { data: o } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
      if (!o) return res.status(404).json({ error: 'order not found' })
      if (o.notified_at || Date.now() - new Date(o.created_at).getTime() > 30 * 60 * 1000) return res.status(200).json({ skipped: 'already notified' })
      await admin.from('orders').update({ notified_at: new Date().toISOString() }).eq('id', o.id)
      await Promise.all([
        send(adminTo, `Neue Anfrage ${o.code}: ${cleaningLabels[o.cleaning_type] ?? o.cleaning_type} · ${o.customer_name}`, layout('Neue Anfrage eingegangen', `${orderTable(o)}<p style="margin-top:18px"><a href="${site}/dashboard/anfragen" style="background:#1d4fb3;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Im Dashboard öffnen</a></p>`, site)),
        send(o.customer_email, `Ihre Anfrage ${o.code} bei ${COMPANY}`, layout(`Vielen Dank, ${esc(o.customer_name.split(' ')[0])}!`, `<p>Ihre Anfrage ist bei uns eingegangen. ${esc(OWNER)} prüft Ihre Angaben und meldet sich in Kürze – gern auch für eine kostenlose Besichtigung.</p>${orderTable(o)}<p style="margin-top:18px;padding:14px;border-radius:12px;background:#fff7e0;border:1px solid #f5d98a"><b>25 % Rabatt sichern:</b> Melden Sie sich jetzt direkt per <a href="${WHATSAPP}?text=${encodeURIComponent(`Hallo ${COMPANY}, ich habe die Anfrage ${o.code} gesendet.`)}" style="color:#1d4fb3">WhatsApp</a> oder telefonisch unter ${PHONE} mit Ihrer Anfragenummer <b>${esc(o.code)}</b>.</p><p style="font-size:12px;color:#5b7078">Den Status Ihrer Anfrage sehen Sie jederzeit unter <a href="${site}/konto" style="color:#1d4fb3">${site.replace(/^https?:\/\//, '')}/konto</a> (kostenloses Konto mit dieser E-Mail-Adresse).</p>`, site)),
      ])
      return res.status(200).json({ ok: true })
    }

    if (type === 'order_status' || type === 'order_assigned') {
      if (!callerRole && type === 'order_assigned') return res.status(403).json({ error: 'forbidden' })
      const { data: o } = await admin.from('orders').select('*, assignee:profiles!orders_assigned_to_fkey (full_name, email, phone)').eq('id', orderId).maybeSingle()
      if (!o) return res.status(404).json({ error: 'order not found' })
      const st = statusText[o.status] ?? o.status
      const mails: Promise<unknown>[] = []
      if (type === 'order_assigned' && o.assignee?.email) {
        mails.push(send(o.assignee.email, `Neuer Einsatz ${o.code}: ${o.customer_name}, ${o.zip} ${o.city}`, layout('Neuer Einsatz für Sie', `<p>${esc(OWNER)} hat Ihnen einen Auftrag zugewiesen.</p>${orderTable(o)}${o.admin_notes ? `<p style="padding:12px;border-radius:12px;background:#e8f7fb"><b>Hinweis:</b> ${esc(o.admin_notes)}</p>` : ''}<p style="margin-top:18px"><a href="${site}/team" style="background:#1d4fb3;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Meine Einsätze öffnen</a></p>`, site)))
        mails.push(send(o.customer_email, `Ihr Reinigungsteam steht fest – ${o.code}`, layout('Ihr Team ist eingeplant', `<p>Gute Nachrichten, ${esc(o.customer_name.split(' ')[0])}: ${esc(o.assignee.full_name ?? 'unser Team')} übernimmt Ihren Auftrag${o.preferred_date ? ` am ${fmtDate(o.preferred_date)}${o.preferred_time ? ' um ' + o.preferred_time + ' Uhr' : ''}` : ''}.</p>${orderTable(o)}<p style="font-size:12px;color:#5b7078">Fragen? ${PHONE} oder <a href="${WHATSAPP}" style="color:#1d4fb3">WhatsApp</a>.</p>`, site)))
      } else if (o.status === 'storniert' && !callerRole) {
        // customer cancelled → inform the owner
        mails.push(send(adminTo, `Anfrage ${o.code} vom Kunden storniert`, layout('Kunde hat storniert', orderTable(o), site)))
      } else {
        mails.push(send(o.customer_email, `Ihre Anfrage ${o.code}: ${st}`, layout(`Status: ${esc(st)}`, `<p>Hallo ${esc(o.customer_name.split(' ')[0])}, der Status Ihrer Anfrage hat sich geändert: <b>${esc(st)}</b>.</p>${o.status === 'angebot' ? `<p>${esc(OWNER)} hat Ihr Angebot vorbereitet und meldet sich mit den Details – für Rückfragen einfach antworten oder ${PHONE} anrufen.</p>` : ''}${o.status === 'erledigt' ? `<p>Wir hoffen, alles glänzt! Wir freuen uns über Ihre Bewertung unter <a href="${site}/konto" style="color:#1d4fb3">${site.replace(/^https?:\/\//, '')}/konto</a>.</p>` : ''}${orderTable(o)}`, site)))
      }
      await Promise.all(mails)
      return res.status(200).json({ ok: true })
    }

    if (type === 'review_created') {
      const { data: r } = await admin.from('reviews').select('*').eq('id', reviewId).maybeSingle()
      if (!r) return res.status(404).json({ error: 'review not found' })
      if (r.notified_at) return res.status(200).json({ skipped: 'already notified' })
      await admin.from('reviews').update({ notified_at: new Date().toISOString() }).eq('id', r.id)
      await send(adminTo, `Neue Bewertung (${r.rating}/5) von ${r.author_name}`, layout('Neue Bewertung wartet auf Freigabe', `<p>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} · ${esc(r.author_name)}${r.city ? ' · ' + esc(r.city) : ''}</p><p style="padding:12px;border-radius:12px;background:#f6fcfe">${esc(r.text)}</p><p><a href="${site}/dashboard/bewertungen" style="background:#1d4fb3;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Freigeben</a></p>`, site))
      return res.status(200).json({ ok: true })
    }
    return res.status(400).json({ error: 'unknown type' })
  } catch (e) {
    return res.status(200).json({ error: String((e as Error)?.message ?? e) })
  }
}
