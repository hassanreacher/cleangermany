import { store, missingFields } from './store'
import { nextAvailable, freeSlots, todayISO, addDays } from './slots'
import { cityFromZip } from './data'
import { bookedSlots, createOrder } from './orders'
import { supabaseConfigured } from './supabase'
import { cleaningLabels, extraLabel, floorLabels, formatDateDE, frequencyLabels, frequencyText, propertyLabels, timeWindowLabels, weekdaysLong, commercialTypes, dirtLabels, accessLabels, kitchenLabels, oneOffTypes } from './labels'
import { business, fullAddress, whatsappUrl } from './config'
import { requestSummary } from './summary'
import type { FloorType, Profile, PropertyType, TimeWindow, CleaningType, DirtLevel, Access, KitchenSize } from './types'

export interface ChatOption { label: string; value: string }
export interface ChatUI {
  type: 'slots' | 'booking' | 'options' | 'contact'
  slots?: { date: string; times: string[] }[]
  booking?: { code: string; date: string; time: string; whatsapp: string }
  options?: ChatOption[]
  multi?: boolean
  contact?: { whatsapp: string }
}
export interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; ui?: ChatUI }
type ApiMsg = { role: 'user' | 'assistant' | 'tool'; content: string | null; tool_calls?: any[]; tool_call_id?: string; name?: string }

const fieldNames: Record<keyof Profile, string> = {
  name: 'Name / Firma', email: 'E-Mail', phone: 'Telefon', street: 'Straße & Hausnummer', zip: 'PLZ', city: 'Ort', propertyType: 'Objektart',
  sizeSqm: 'Fläche in m²', floorTypes: 'Bodenarten', rooms: 'Räume', bathrooms: 'WCs / Bäder', floor: 'Etage', elevator: 'Aufzug', pets: 'Haustiere',
  cleaningType: 'Leistung', frequency: 'Rhythmus', timesPerPeriod: 'Reinigungen pro Woche/Monat', timeWindow: 'Bevorzugte Uhrzeit', dirt: 'Verschmutzungsgrad', access: 'Zugang',
  desks: 'Arbeitsplätze', showers: 'Duschen', kitchenSize: 'Küche', wasteBins: 'Mülleimer', glassSqm: 'Glasfläche m²', glassBothSides: 'Glas beidseitig', entrances: 'Eingänge', floorsCount: 'Etagen je Aufgang', basement: 'Keller', windows: 'Fenster', hours: 'Arbeitsstunden',
  extras: 'Zusatzleistungen', notes: 'Hinweise',
}

/** Quick-reply options for select-type fields (shown as chips in the chat). */
export function optionsFor(f: keyof Profile, p: Profile): { options: ChatOption[]; multi?: boolean } | null {
  const opt = (labels: Record<string, string>, keys?: string[]) => ({ options: (keys ?? Object.keys(labels)).map(k => ({ label: labels[k], value: labels[k] })) })
  switch (f) {
    case 'propertyType': return opt(propertyLabels, [...commercialTypes, 'wohnung', 'haus'])
    case 'floorTypes': return { multi: true, ...opt(floorLabels) }
    case 'cleaningType': return opt(cleaningLabels)
    case 'frequency': return opt(frequencyLabels)
    case 'timesPerPeriod': { const n = p.frequency === 'monatlich' ? 3 : 6; const unit = p.frequency === 'monatlich' ? 'pro Monat' : 'pro Woche'; return { options: Array.from({ length: n }, (_, i) => ({ label: `${i + 1}× ${unit}`, value: `${i + 1}× ${unit}` })) } }
    case 'timeWindow': return opt(timeWindowLabels)
    case 'dirt': return opt(dirtLabels)
    case 'access': return opt(accessLabels)
    case 'kitchenSize': return opt(kitchenLabels)
    case 'elevator': case 'pets': case 'basement': case 'glassBothSides': return { options: [{ label: 'Ja', value: 'ja' }, { label: 'Nein', value: 'nein' }] }
    case 'sizeSqm': return { options: ['100 m²', '250 m²', '500 m²', '1.000 m²'].map(v => ({ label: v, value: v })) }
    default: return null
  }
}

function profileSummary(p: Profile) {
  const rows: string[] = []
  ;(Object.keys(fieldNames) as (keyof Profile)[]).forEach(k => {
    const v = p[k]
    if (v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) return
    let s: string = Array.isArray(v) ? v.join(', ') : String(v)
    if (k === 'extras') s = (v as string[]).map(extraLabel).join(', ')
    if (k === 'floorTypes') s = (v as FloorType[]).map(f => floorLabels[f]).join(', ')
    if (k === 'propertyType') s = propertyLabels[v as PropertyType] ?? s
    if (k === 'cleaningType') s = cleaningLabels[v as CleaningType] ?? s
    if (k === 'frequency') s = frequencyText(p)
    if (k === 'timeWindow') s = timeWindowLabels[v as TimeWindow] ?? s
    if (k === 'dirt') s = dirtLabels[v as DirtLevel] ?? s
    if (k === 'access') s = accessLabels[v as Access] ?? s
    if (k === 'kitchenSize') s = kitchenLabels[v as KitchenSize] ?? s
    if (typeof v === 'boolean') s = v ? 'ja' : 'nein'
    rows.push(`- ${fieldNames[k]}: ${s}`)
  })
  return rows.length ? rows.join('\n') : '(noch nichts bekannt)'
}

function context() {
  const p = store.get()
  const today = todayISO()
  return {
    today: formatDateDE(today), weekday: weekdaysLong[new Date().getDay()], profile: profileSummary(p), missing: missingFields(p).map(f => fieldNames[f]),
    business: `${business.company} (Inh. ${business.owner}), ${fullAddress}, Tel./WhatsApp ${business.phoneDisplay}. EINSATZGEBIET: ausschließlich Berlin (alle Bezirke, PLZ 10115–14199) – Anfragen außerhalb Berlins freundlich ablehnen.`,
    discount: `${business.directDiscount} % Direkt-Rabatt, wenn sich der Kunde nach dem Absenden der Anfrage direkt per WhatsApp oder Anruf meldet.`,
  }
}

/* ---------- tools (executed in the browser) ---------- */
let bookedCache: { at: number; set: Set<string> } | null = null
async function occupied(): Promise<Set<string>> {
  if (!supabaseConfigured) return new Set()
  if (bookedCache && Date.now() - bookedCache.at < 60_000) return bookedCache.set
  try { const s = await bookedSlots(todayISO(), addDays(todayISO(), 60)); bookedCache = { at: Date.now(), set: s }; return s } catch { return new Set() }
}
async function slotsPayload(from?: string) {
  const b = await occupied()
  return nextAvailable(b, 5, from && from >= todayISO() ? from : todayISO()).map(d => ({ date: d.date, weekday: weekdaysLong[new Date(d.date + 'T00:00').getDay()], times: d.times }))
}

async function execTool(name: string, args: any): Promise<{ result: unknown; ui?: ChatUI }> {
  switch (name) {
    case 'save_profile_field': {
      const patch: Partial<Profile> = {}
      for (const [k, v] of Object.entries(args ?? {})) {
        if (v === undefined || v === null || v === '') continue
        if (['sizeSqm', 'rooms', 'bathrooms', 'timesPerPeriod', 'desks', 'showers', 'wasteBins', 'glassSqm', 'entrances', 'floorsCount', 'windows', 'hours'].includes(k)) (patch as any)[k] = Number(v)
        else if (k === 'extras' || k === 'floorTypes') (patch as any)[k] = Array.isArray(v) ? v : String(v).split(/,\s*/)
        else (patch as any)[k] = v
      }
      if (patch.zip && !patch.city) { const c = cityFromZip(patch.zip); if (c) patch.city = c }
      if (patch.frequency === 'taeglich' || patch.frequency === 'einmalig' || patch.frequency === 'zweiwoechentlich') patch.timesPerPeriod = null
      if (patch.cleaningType && oneOffTypes.includes(patch.cleaningType)) { patch.frequency = 'einmalig'; patch.timesPerPeriod = null }
      store.updateProfile(patch)
      const missing = missingFields(store.get()).map(f => fieldNames[f])
      return { result: { saved: Object.keys(patch), missing, complete: !missing.length } }
    }
    case 'get_available_slots': { const slots = await slotsPayload(args?.from); return { result: { slots }, ui: { type: 'slots', slots } } }
    case 'submit_request': {
      const { date, time } = args ?? {}
      const p = store.get()
      const missing = missingFields(p)
      if (missing.length) return { result: { error: 'Es fehlen noch Angaben: ' + missing.map(f => fieldNames[f]).join(', ') } }
      if (date && time && !freeSlots(date, await occupied()).includes(time)) return { result: { error: 'Dieser Termin ist nicht (mehr) verfügbar. Bitte anderen Termin wählen.', slots: await slotsPayload() } }
      if (!supabaseConfigured) return { result: { error: 'Die Datenbank ist nicht verbunden – bitte den Kunden auf WhatsApp/Telefon verweisen.' } }
      try {
        const o = await createOrder(p, date && time ? { date, time } : null, 'ki')
        store.resetRequest(); bookedCache = null
        const wa = whatsappUrl(requestSummary(p, o.code))
        return { result: { ok: true, code: o.code, date: o.preferred_date, time: o.preferred_time, hint: `Kunde jetzt auf WhatsApp/Anruf für ${business.directDiscount} % Direkt-Rabatt hinweisen; Bestätigung kam per E-Mail.` }, ui: { type: 'booking', booking: { code: o.code, date: o.preferred_date ?? '', time: o.preferred_time ?? '', whatsapp: wa } } }
      } catch (e) { return { result: { error: 'Speichern fehlgeschlagen: ' + String((e as Error)?.message ?? e) } } }
    }
    default: return { result: { error: 'unknown tool' } }
  }
}

/* ---------- engine ---------- */
export class ChatEngine {
  private transcript: ApiMsg[] = []
  offline = false
  offlineReason = ''
  private offlinePending: { date: string; time: string } | null = null
  private expectingField: keyof Profile | null = null

  async send(userText: string): Promise<ChatMsg[]> {
    this.transcript.push({ role: 'user', content: userText })
    if (this.offline) return this.offlineTurn(userText)
    const out: ChatMsg[] = []
    for (let i = 0; i < 6; i++) {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: this.transcript, context: context() }) }).then(r => r.json()).catch(e => ({ offline: true, reason: String(e) }))
      if (r.offline) { this.offline = true; this.offlineReason = r.reason || ''; return this.offlineTurn(userText) }
      const m = r.message as ApiMsg
      this.transcript.push(m)
      if (m.tool_calls?.length) {
        let ui: ChatUI | undefined
        for (const tc of m.tool_calls) {
          let args = {}
          try { args = JSON.parse(tc.function.arguments || '{}') } catch { /* ignore */ }
          const { result, ui: u } = await execTool(tc.function.name, args)
          if (u) ui = u
          this.transcript.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify(result) })
        }
        if (m.content) out.push({ id: uid(), role: 'assistant', content: m.content })
        if (ui) out.push({ id: uid(), role: 'assistant', content: '', ui })
        continue
      }
      out.push({ id: uid(), role: 'assistant', content: m.content || '…' })
      const next = missingFields(store.get())[0]
      const opts = next ? optionsFor(next, store.get()) : null
      if (opts && m.content && new RegExp(fieldNames[next].split(' ')[0].slice(0, 5), 'i').test(m.content)) out.push({ id: uid(), role: 'assistant', content: '', ui: { type: 'options', options: opts.options, multi: opts.multi } })
      return out
    }
    return out
  }

  /* ---------- offline brain (no API key) ---------- */
  private async offlineTurn(text: string): Promise<ChatMsg[]> {
    const t = text.trim(), low = t.toLowerCase()
    const p = store.get()
    const say = (content: string, ui?: ChatUI): ChatMsg => ({ id: uid(), role: 'assistant', content, ui })
    const greet = p.name ? p.name.split(' ')[0] : ''
    const discountLine = `Tipp: Nach dem Absenden direkt per WhatsApp oder Anruf bei ${business.owner} melden – das bringt ${business.directDiscount} % Direkt-Rabatt.`

    if (this.offlinePending) {
      if (/^(ja|yes|ok|okay|passt|gerne|bestätigen|bitte|jep)/i.test(low) || /best[aä]tig/.test(low)) {
        const { date, time } = this.offlinePending; this.offlinePending = null
        const { result, ui } = await execTool('submit_request', { date, time })
        const r = result as any
        if (r.ok) return [say(`Wunderbar${greet ? ', ' + greet : ''}! Ihre Anfrage ist gespeichert – Nummer ${r.code}. Sie erhalten eine Bestätigung per E-Mail, ${business.owner} meldet sich innerhalb von 24 Stunden. ${discountLine}`, ui)]
        return [say(`Hm, ${r.error}`, r.slots ? { type: 'slots', slots: r.slots } : undefined)]
      }
      if (/^(nein|nö|anderer|andere|lieber)/i.test(low)) { this.offlinePending = null; return [say('Kein Problem – welcher dieser Termine passt Ihnen besser?', { type: 'slots', slots: await slotsPayload() })] }
    }

    const iso = low.match(/(\d{4}-\d{2}-\d{2})/), de = low.match(/(\d{1,2})\.(\d{1,2})\.?(\d{4})?/), tm = low.match(/(\d{1,2})[:.](\d{2})|(\d{1,2})\s*uhr/)
    if ((iso || de) && tm) {
      let date = iso?.[1]
      if (!date && de) { const y = de[3] ?? String(new Date().getFullYear()); date = `${y}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}` }
      const hh = (tm[1] ?? tm[3]).padStart(2, '0'); const time = `${hh}:${tm[2] ?? '00'}`
      if (missingFields(p).length) return [say('Gerne! Bevor ich den Termin reserviere, brauche ich noch ein paar Angaben. ' + this.askNext(p, greet), this.optionsUI())]
      if (!freeSlots(date!, await occupied()).includes(time)) return [say('Dieser Termin ist leider nicht verfügbar. Diese Termine sind frei:', { type: 'slots', slots: await slotsPayload() })]
      this.offlinePending = { date: date!, time }
      return [say(`Kurz zur Kontrolle: ${cleaningLabels[p.cleaningType as CleaningType] ?? 'Reinigung'} (${propertyLabels[p.propertyType as PropertyType] ?? 'Objekt'}, ${p.sizeSqm} m², ${frequencyText(p) || 'einmalig'}) – Wunschtermin ${formatDateDE(date!, { weekday: true })} um ${time} Uhr in ${p.street}, ${p.zip} ${p.city}. Soll ich die Anfrage jetzt senden? (ja/nein)`)]
    }

    const learned = this.expectingField ? 0 : this.absorb(t)
    if (learned) {
      const now = store.get(); const missing = missingFields(now)
      if (!missing.length) { this.expectingField = null; return [say('Danke, das habe ich notiert. Wählen Sie bitte einen Wunschtermin für Start bzw. Besichtigung:', { type: 'slots', slots: await slotsPayload() })] }
      return [say(`Danke${greet ? ', ' + greet : ''}, das habe ich notiert! ${this.askNext(now, greet)}`, this.optionsUI())]
    }

    if (/whatsapp|anruf|telefon|rabatt|direkt|sparen/.test(low)) return [say(`Sehr gern! ${discountLine} Hier geht es direkt weiter:`, { type: 'contact', contact: { whatsapp: whatsappUrl(requestSummary(p)) } })]
    if (/wo seid|standort|adresse|anfahrt|wo sitzt|wo befindet/.test(low)) return [say(`Sie finden uns hier: ${business.company}, Inh. ${business.owner}, ${fullAddress} (${business.district}). Wir sind ausschließlich in Berlin tätig – in allen Bezirken, ${business.hours}.`)]
    if (/preis|kosten|kostet|teuer|tarif|angebot/.test(low) && !this.expectingField) return [say(`Ihr Angebot erstellt ${business.owner} persönlich nach Prüfung Ihrer Angaben – gern mit kostenloser Besichtigung, schriftlich und mit Festpreis. ${discountLine} Damit ich Ihre Anfrage aufnehmen kann: ${this.askNext(p, greet)}`, this.optionsUI())]
    if (/öffnungs|uhrzeit|wann.*erreich|erreichbar/.test(low)) return [say(`Wir reinigen ${business.hours} – für Büros, Praxen und Schulen gern auch früh morgens, abends oder am Wochenende.`)]
    if (/storn|absag|verschieb/.test(low)) return [say('Sie können Termine bis 24 Stunden vorher kostenlos stornieren oder verschieben – in Ihrem Konto, per WhatsApp oder telefonisch.')]
    if (/leistung|was.*(macht|bietet)|service|objekt/.test(low) && !this.expectingField) return [say('Wir reinigen Büros, Praxen, Kitas, Schulen, Treppenhäuser, Gewerbeobjekte und Hallen – sowie Wohnungen und Häuser. Leistungen: Unterhaltsreinigung, Grund- und Intensivreinigung, Bauend-/Baugrobreinigung, Glasreinigung, Gartenarbeit und Außenreinigung. Für welches Objekt darf ich eine Anfrage aufnehmen?', this.optionsUI('propertyType'))]
    if (/termin|buch|frei|verfügbar|slot/.test(low) && !missingFields(p).length) return [say('Diese Termine sind aktuell frei – bitte wählen Sie einen:', { type: 'slots', slots: await slotsPayload() })]
    if (/^(hallo|hi|hey|guten|moin|servus)/.test(low) && !this.expectingField) return [say(`Hallo${greet ? ' ' + greet : ''}! Ich bin Clea von ${business.company}. Ich nehme Ihre Angebotsanfrage direkt hier im Chat auf. ${missingFields(p).length ? this.askNext(p, greet) : 'Möchten Sie einen Wunschtermin wählen?'}`, this.optionsUI())]

    if (this.expectingField) {
      const ok = this.parseAnswer(this.expectingField, t)
      if (!ok && !this.absorb(t)) return [say(this.hintFor(this.expectingField), this.optionsUI())]
    } else if (missingFields(p).length) {
      return [say(`Gerne${greet ? ', ' + greet : ''}! Damit ${business.owner} Ihr Angebot vorbereiten kann, stelle ich Ihnen ein paar kurze Fragen. ` + this.askNext(store.get(), greet), this.optionsUI())]
    }

    const now = store.get(); const missing = missingFields(now)
    if (missing.length) return [say(this.askNext(now, now.name ? now.name.split(' ')[0] : ''), this.optionsUI())]
    this.expectingField = null
    return [say(`Perfekt, ich habe alles${now.name ? ', ' + now.name.split(' ')[0] : ''}! Wählen Sie bitte einen Wunschtermin für Start bzw. kostenlose Besichtigung:`, { type: 'slots', slots: await slotsPayload() })]
  }

  private optionsUI(field?: keyof Profile): ChatUI | undefined {
    const f = field ?? this.expectingField
    if (!f) return undefined
    const o = optionsFor(f, store.get())
    return o ? { type: 'options', options: o.options, multi: o.multi } : undefined
  }

  /** Extract as much as possible from a free-form message. Returns the number of saved fields. */
  private absorb(t: string): number {
    const low = t.toLowerCase()
    const patch: Partial<Profile> = {}
    const prop = parseProperty(low); if (prop) patch.propertyType = prop
    const sq = low.match(/(\d{2,5})\s*(m²|m2|qm|quadratmeter)/); if (sq) patch.sizeSqm = parseInt(sq[1])
    const floors = parseFloors(low); if (floors.length) patch.floorTypes = floors
    const fr = parseFrequency(low); if (fr) { patch.frequency = fr.frequency; patch.timesPerPeriod = fr.timesPerPeriod }
    const ct = parseCleaning(low); if (ct) { patch.cleaningType = ct; if (oneOffTypes.includes(ct)) { patch.frequency = 'einmalig'; patch.timesPerPeriod = null } }
    const dt = parseDirt(low); if (dt) patch.dirt = dt
    const ac = parseAccess(low); if (ac) patch.access = ac
    const dk = low.match(/(\d+)\s*(arbeitsplätze|arbeitsplaetze|schreibtische|mitarbeiter)/); if (dk) patch.desks = parseInt(dk[1])
    const n = Object.keys(patch).length
    if (n) store.updateProfile(patch)
    return n
  }

  private askNext(p: Profile, greet: string): string {
    const f = missingFields(p)[0]
    this.expectingField = f
    const g = greet ? `${greet}, ` : ''
    const commercial = p.propertyType && p.propertyType !== 'wohnung' && p.propertyType !== 'haus'
    const q: Record<string, string> = {
      name: 'Wie darf ich Sie ansprechen? Bitte nennen Sie mir Ihren Namen (bei Firmen gern auch den Firmennamen).',
      propertyType: 'Um welche Art von Objekt handelt es sich – Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbe/Laden, Halle/Lager, Wohnung oder Haus?',
      sizeSqm: 'Wie groß ist die zu reinigende Fläche ungefähr in Quadratmetern?',
      floorTypes: 'Welche Bodenarten gibt es – Fliesen, Teppich, PVC, Parkett, Laminat, Stein oder Linoleum? Mehrere sind möglich.',
      rooms: commercial ? 'Wie viele Räume sollen gereinigt werden?' : 'Wie viele Zimmer hat das Objekt?',
      bathrooms: commercial ? 'Wie viele WCs / Sanitärräume gibt es?' : 'Wie viele Bäder sollen gereinigt werden?',
      cleaningType: 'Welche Leistung wünschen Sie – regelmäßige Unterhaltsreinigung, Grundreinigung, Intensivreinigung, Bauend-/Baugrobreinigung, Glasreinigung, Gartenarbeit oder Außenreinigung?',
      dirt: 'Wie stark ist das Objekt verschmutzt – leicht, normal, mittel oder stark?',
      access: 'Wie ist der Zugang – einfach (ebenerdig, Schlüssel), standard (Etage/Anmeldung) oder schwierig (viele Etagen ohne Aufzug, Sicherheitsbereich)?',
      frequency: 'Wie oft sollen wir kommen – täglich (Mo–Fr), wöchentlich, alle 2 Wochen, monatlich oder einmalig?',
      timesPerPeriod: p.frequency === 'monatlich' ? 'Wie oft pro Monat – 1×, 2× oder 3×?' : 'Wie oft pro Woche – z. B. 1×, 2×, 3× oder 5×?',
      timeWindow: 'Zu welcher Zeit passt es am besten – früh, vormittags, nachmittags, abends, nachts, am Wochenende oder flexibel?',
      street: `${g}wie lautet die Adresse des Objekts (Straße und Hausnummer)?`,
      zip: 'Wie lautet die Postleitzahl?',
      city: 'Und in welchem Ort befindet sich das Objekt?',
      floor: 'In welcher Etage bzw. welchen Etagen liegt das Objekt (z. B. EG, 2, EG–3)?',
      elevator: 'Gibt es einen Aufzug? (ja/nein)',
      pets: 'Leben Haustiere im Objekt? (ja/nein)',
      phone: 'Unter welcher Telefonnummer erreichen wir Sie?',
      email: 'Und Ihre E-Mail-Adresse für die Bestätigung und das Angebot?',
    }
    return q[f] ?? 'Gibt es noch Hinweise für unser Team?'
  }

  private hintFor(f: keyof Profile) {
    const h: Record<string, string> = {
      zip: 'Die Postleitzahl besteht aus 5 Ziffern, z. B. 12307.', sizeSqm: 'Bitte eine Zahl in m², z. B. 250.', rooms: 'Bitte eine Zahl, z. B. 8.', bathrooms: 'Bitte eine Zahl, z. B. 2.',
      elevator: 'Bitte antworten Sie mit ja oder nein.', pets: 'Bitte antworten Sie mit ja oder nein.', email: 'Bitte eine gültige E-Mail-Adresse, z. B. name@beispiel.de.',
      propertyType: 'Bitte wählen Sie: Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbe/Laden, Halle/Lager, Wohnung oder Haus.', floorTypes: 'Bitte wählen Sie: Fliesen, Teppich, PVC, Parkett, Laminat, Stein oder Linoleum.',
      cleaningType: 'Bitte wählen Sie: Unterhaltsreinigung, Grundreinigung, Intensivreinigung, Bauendreinigung, Baugrobreinigung, Glasreinigung, Gartenarbeit oder Außenreinigung.', dirt: 'Bitte wählen Sie: leicht, normal, mittel oder stark.', access: 'Bitte wählen Sie: einfach, standard oder schwierig.',
      frequency: 'Bitte wählen Sie: täglich, wöchentlich, alle 2 Wochen, monatlich oder einmalig.', timesPerPeriod: 'Bitte eine Zahl, z. B. „3× pro Woche“.', timeWindow: 'Bitte wählen Sie: früh, vormittags, nachmittags, abends, nachts, Wochenende oder flexibel.',
      phone: 'Bitte eine Telefonnummer, z. B. +49 30 1234567 oder 0176 1234567.',
    }
    return h[f] ?? 'Das habe ich leider nicht verstanden – können Sie es noch einmal anders formulieren?'
  }

  private parseAnswer(f: keyof Profile, t: string): boolean {
    const low = t.toLowerCase()
    const yes = /\b(ja|jep|yes|klar|gibt es|vorhanden)\b/.test(low), no = /\b(nein|nö|keine|kein|nicht)\b/.test(low)
    const num = t.match(/\d+([.,]\d+)?/)
    const up = store.updateProfile
    switch (f) {
      case 'name': if (t.length < 2) return false; up({ name: t.replace(/^(ich heiße|mein name ist|ich bin|wir sind)\s*/i, '').trim() }); return true
      case 'street': { const zip = t.match(/\b(\d{5})\b/); const patch: Partial<Profile> = { street: t.replace(/,?\s*\b\d{5}\b.*$/, '').trim() || t }; if (zip) { patch.zip = zip[1]; const c = cityFromZip(zip[1]); const after = t.split(zip[1])[1]?.replace(/[,\s]+/, '').trim(); patch.city = after || c || '' } up(patch); return true }
      case 'zip': { const z = t.match(/\b(\d{5})\b/); if (!z) return false; up({ zip: z[1], city: store.get().city || cityFromZip(z[1]) || '' }); return true }
      case 'city': up({ city: t.trim() }); return true
      case 'propertyType': { const m = parseProperty(low); if (!m) return false; up({ propertyType: m }); return true }
      case 'sizeSqm': if (!num) return false; up({ sizeSqm: Math.round(parseFloat(num[0].replace(/\./g, '').replace(',', '.'))) }); return true
      case 'floorTypes': { const fl = parseFloors(low); if (!fl.length) return false; up({ floorTypes: fl }); return true }
      case 'rooms': if (!num) return false; up({ rooms: parseInt(num[0]) }); return true
      case 'bathrooms': if (!num) return false; up({ bathrooms: parseInt(num[0]) }); return true
      case 'floor': { const fl = /erdgeschoss|eg\b|parterre/.test(low) ? (num ? `EG–${num[0]}` : 'EG') : num ? num[0] : t.trim(); up({ floor: fl }); const el = yes ? true : no ? false : null; if (el !== null && /aufzug|lift|fahrstuhl/.test(low)) up({ elevator: el }); return true }
      case 'elevator': if (!yes && !no) return false; up({ elevator: yes && !no }); return true
      case 'pets': if (!yes && !no && !/hund|katze/.test(low)) return false; up({ pets: (yes || /hund|katze/.test(low)) && !no }); return true
      case 'cleaningType': { const m = parseCleaning(low); if (!m) return false; up({ cleaningType: m, ...(oneOffTypes.includes(m) ? { frequency: 'einmalig' as const, timesPerPeriod: null } : {}) }); return true }
      case 'dirt': { const m = parseDirt(low); if (!m) return false; up({ dirt: m }); return true }
      case 'access': { const m = parseAccess(low); if (!m) return false; up({ access: m }); return true }
      case 'frequency': { const m = parseFrequency(low); if (!m) return false; up(m); return true }
      case 'timesPerPeriod': { if (!num) return false; const n = parseInt(num[0]); if (n < 1 || n > 7) return false; up({ timesPerPeriod: n }); return true }
      case 'timeWindow': { const m = /früh|frueh|06|6 uhr|vor 8/.test(low) ? 'frueh' : /vormittag|morgen|08|8 uhr|9 uhr|10 uhr/.test(low) ? 'vormittag' : /nachmittag|mittag|13|14|15|16/.test(low) ? 'nachmittag' : /nacht/.test(low) ? 'nacht' : /wochenende|samstag|sonntag/.test(low) ? 'wochenende' : /abend|17|18|19|20/.test(low) ? 'abend' : /flexib|egal|jederzeit/.test(low) ? 'flexibel' : null; if (!m) return false; up({ timeWindow: m }); return true }
      case 'phone': { const ph = t.match(/[+\d][\d\s/()-]{5,}/); if (!ph) return false; up({ phone: ph[0].trim() }); return true }
      case 'email': { const em = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/); if (!em) return false; up({ email: em[0] }); return true }
      default: return true
    }
  }
}

/* ---------- parsers ---------- */
function parseProperty(low: string): PropertyType | null {
  if (/kita|kindergarten|krippe|hort/.test(low)) return 'kita'
  if (/schule|klassen|gymnasium|grundschule/.test(low)) return 'schule'
  if (/treppenhaus|treppe|hausflur|stiegen/.test(low)) return 'treppenhaus'
  if (/halle|lager|logistik|werkhalle/.test(low)) return 'halle'
  if (/praxis|arzt|zahn|physio|klinik/.test(low)) return 'praxis'
  if (/büro|buero|office|kanzlei|agentur|verwaltung/.test(low)) return 'buero'
  if (/gewerbe|laden|geschäft|store|shop|studio|werkstatt|restaurant|café|cafe|hotel|fitness/.test(low)) return 'gewerbe'
  if (/wohnung|apartment|wg\b/.test(low)) return 'wohnung'
  if (/\bhaus\b|einfamilien|reihenhaus|villa/.test(low)) return 'haus'
  return null
}
function parseFloors(low: string): FloorType[] {
  const out: FloorType[] = []
  if (/fliese|kachel/.test(low)) out.push('fliesen')
  if (/teppich|auslegware/.test(low)) out.push('teppich')
  if (/pvc|vinyl|design(boden|belag)/.test(low)) out.push('pvc')
  if (/parkett|holz|dielen/.test(low)) out.push('parkett')
  if (/laminat/.test(low)) out.push('laminat')
  if (/stein|marmor|granit|terrazzo|beton|estrich/.test(low)) out.push('stein')
  if (/linoleum|lino\b/.test(low)) out.push('linoleum')
  if (/gemischt|verschieden|alles/.test(low) && !out.length) out.push('gemischt')
  return out
}
function parseCleaning(low: string): CleaningType | null {
  if (/bauend|endreinigung nach|bezugsfertig/.test(low)) return 'bauend'
  if (/baugrob|grobreinigung|rohbau/.test(low)) return 'baugrob'
  if (/grund|umzug|tiefenrein/.test(low)) return 'grund'
  if (/intensiv/.test(low)) return 'intensiv'
  if (/fenster|glas|scheiben/.test(low)) return 'glas'
  if (/garten|rasen|hecke|laub|unkraut/.test(low)) return 'garten'
  if (/hochdruck|außenreinigung|aussenreinigung|fassade|terrasse|garage|solar/.test(low)) return 'aussen'
  if (/unterhalt|regelm|laufend|wöchentlich|woechentlich|täglich|taeglich|monatlich|büroreinigung|bueroreinigung|praxisreinigung/.test(low)) return 'unterhalt'
  return null
}
function parseDirt(low: string): DirtLevel | null {
  if (/stark|sehr schmutzig|lange nicht|extrem/.test(low)) return 'stark'
  if (/mittel|viel publikum|stärker/.test(low)) return 'mittel'
  if (/leicht|gepflegt|wenig/.test(low)) return 'leicht'
  if (/normal|üblich|durchschnitt/.test(low)) return 'normal'
  return null
}
function parseAccess(low: string): Access | null {
  if (/schwierig|kein aufzug|sicherheits|kompliziert/.test(low)) return 'schwierig'
  if (/einfach|ebenerdig|schlüssel/.test(low)) return 'einfach'
  if (/standard|normal|anmeldung|etage/.test(low)) return 'standard'
  return null
}
function parseFrequency(low: string): Pick<Profile, 'frequency' | 'timesPerPeriod'> | null {
  const n = low.match(/(\d)\s*(x|×|mal)/)?.[1]
  const words: Record<string, number> = { einmal: 1, zweimal: 2, dreimal: 3, viermal: 4, fünfmal: 5, sechsmal: 6 }
  const w = Object.keys(words).find(k => low.includes(k))
  const count = n ? parseInt(n) : w ? words[w] : null
  if (/täglich|taeglich|jeden tag|mo-fr|mo–fr|montag bis freitag|werktäglich/.test(low) || (count === 5 && /woche/.test(low))) return { frequency: 'taeglich', timesPerPeriod: null }
  if (/zwei ?wöchent|14[- ]?tägig|alle (2|zwei) wochen|zweiwöchentlich/.test(low)) return { frequency: 'zweiwoechentlich', timesPerPeriod: null }
  if (/monat/.test(low)) return { frequency: 'monatlich', timesPerPeriod: Math.min(3, count ?? 1) }
  if (/woche|wöchent|woechent|weekly/.test(low)) return { frequency: 'woechentlich', timesPerPeriod: Math.min(6, count ?? 1) }
  if (/einmalig|nur einmal|once|einmal\b/.test(low) && !count) return { frequency: 'einmalig', timesPerPeriod: null }
  if (count && count >= 1 && count <= 6) return { frequency: 'woechentlich', timesPerPeriod: count }
  return null
}
function uid() { return Math.random().toString(36).slice(2, 10) }
