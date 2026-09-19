/**
 * Shared helpers for the serverless functions: Supabase admin client, SMTP mailer, e-mail templates.
 * (Files under api/_lib are not exposed as routes.)
 */
import nodemailer from 'nodemailer'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const COMPANY = 'Glanzgeschwister'
export const OWNER = 'Julia Bethke'
export const PHONE = '+49 176 20465997'
export const WHATSAPP = 'https://wa.me/4917620465997'
export const DISCOUNT = 25

export const statusText: Record<string, string> = {
  neu: 'eingegangen', besichtigung: 'Besichtigung wird vereinbart', angebot: 'Ihr Angebot ist unterwegs', bestaetigt: 'bestätigt', zugewiesen: 'unser Team ist eingeplant', in_arbeit: 'in Arbeit', erledigt: 'erledigt – vielen Dank!', storniert: 'storniert',
}
const propertyLabels: Record<string, string> = { buero: 'Büro', praxis: 'Praxis', kita: 'Kita', schule: 'Schule', treppenhaus: 'Treppenhaus', gewerbe: 'Gewerbe / Laden', halle: 'Halle / Lager', wohnung: 'Wohnung', haus: 'Haus' }
const cleaningLabels: Record<string, string> = { unterhalt: 'Unterhaltsreinigung', grund: 'Grundreinigung', intensiv: 'Intensivreinigung', bauend: 'Bauendreinigung', baugrob: 'Baugrobreinigung', glas: 'Glasreinigung', garten: 'Gartenarbeit', aussen: 'Außenreinigung (Hochdruck)' }
const frequencyLabels: Record<string, string> = { taeglich: 'täglich (Mo–Fr)', woechentlich: 'wöchentlich', zweiwoechentlich: 'alle 2 Wochen', monatlich: 'monatlich', einmalig: 'einmalig' }
export const cleaningLabel = (k: string) => cleaningLabels[k] ?? k

export function esc(s: unknown) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)) }
export function fmtDate(iso?: string | null) { if (!iso) return 'nach Absprache'; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}` }
export function rhythm(o: any) {
  if (!o.frequency) return 'einmalig'
  if (o.frequency === 'woechentlich' && o.times_per_period) return `${o.times_per_period}× pro Woche`
  if (o.frequency === 'monatlich' && o.times_per_period) return `${o.times_per_period}× pro Monat`
  return frequencyLabels[o.frequency] ?? o.frequency
}

export interface Env { admin: SupabaseClient | null; site: string; from: string; adminTo: string; send: ((to: string, subject: string, html: string) => Promise<unknown>) | null; smtpMissing: string | null }

/** Reads env, builds the admin client and (if configured) the mailer. */
export function getEnv(headers: Record<string, string | string[] | undefined>): Env {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ADMIN_EMAIL, SITE_URL } = process.env
  const site = (SITE_URL || `https://${(headers['x-forwarded-host'] as string) || (headers.host as string) || 'cleangermany.vercel.app'}`).replace(/\/$/, '')
  // GMX (and most providers) only accept a From address that equals the authenticated mailbox
  const senderName = (SMTP_FROM && SMTP_FROM.includes('<') ? SMTP_FROM.split('<')[0].trim().replace(/^"|"$/g, '') : SMTP_FROM && !SMTP_FROM.includes('@') ? SMTP_FROM : '') || `${COMPANY} Team`
  const from = SMTP_USER ? `"${senderName}" <${SMTP_USER}>` : SMTP_FROM || `${COMPANY} <noreply@localhost>`
  // ADMIN_EMAIL may hold several addresses, comma separated – all of them receive the activity notifications
  const adminTo = (ADMIN_EMAIL || SMTP_USER || '').split(',').map(a => a.trim()).filter(Boolean).join(', ') || from.replace(/.*<([^>]+)>.*/, '$1')
  const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null
  let send: Env['send'] = null, smtpMissing: string | null = null
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT || 465)
    const base = { host: SMTP_HOST, auth: { user: SMTP_USER, pass: SMTP_PASS }, connectionTimeout: 15000, greetingTimeout: 12000, socketTimeout: 20000 }
    // primary: the configured port (465 = SSL/TLS), fallback: the other common port (587 = STARTTLS)
    const primary = nodemailer.createTransport({ ...base, port, secure: port === 465 })
    const fallbackPort = port === 465 ? 587 : 465
    const fallback = nodemailer.createTransport({ ...base, port: fallbackPort, secure: fallbackPort === 465, requireTLS: fallbackPort === 587 })
    send = async (to, subject, html) => {
      const mail = { from, to, subject, html, replyTo: adminTo }
      try { return await primary.sendMail(mail) } catch (e) {
        const msg = String((e as Error)?.message ?? e)
        if (/Invalid login|535|authentication/i.test(msg)) throw e // wrong credentials – retrying is pointless
        console.error(`SMTP ${port} failed (${msg}) – retrying on ${fallbackPort}`)
        return await fallback.sendMail(mail)
      }
    }
  } else smtpMissing = 'SMTP_HOST / SMTP_USER / SMTP_PASS fehlen – keine E-Mail versendet'
  return { admin, site, from, adminTo, send, smtpMissing }
}

/** Role of the caller, resolved from a Supabase access token (Authorization: Bearer …). */
export async function callerInfo(admin: SupabaseClient, authHeader: string | undefined): Promise<{ id: string; email: string | null; role: string | null } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data } = await admin.auth.getUser(authHeader.slice(7))
  if (!data.user) return null
  const { data: p } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
  return { id: data.user.id, email: data.user.email ?? null, role: p?.role ?? null }
}

export function layout(title: string, body: string, site: string) {
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
export function orderTable(o: any) {
  const d = o.details ?? {}
  const rows: [string, string][] = [
    ['Anfragenummer', o.code], ['Objekt', `${propertyLabels[o.property_type] ?? o.property_type} · ${o.size_sqm ?? '–'} m²`], ['Leistung', `${cleaningLabel(o.cleaning_type)} · ${rhythm(o)}`],
    ['Adresse', `${o.street ?? ''}, ${o.zip ?? ''} ${o.city ?? ''}`], ['Wunschtermin', `${fmtDate(o.preferred_date)}${o.preferred_time ? ' · ' + o.preferred_time + ' Uhr' : ''}`],
    ['Kontakt', `${o.customer_name} · ${o.customer_phone} · ${o.customer_email}`],
  ]
  if (Array.isArray(d.floorTypes) && d.floorTypes.length) rows.push(['Böden', d.floorTypes.join(', ')])
  if (d.dirt || d.access) rows.push(['Zustand · Zugang', `${d.dirt ?? '–'} · ${d.access ?? '–'}`])
  if (d.desks || d.bathrooms) rows.push(['Ausstattung', `${d.rooms ? d.rooms + ' Räume · ' : ''}${d.bathrooms ?? '–'} WCs${d.desks ? ' · ' + d.desks + ' Arbeitsplätze' : ''}${d.kitchenSize && d.kitchenSize !== 'keine' ? ' · Küche ' + d.kitchenSize : ''}`])
  if (Array.isArray(d.extras) && d.extras.length) rows.push(['Zusatzleistungen', d.extras.join(', ')])
  if (o.notes) rows.push(['Hinweise', o.notes])
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:7px 0;color:#5b7078;width:38%;vertical-align:top;border-bottom:1px solid #eef3f5">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #eef3f5">${esc(v)}</td></tr>`).join('')}</table>`
}
export const button = (href: string, label: string) => `<p style="margin-top:18px"><a href="${href}" style="background:#1d4fb3;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">${esc(label)}</a></p>`

/** Mails for a freshly created order (owner + customer). */
export async function mailOrderCreated(env: Env, o: any) {
  if (!env.send) return
  const wa = `${WHATSAPP}?text=${encodeURIComponent(`Hallo ${COMPANY}, ich habe die Anfrage ${o.code} gesendet.`)}`
  await Promise.all([
    env.send(env.adminTo, `Neue Anfrage ${o.code}: ${cleaningLabel(o.cleaning_type)} · ${o.customer_name}`, layout('Neue Anfrage eingegangen', `${orderTable(o)}${button(`${env.site}/dashboard/anfragen`, 'Im Dashboard öffnen')}`, env.site)),
    mailActivity(env, { who: o.customer_name, email: o.customer_email, phone: o.customer_phone, action: `hat eine Anfrage gesendet (${o.code})`, extra: [['Leistung', `${cleaningLabel(o.cleaning_type)} · ${rhythm(o)}`], ['Objekt', `${o.property_type} · ${o.size_sqm ?? '–'} m²`], ['Adresse', `${o.street ?? ''}, ${o.zip ?? ''} ${o.city ?? ''}`], ['Wunschtermin', `${fmtDate(o.preferred_date)}${o.preferred_time ? ' · ' + o.preferred_time + ' Uhr' : ''}`], ['Quelle', o.source === 'ki' ? 'Chat mit Clea' : 'Website-Formular']], link: `${env.site}/dashboard/anfragen`, linkLabel: 'Anfrage öffnen' }),
    env.send(o.customer_email, `Ihre Anfrage ${o.code} bei ${COMPANY}`, layout(`Vielen Dank, ${esc(String(o.customer_name).split(' ')[0])}!`, `<p>Ihre Anfrage ist bei uns eingegangen. ${esc(OWNER)} prüft Ihre Angaben und meldet sich innerhalb von 24 Stunden – gern auch für eine kostenlose Besichtigung. Danach erhalten Sie Ihr schriftliches Angebot.</p>${orderTable(o)}<p style="margin-top:18px;padding:14px;border-radius:12px;background:#fff7e0;border:1px solid #f5d98a"><b>${DISCOUNT} % Rabatt sichern:</b> Melden Sie sich jetzt direkt per <a href="${wa}" style="color:#1d4fb3">WhatsApp</a> oder telefonisch unter ${PHONE} mit Ihrer Anfragenummer <b>${esc(o.code)}</b>.</p><p style="font-size:12px;color:#5b7078">Den Status Ihrer Anfrage sehen Sie jederzeit unter <a href="${env.site}/konto" style="color:#1d4fb3">${env.site.replace(/^https?:\/\//, '')}/konto</a> (kostenloses Konto mit dieser E-Mail-Adresse).</p>`, env.site)),
  ])
}
export async function mailReviewCreated(env: Env, r: any) {
  if (!env.send) return
  await Promise.all([
    env.send(env.adminTo, `Neue Bewertung (${r.rating}/5) von ${r.author_name}`, layout('Neue Bewertung wartet auf Freigabe', `<p>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} · ${esc(r.author_name)}${r.city ? ' · ' + esc(r.city) : ''}</p><p style="padding:12px;border-radius:12px;background:#f6fcfe">${esc(r.text)}</p>${button(`${env.site}/dashboard/bewertungen`, 'Freigeben')}`, env.site)),
    mailActivity(env, { who: r.author_name, email: r.email, action: `hat eine Bewertung abgegeben (${r.rating}/5)`, extra: [['Text', r.text]], link: `${env.site}/dashboard/bewertungen`, linkLabel: 'Bewertung freigeben' }),
  ])
}

/* ---------------- activity notifications for the admin ---------------- */
export interface Activity {
  /** name of the person who acted */
  who: string
  email?: string | null
  phone?: string | null
  /** what they did, in German, e.g. "hat eine Anfrage gesendet" */
  action: string
  extra?: [string, string | null | undefined][]
  link?: string
  linkLabel?: string
}

/**
 * One short e-mail per user action to every ADMIN_EMAIL address:
 * "Anna Schneider hat eine Anfrage gesendet". Never throws – notifications must not break the action itself.
 */
export async function mailActivity(env: Env, a: Activity): Promise<boolean> {
  if (!env.send) return false
  const when = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const rows: [string, string][] = [['Wer', a.who || 'Unbekannt'], ['Aktion', a.action], ['Zeitpunkt', `${when} Uhr`]]
  if (a.email) rows.splice(1, 0, ['E-Mail', a.email])
  if (a.phone) rows.splice(2, 0, ['Telefon', a.phone])
  for (const [k, v] of a.extra ?? []) if (v) rows.push([k, String(v)])
  const table = `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:7px 0;color:#5b7078;width:34%;vertical-align:top;border-bottom:1px solid #eef3f5">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #eef3f5">${esc(v)}</td></tr>`).join('')}</table>`
  try {
    await env.send(env.adminTo, `${a.who || 'Ein Nutzer'} ${a.action}`, layout('Neue Aktivität auf der Website', `<p style="font-size:15px"><b>${esc(a.who || 'Ein Nutzer')}</b> ${esc(a.action)}.</p>${table}${a.link ? button(a.link, a.linkLabel ?? 'Im Dashboard öffnen') : ''}`, env.site))
    return true
  } catch (e) {
    console.error('activity mail failed', (e as Error)?.message ?? e)
    return false
  }
}
