import { store, missingFields } from './store'
import { estimatePrice, estimateDuration } from './pricing'
import { nextAvailable, freeSlots, todayISO } from './slots'
import { cityFromZip } from './data'
import { cleaningLabels, extraLabel, formatDateDE, frequencyLabels, propertyLabels, weekdaysLong } from './labels'
import type { Profile } from './types'

export interface ChatUI {
  type: 'slots' | 'booking' | 'estimate'
  slots?: { date: string; times: string[] }[]
  booking?: { code: string; date: string; time: string }
  estimate?: [number, number]
}
export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  ui?: ChatUI
}
/** OpenAI-style transcript kept separately (includes tool calls/results) */
type ApiMsg = { role: 'user' | 'assistant' | 'tool'; content: string | null; tool_calls?: any[]; tool_call_id?: string; name?: string }

const fieldNames: Record<keyof Profile, string> = {
  name: 'Name', email: 'E-Mail', phone: 'Telefon', street: 'Straße & Hausnummer', zip: 'PLZ', city: 'Ort', propertyType: 'Objektart',
  sizeSqm: 'Fläche in m²', rooms: 'Zimmer', bathrooms: 'Bäder', floor: 'Etage', elevator: 'Aufzug', pets: 'Haustiere',
  cleaningType: 'Reinigungsart', frequency: 'Häufigkeit', extras: 'Extras', notes: 'Hinweise',
}

function profileSummary(p: Profile) {
  const rows: string[] = []
  ;(Object.keys(fieldNames) as (keyof Profile)[]).forEach(k => {
    const v = p[k]
    if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) return
    let s: string = Array.isArray(v) ? v.map(extraLabel).join(', ') : String(v)
    if (k === 'propertyType') s = propertyLabels[v as keyof typeof propertyLabels] ?? s
    if (k === 'cleaningType') s = cleaningLabels[v as keyof typeof cleaningLabels] ?? s
    if (k === 'frequency') s = frequencyLabels[v as keyof typeof frequencyLabels] ?? s
    if (typeof v === 'boolean') s = v ? 'ja' : 'nein'
    rows.push(`- ${fieldNames[k]}: ${s}`)
  })
  return rows.length ? rows.join('\n') : '(noch nichts bekannt)'
}

function context() {
  const s = store.get()
  const today = todayISO()
  const missing = missingFields(s.profile).map(f => fieldNames[f])
  const own = s.appointments.filter(a => a.customer.email && a.customer.email === s.profile.email).slice(0, 3)
  return {
    today: formatDateDE(today), weekday: weekdaysLong[new Date().getDay()], profile: profileSummary(s.profile), missing,
    loggedIn: !!s.user, appointments: own.map(a => `${a.code} am ${formatDateDE(a.date)} ${a.time} (${a.status})`).join('; '),
  }
}

/* ---------- tool execution (browser side, no database) ---------- */
function slotsPayload(from?: string) {
  const s = store.get()
  const list = nextAvailable(s.appointments, s.blockedSlots, 5, from && from >= todayISO() ? from : todayISO())
  return list.map(d => ({ date: d.date, weekday: weekdaysLong[new Date(d.date + 'T00:00').getDay()], times: d.times }))
}

function execTool(name: string, args: any): { result: unknown; ui?: ChatUI } {
  const s = store.get()
  switch (name) {
    case 'save_profile_field': {
      const patch: Partial<Profile> = {}
      for (const [k, v] of Object.entries(args ?? {})) {
        if (v === undefined || v === null || v === '') continue
        if (k === 'sizeSqm' || k === 'rooms' || k === 'bathrooms') (patch as any)[k] = Number(v)
        else if (k === 'extras') patch.extras = Array.isArray(v) ? v : String(v).split(/,\s*/)
        else (patch as any)[k] = v
      }
      if (patch.zip && !patch.city) { const c = cityFromZip(patch.zip); if (c) patch.city = c }
      store.updateProfile(patch)
      const missing = missingFields(store.get().profile).map(f => fieldNames[f])
      return { result: { saved: Object.keys(patch), missing, complete: !missing.length } }
    }
    case 'get_available_slots': {
      const slots = slotsPayload(args?.from)
      return { result: { slots }, ui: { type: 'slots', slots } }
    }
    case 'estimate_price': {
      const est = estimatePrice(s.profile)
      return { result: { min: est[0], max: est[1], durationHours: estimateDuration(s.profile), currency: 'EUR', note: 'unverbindlich, Endpreis legt der Inhaber fest' }, ui: { type: 'estimate', estimate: est } }
    }
    case 'book_appointment': {
      const { date, time } = args ?? {}
      if (!date || !time) return { result: { error: 'Datum und Uhrzeit fehlen' } }
      if (!freeSlots(date, s.appointments, s.blockedSlots).includes(time)) return { result: { error: 'Dieser Termin ist nicht (mehr) verfügbar. Bitte anderen Termin wählen.', slots: slotsPayload() } }
      const missing = missingFields(s.profile)
      if (missing.length) return { result: { error: 'Es fehlen noch Angaben: ' + missing.map(f => fieldNames[f]).join(', ') } }
      const a = store.book(date, time, 'ki')
      return { result: { ok: true, code: a.code, date: a.date, time: a.time, estimate: a.estimate }, ui: { type: 'booking', booking: { code: a.code, date: a.date, time: a.time } } }
    }
    default:
      return { result: { error: 'unknown tool' } }
  }
}

/* ---------- engine ---------- */
export class ChatEngine {
  private transcript: ApiMsg[] = []
  offline = false
  offlineReason = ''
  private offlinePending: { kind: 'confirm'; date: string; time: string } | null = null

  async send(userText: string): Promise<ChatMsg[]> {
    this.transcript.push({ role: 'user', content: userText })
    if (this.offline) return this.offlineTurn(userText)

    const out: ChatMsg[] = []
    for (let i = 0; i < 6; i++) {
      const r = await fetch('/api/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: this.transcript, context: context() }),
      }).then(r => r.json()).catch(e => ({ offline: true, reason: String(e) }))

      if (r.offline) {
        this.offline = true; this.offlineReason = r.reason || ''
        return this.offlineTurn(userText)
      }
      const m = r.message as ApiMsg
      this.transcript.push(m)
      if (m.tool_calls?.length) {
        let ui: ChatUI | undefined
        for (const tc of m.tool_calls) {
          let args = {}
          try { args = JSON.parse(tc.function.arguments || '{}') } catch { /* ignore */ }
          const { result, ui: u } = execTool(tc.function.name, args)
          if (u) ui = u
          this.transcript.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify(result) })
        }
        if (m.content) out.push({ id: uid(), role: 'assistant', content: m.content })
        if (ui) out.push({ id: uid(), role: 'assistant', content: '', ui })
        continue
      }
      out.push({ id: uid(), role: 'assistant', content: m.content || '…' })
      return out
    }
    return out
  }

  /* ---------- offline demo brain (no API key) ---------- */
  private offlineTurn(text: string): ChatMsg[] {
    const t = text.trim()
    const low = t.toLowerCase()
    const s = store.get()
    const p = s.profile
    const say = (content: string, ui?: ChatUI): ChatMsg => ({ id: uid(), role: 'assistant', content, ui })
    const greet = p.name ? `${p.name.split(' ')[0]}` : ''

    // pending confirmation of a chosen slot
    if (this.offlinePending) {
      if (/^(ja|jа|yes|ok|okay|passt|gerne|bestätigen|bitte|jep|jа)/i.test(low) || /best[aä]tig/.test(low)) {
        const { date, time } = this.offlinePending; this.offlinePending = null
        const { result, ui } = execTool('book_appointment', { date, time })
        const r = result as any
        if (r.ok) return [say(`Wunderbar${greet ? ', ' + greet : ''}! Ihr Termin ist angefragt. Ihre Buchungsnummer lautet ${r.code}. Unser Inhaber prüft Ihre Angaben und bestätigt den endgültigen Preis in Kürze per E-Mail. Sie finden den Termin auch unter „Mein Konto“.`, ui)]
        return [say(`Hm, ${r.error} Hier sind aktuelle Alternativen:`, { type: 'slots', slots: slotsPayload() })]
      }
      if (/^(nein|nö|anderer|andere|lieber)/i.test(low)) { this.offlinePending = null; return [say('Kein Problem – welcher dieser Termine passt Ihnen besser?', { type: 'slots', slots: slotsPayload() })] }
    }

    // slot selection like "2026-09-18 10:00" or "18.09. 10 Uhr"
    const iso = low.match(/(\d{4}-\d{2}-\d{2})/)
    const de = low.match(/(\d{1,2})\.(\d{1,2})\.?(\d{4})?/)
    const tm = low.match(/(\d{1,2})[:.](\d{2})|(\d{1,2})\s*uhr/)
    if ((iso || de) && tm) {
      let date = iso?.[1]
      if (!date && de) { const y = de[3] ?? String(new Date().getFullYear()); date = `${y}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}` }
      const hh = (tm[1] ?? tm[3]).padStart(2, '0'); const time = `${hh}:${tm[2] ?? '00'}`
      if (missingFields(p).length) return [say('Gerne! Bevor ich den Termin reserviere, brauche ich noch ein paar Angaben. ' + this.askNext(p, greet))]
      if (!freeSlots(date!, s.appointments, s.blockedSlots).includes(time)) return [say('Dieser Termin ist leider nicht verfügbar. Diese Termine sind frei:', { type: 'slots', slots: slotsPayload() })]
      this.offlinePending = { kind: 'confirm', date: date!, time }
      return [say(`Kurz zur Kontrolle: ${cleaningLabels[p.cleaningType as keyof typeof cleaningLabels] ?? 'Reinigung'} am ${formatDateDE(date!, { weekday: true })} um ${time} Uhr in ${p.street}, ${p.zip} ${p.city}. Unverbindliche Preisspanne: ${estimatePrice(p)[0]}–${estimatePrice(p)[1]} €. Soll ich den Termin verbindlich anfragen? (ja/nein)`)]
    }

    // FAQ shortcuts
    if (/preis|kosten|kostet|teuer/.test(low) && !missingFields(p).length) { const e = estimatePrice(p); return [say(`Auf Basis Ihrer Angaben liegt die unverbindliche Preisspanne bei ${e[0]}–${e[1]} €. Den endgültigen Festpreis legt unser Inhaber nach Prüfung fest.`, { type: 'estimate', estimate: e })] }
    if (/preis|kosten|kostet|teuer/.test(low)) return [say('Unsere Preise richten sich nach Fläche, Reinigungsart und Extras – eine 70 m² Wohnung liegt z. B. meist bei 75–110 € für eine Unterhaltsreinigung. Für einen konkreten Festpreis benötige ich ein paar Angaben. ' + this.askNext(p, greet))]
    if (/öffnungs|uhrzeit|wann.*erreich|erreichbar/.test(low)) return [say('Wir reinigen Montag bis Samstag zwischen 08:00 und 18:00 Uhr. Termine können Sie jederzeit hier im Chat oder über „Termin buchen“ reservieren.')]
    if (/storn|absag|verschieb/.test(low)) return [say('Sie können Termine bis 24 Stunden vorher kostenlos stornieren oder verschieben – einfach hier im Chat oder unter „Mein Konto“.')]
    if (/leistung|angebot|was.*(macht|bietet)|service/.test(low)) return [say('Wir bieten Unterhaltsreinigung, Grundreinigung, Umzugsreinigung, Fensterreinigung und Büro-/Praxisreinigung – bundesweit, versichert und mit umweltfreundlichen Mitteln. Möchten Sie direkt einen Termin anfragen?')]
    if (/termin|buch|frei|verfügbar|slot/.test(low) && !missingFields(p).length) return [say('Diese Termine sind aktuell frei – bitte wählen Sie einen:', { type: 'slots', slots: slotsPayload() })]
    if (/^(hallo|hi|hey|guten|moin|servus)/.test(low) && !this.expectingField) return [say(`Hallo${greet ? ' ' + greet : ''}! Ich bin Clea, Ihre Assistentin von CLEAN. Ich beantworte Fragen und buche Ihren Reinigungstermin direkt hier im Chat. ${missingFields(p).length ? this.askNext(p, greet) : 'Möchten Sie einen Termin anfragen?'}`)]

    // save answer for the field we are expecting
    if (this.expectingField) {
      const ok = this.parseAnswer(this.expectingField, t)
      if (!ok) return [say(this.hintFor(this.expectingField))]
    } else if (missingFields(p).length) {
      // first contact: start collecting
      return [say(`Gerne${greet ? ', ' + greet : ''}! Damit ich Ihren Termin anlegen kann, stelle ich Ihnen ein paar kurze Fragen. ` + this.askNext(store.get().profile, greet))]
    }

    const now = store.get().profile
    const missing = missingFields(now)
    if (missing.length) return [say(this.askNext(now, now.name ? now.name.split(' ')[0] : ''))]
    this.expectingField = null
    const e = estimatePrice(now)
    return [say(`Perfekt, ich habe alles${now.name ? ', ' + now.name.split(' ')[0] : ''}! Unverbindliche Preisspanne: ${e[0]}–${e[1]} €, Dauer ca. ${estimateDuration(now)} Std. Hier sind die nächsten freien Termine – bitte wählen Sie einen:`, { type: 'slots', slots: slotsPayload() })]
  }

  private expectingField: keyof Profile | null = null

  private askNext(p: Profile, greet: string): string {
    const missing = missingFields(p)
    const f = missing[0]
    this.expectingField = f
    const g = greet ? `${greet}, ` : ''
    const q: Record<string, string> = {
      name: 'Wie darf ich Sie ansprechen? Bitte nennen Sie mir Ihren vollständigen Namen.',
      street: `${g}können Sie mir bitte die Adresse des Objekts nennen (Straße und Hausnummer)?`,
      zip: 'Wie lautet die Postleitzahl?',
      city: 'Und in welchem Ort befindet sich das Objekt?',
      propertyType: 'Um welche Art von Objekt handelt es sich – Wohnung, Haus, Büro oder Praxis?',
      sizeSqm: 'Wie groß ist die Fläche ungefähr in Quadratmetern? (Das brauche ich für Zeitaufwand und Preis.)',
      rooms: 'Wie viele Zimmer hat das Objekt?',
      bathrooms: 'Wie viele Bäder sollen gereinigt werden?',
      floor: 'In welcher Etage liegt das Objekt (z. B. EG, 2, 4)?',
      elevator: 'Gibt es einen Aufzug? (ja/nein)',
      pets: 'Leben Haustiere im Objekt? (ja/nein)',
      cleaningType: 'Welche Reinigung wünschen Sie – Unterhaltsreinigung, Grundreinigung, Umzugsreinigung, Fensterreinigung oder Büroreinigung?',
      frequency: 'Wie oft sollen wir kommen – einmalig, wöchentlich, alle 2 Wochen oder monatlich?',
      phone: 'Unter welcher Telefonnummer erreichen wir Sie?',
      email: 'Und Ihre E-Mail-Adresse für die Bestätigung?',
    }
    return q[f] ?? 'Gibt es noch Hinweise für unser Team?'
  }

  private hintFor(f: keyof Profile) {
    const h: Record<string, string> = {
      zip: 'Die Postleitzahl besteht aus 5 Ziffern, z. B. 10435.', sizeSqm: 'Bitte eine Zahl in m², z. B. 75.', rooms: 'Bitte eine Zahl, z. B. 3.', bathrooms: 'Bitte eine Zahl, z. B. 1.',
      elevator: 'Bitte antworten Sie mit ja oder nein.', pets: 'Bitte antworten Sie mit ja oder nein.', email: 'Bitte eine gültige E-Mail-Adresse, z. B. name@beispiel.de.',
      propertyType: 'Bitte wählen Sie: Wohnung, Haus, Büro oder Praxis.', cleaningType: 'Bitte wählen Sie: Unterhalt, Grund, Umzug, Fenster oder Büro.', frequency: 'Bitte wählen Sie: einmalig, wöchentlich, alle 2 Wochen oder monatlich.',
      phone: 'Bitte eine Telefonnummer, z. B. +49 30 1234567.',
    }
    return h[f] ?? 'Das habe ich leider nicht verstanden – können Sie es noch einmal anders formulieren?'
  }

  private parseAnswer(f: keyof Profile, t: string): boolean {
    const low = t.toLowerCase()
    const yes = /\b(ja|jep|jа|yes|klar|gibt es|vorhanden)\b/.test(low), no = /\b(nein|nö|keine|kein|nicht)\b/.test(low)
    const num = t.match(/\d+([.,]\d+)?/)
    switch (f) {
      case 'name': if (t.length < 2) return false; store.updateProfile({ name: t.replace(/^(ich heiße|mein name ist|ich bin)\s*/i, '').trim() }); return true
      case 'street': {
        const zip = t.match(/\b(\d{5})\b/); const patch: Partial<Profile> = { street: t.replace(/,?\s*\b\d{5}\b.*$/, '').trim() || t }
        if (zip) { patch.zip = zip[1]; const c = cityFromZip(zip[1]); const after = t.split(zip[1])[1]?.replace(/[,\s]+/, '').trim(); patch.city = after || c || '' }
        store.updateProfile(patch); return true
      }
      case 'zip': { const z = t.match(/\b(\d{5})\b/); if (!z) return false; store.updateProfile({ zip: z[1], city: store.get().profile.city || cityFromZip(z[1]) || '' }); return true }
      case 'city': store.updateProfile({ city: t.trim() }); return true
      case 'propertyType': { const m = /wohnung|apartment/.test(low) ? 'wohnung' : /haus/.test(low) ? 'haus' : /büro|buero|office/.test(low) ? 'buero' : /praxis/.test(low) ? 'praxis' : null; if (!m) return false; store.updateProfile({ propertyType: m }); return true }
      case 'sizeSqm': if (!num) return false; store.updateProfile({ sizeSqm: Math.round(parseFloat(num[0].replace(',', '.'))) }); return true
      case 'rooms': if (!num) return false; store.updateProfile({ rooms: parseInt(num[0]) }); return true
      case 'bathrooms': if (!num) return false; store.updateProfile({ bathrooms: parseInt(num[0]) }); return true
      case 'floor': { const fl = /erdgeschoss|eg\b|parterre/.test(low) ? 'EG' : num ? num[0] : t.trim(); store.updateProfile({ floor: fl }); const el = yes ? true : no ? false : null; if (el !== null && /aufzug|lift|fahrstuhl/.test(low)) store.updateProfile({ elevator: el }); return true }
      case 'elevator': if (!yes && !no) return false; store.updateProfile({ elevator: yes && !no }); return true
      case 'pets': if (!yes && !no && !/hund|katze/.test(low)) return false; store.updateProfile({ pets: (yes || /hund|katze/.test(low)) && !no }); return true
      case 'cleaningType': { const m = /grund/.test(low) ? 'grund' : /umzug/.test(low) ? 'umzug' : /fenster/.test(low) ? 'fenster' : /büro|buero|praxis/.test(low) ? 'buero' : /unterhalt|normal|regelm|standard/.test(low) ? 'unterhalt' : null; if (!m) return false; store.updateProfile({ cleaningType: m }); return true }
      case 'frequency': { const m = /einmal|nur einmal|once/.test(low) ? 'einmalig' : /zwei|14|alle 2/.test(low) ? 'zweiwoechentlich' : /wöchent|woechent|jede woche|weekly/.test(low) ? 'woechentlich' : /monat/.test(low) ? 'monatlich' : null; if (!m) return false; store.updateProfile({ frequency: m }); return true }
      case 'phone': { const ph = t.match(/[+\d][\d\s/()-]{5,}/); if (!ph) return false; store.updateProfile({ phone: ph[0].trim() }); return true }
      case 'email': { const em = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/); if (!em) return false; store.updateProfile({ email: em[0] }); return true }
      default: return true
    }
  }
}

function uid() { return Math.random().toString(36).slice(2, 10) }
