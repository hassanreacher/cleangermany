import { store, missingFields } from './store'
import { estimatePrice, estimateDuration, estimateMonthly, withDiscount, cleaningsPerMonth } from './pricing'
import { nextAvailable, freeSlots, todayISO } from './slots'
import { cityFromZip } from './data'
import { cleaningLabels, extraLabel, floorLabels, formatDateDE, frequencyLabels, frequencyText, propertyLabels, timeWindowLabels, weekdaysLong, commercialTypes } from './labels'
import { business, fullAddress, whatsappUrl } from './config'
import { requestSummary } from './summary'
import type { FloorType, Frequency, Profile, PropertyType, TimeWindow } from './types'

export interface ChatOption { label: string; value: string }
export interface ChatUI {
  type: 'slots' | 'booking' | 'estimate' | 'options' | 'contact'
  slots?: { date: string; times: string[] }[]
  booking?: { code: string; date: string; time: string; whatsapp: string }
  estimate?: { perCleaning: [number, number]; monthly: [number, number] | null; discounted: [number, number]; sqm: number | null; rhythm: string }
  options?: ChatOption[]
  multi?: boolean
  contact?: { whatsapp: string }
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
  name: 'Name / Firma', email: 'E-Mail', phone: 'Telefon', street: 'Straße & Hausnummer', zip: 'PLZ', city: 'Ort', propertyType: 'Objektart',
  sizeSqm: 'Fläche in m²', floorTypes: 'Bodenarten', rooms: 'Räume', bathrooms: 'Sanitärräume / Bäder', floor: 'Etage', elevator: 'Aufzug', pets: 'Haustiere',
  cleaningType: 'Reinigungsart', frequency: 'Rhythmus', timesPerPeriod: 'Reinigungen pro Woche/Monat', timeWindow: 'Bevorzugte Uhrzeit', extras: 'Extras', notes: 'Hinweise',
}

/** Quick-reply options for select-type fields (shown as chips in the chat). */
export function optionsFor(f: keyof Profile, p: Profile): { options: ChatOption[]; multi?: boolean } | null {
  switch (f) {
    case 'propertyType': return { options: [...commercialTypes, 'wohnung', 'haus'].map(k => ({ label: propertyLabels[k as PropertyType], value: propertyLabels[k as PropertyType] })) }
    case 'floorTypes': return { multi: true, options: (Object.keys(floorLabels) as FloorType[]).map(k => ({ label: floorLabels[k], value: floorLabels[k] })) }
    case 'cleaningType': return { options: (['buero', 'unterhalt', 'grund', 'umzug', 'fenster'] as const).map(k => ({ label: cleaningLabels[k], value: cleaningLabels[k] })) }
    case 'frequency': return { options: (Object.keys(frequencyLabels) as Frequency[]).map(k => ({ label: frequencyLabels[k], value: frequencyLabels[k] })) }
    case 'timesPerPeriod': { const n = p.frequency === 'monatlich' ? 3 : 6; const unit = p.frequency === 'monatlich' ? 'pro Monat' : 'pro Woche'; return { options: Array.from({ length: n }, (_, i) => ({ label: `${i + 1}× ${unit}`, value: `${i + 1}× ${unit}` })) } }
    case 'timeWindow': return { options: (Object.keys(timeWindowLabels) as TimeWindow[]).map(k => ({ label: timeWindowLabels[k], value: timeWindowLabels[k] })) }
    case 'elevator': case 'pets': return { options: [{ label: 'Ja', value: 'ja' }, { label: 'Nein', value: 'nein' }] }
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
    if (k === 'cleaningType') s = cleaningLabels[v as keyof typeof cleaningLabels] ?? s
    if (k === 'frequency') s = frequencyText(p)
    if (k === 'timeWindow') s = timeWindowLabels[v as TimeWindow] ?? s
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
  const [lo, hi] = business.pricePerSqm
  return {
    today: formatDateDE(today), weekday: weekdaysLong[new Date().getDay()], profile: profileSummary(s.profile), missing,
    loggedIn: !!s.user, appointments: own.map(a => `${a.code} am ${formatDateDE(a.date)} ${a.time} (${a.status})`).join('; '),
    business: `${business.company} (Inh. ${business.owner}), ${fullAddress}, Tel. ${business.phoneDisplay}, WhatsApp verfügbar`,
    pricing: `ca. ${lo.toFixed(2).replace('.', ',')}–${hi.toFixed(2).replace('.', ',')} € pro m² und Reinigung (Richtwert). Grund-/Umzugsreinigung intensiver (ca. ×1,7–1,9). DIREKT-RABATT: Anfrage online senden und sich danach direkt telefonisch oder per WhatsApp bei ${business.owner} melden → ${business.directDiscount[0]}–${business.directDiscount[1]} % Rabatt.`,
  }
}

/* ---------- tool execution (browser side, no database) ---------- */
function slotsPayload(from?: string) {
  const s = store.get()
  const list = nextAvailable(s.appointments, s.blockedSlots, 5, from && from >= todayISO() ? from : todayISO())
  return list.map(d => ({ date: d.date, weekday: weekdaysLong[new Date(d.date + 'T00:00').getDay()], times: d.times }))
}

function estimateUI(p: Profile): ChatUI {
  const per = estimatePrice(p)
  return { type: 'estimate', estimate: { perCleaning: per, monthly: estimateMonthly(p), discounted: withDiscount(per), sqm: p.sizeSqm, rhythm: frequencyText(p) } }
}

function execTool(name: string, args: any): { result: unknown; ui?: ChatUI } {
  const s = store.get()
  switch (name) {
    case 'save_profile_field': {
      const patch: Partial<Profile> = {}
      for (const [k, v] of Object.entries(args ?? {})) {
        if (v === undefined || v === null || v === '') continue
        if (k === 'sizeSqm' || k === 'rooms' || k === 'bathrooms' || k === 'timesPerPeriod') (patch as any)[k] = Number(v)
        else if (k === 'extras' || k === 'floorTypes') (patch as any)[k] = Array.isArray(v) ? v : String(v).split(/,\s*/)
        else (patch as any)[k] = v
      }
      if (patch.zip && !patch.city) { const c = cityFromZip(patch.zip); if (c) patch.city = c }
      if (patch.frequency === 'taeglich' || patch.frequency === 'einmalig' || patch.frequency === 'zweiwoechentlich') patch.timesPerPeriod = null
      store.updateProfile(patch)
      const missing = missingFields(store.get().profile).map(f => fieldNames[f])
      return { result: { saved: Object.keys(patch), missing, complete: !missing.length } }
    }
    case 'get_available_slots': {
      const slots = slotsPayload(args?.from)
      return { result: { slots }, ui: { type: 'slots', slots } }
    }
    case 'estimate_price': {
      const p = s.profile
      const per = estimatePrice(p); const monthly = estimateMonthly(p); const disc = withDiscount(per)
      return {
        result: { perCleaningMin: per[0], perCleaningMax: per[1], monthlyMin: monthly?.[0] ?? null, monthlyMax: monthly?.[1] ?? null, cleaningsPerMonth: monthly ? cleaningsPerMonth(p) : null, withDirectDiscountMin: disc[0], withDirectDiscountMax: disc[1], pricePerSqm: business.pricePerSqm, durationHours: estimateDuration(p), currency: 'EUR', note: 'Richtwert – Festpreis bestätigt die Inhaberin. Direkt-Rabatt 10–20 % bei Anruf/WhatsApp nach Absenden der Anfrage.' },
        ui: estimateUI(p),
      }
    }
    case 'book_appointment': {
      const { date, time } = args ?? {}
      if (!date || !time) return { result: { error: 'Datum und Uhrzeit fehlen' } }
      if (!freeSlots(date, s.appointments, s.blockedSlots).includes(time)) return { result: { error: 'Dieser Termin ist nicht (mehr) verfügbar. Bitte anderen Termin wählen.', slots: slotsPayload() } }
      const missing = missingFields(s.profile)
      if (missing.length) return { result: { error: 'Es fehlen noch Angaben: ' + missing.map(f => fieldNames[f]).join(', ') } }
      const a = store.book(date, time, 'ki')
      const wa = whatsappUrl(requestSummary(a.customer, a.code))
      return { result: { ok: true, code: a.code, date: a.date, time: a.time, estimate: a.estimate, hint: 'Kunde jetzt auf WhatsApp/Anruf für 10–20 % Direkt-Rabatt hinweisen.' }, ui: { type: 'booking', booking: { code: a.code, date: a.date, time: a.time, whatsapp: wa } } }
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
      // quick-reply chips for the next missing select-type field
      const next = missingFields(store.get().profile)[0]
      const opts = next ? optionsFor(next, store.get().profile) : null
      if (opts && m.content && new RegExp(fieldNames[next].split(' ')[0].slice(0, 5), 'i').test(m.content)) out.push({ id: uid(), role: 'assistant', content: '', ui: { type: 'options', options: opts.options, multi: opts.multi } })
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
    const discountLine = `Tipp: Anfrage senden und sich danach direkt per WhatsApp oder Anruf bei ${business.owner} melden – das bringt ${business.directDiscount[0]}–${business.directDiscount[1]} % Direkt-Rabatt.`

    // pending confirmation of a chosen slot
    if (this.offlinePending) {
      if (/^(ja|yes|ok|okay|passt|gerne|bestätigen|bitte|jep)/i.test(low) || /best[aä]tig/.test(low)) {
        const { date, time } = this.offlinePending; this.offlinePending = null
        const { result, ui } = execTool('book_appointment', { date, time })
        const r = result as any
        if (r.ok) return [say(`Wunderbar${greet ? ', ' + greet : ''}! Ihre Anfrage ist raus – Nummer ${r.code}. ${business.owner} prüft alles und meldet sich mit dem Festpreis. Sichern Sie sich jetzt noch den ${business.directDiscount[0]}–${business.directDiscount[1]} % Direkt-Rabatt: einfach unten per WhatsApp schreiben oder anrufen und die Anfragenummer nennen.`, ui)]
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
      if (missingFields(p).length) return [say('Gerne! Bevor ich den Termin reserviere, brauche ich noch ein paar Angaben. ' + this.askNext(p, greet), this.optionsUI())]
      if (!freeSlots(date!, s.appointments, s.blockedSlots).includes(time)) return [say('Dieser Termin ist leider nicht verfügbar. Diese Termine sind frei:', { type: 'slots', slots: slotsPayload() })]
      this.offlinePending = { kind: 'confirm', date: date!, time }
      const e = estimatePrice(p)
      return [say(`Kurz zur Kontrolle: ${cleaningLabels[p.cleaningType as keyof typeof cleaningLabels] ?? 'Reinigung'} (${propertyLabels[p.propertyType as PropertyType] ?? 'Objekt'}, ${p.sizeSqm} m², ${frequencyText(p)}) – Start am ${formatDateDE(date!, { weekday: true })} um ${time} Uhr in ${p.street}, ${p.zip} ${p.city}. Ungefähr ${e[0]}–${e[1]} € pro Reinigung. Soll ich die Anfrage verbindlich senden? (ja/nein)`)]
    }

    // absorb free text like "Büro, 300 qm, Fliesen, 3x pro Woche" (only when we are not waiting for a specific answer)
    const learned = this.expectingField ? 0 : this.absorb(t)
    if (learned) {
      const now = store.get().profile
      const missing = missingFields(now)
      const e = now.sizeSqm ? estimatePrice(now) : null
      const m = now.sizeSqm ? estimateMonthly(now) : null
      const priceLine = e ? `Ungefährer Preis: ${e[0]}–${e[1]} € pro Reinigung${m ? `, ca. ${m[0]}–${m[1]} € im Monat` : ''} – mit Direkt-Rabatt (WhatsApp/Anruf nach dem Absenden) ${business.directDiscount[0]}–${business.directDiscount[1]} % weniger. ` : ''
      if (!missing.length) { this.expectingField = null; return [say(`Danke, das habe ich notiert. ${priceLine}Wählen Sie bitte einen Termin für Start bzw. Besichtigung:`, { type: 'slots', slots: slotsPayload() })] }
      const out = [say(`Danke${greet ? ', ' + greet : ''}, das habe ich notiert! ${priceLine}${this.askNext(now, greet)}`, e ? estimateUI(now) : this.optionsUI())]
      if (e && this.optionsUI()) out.push(say('', this.optionsUI()))
      return out
    }

    // contact / WhatsApp / discount
    if (/whatsapp|anruf|telefon|rabatt|direkt|sparen|günstiger|billiger/.test(low)) return [say(`Sehr gern! ${discountLine} Hier geht es direkt weiter:`, { type: 'contact', contact: { whatsapp: whatsappUrl(requestSummary(p)) } })]
    if (/wo seid|standort|adresse|anfahrt|wo sitzt|wo befindet/.test(low)) return [say(`Sie finden uns hier: ${business.company}, Inh. ${business.owner}, ${fullAddress} (${business.district}). Wir sind in ganz Berlin und Umgebung im Einsatz – ${business.hours}.`)]

    // FAQ shortcuts
    if (/preis|kosten|kostet|teuer|tarif/.test(low) && p.sizeSqm) { return [say(`Auf Basis Ihrer Angaben liegt der ungefähre Preis bei ${estimatePrice(p)[0]}–${estimatePrice(p)[1]} € pro Reinigung${estimateMonthly(p) ? ` (ca. ${estimateMonthly(p)![0]}–${estimateMonthly(p)![1]} € pro Monat)` : ''}. ${discountLine}${missingFields(p).length ? ' ' + this.askNext(p, greet) : ''}`, estimateUI(p))] }
    if (/preis|kosten|kostet|teuer|tarif/.test(low)) return [say(`Wir rechnen ungefähr mit ${business.pricePerSqm[0].toFixed(2).replace('.', ',')}–${business.pricePerSqm[1].toFixed(2).replace('.', ',')} € pro m² und Reinigung – ein 300 m² Büro liegt z. B. bei ca. ${estimatePrice({ sizeSqm: 300 })[0]}–${estimatePrice({ sizeSqm: 300 })[1]} € pro Reinigung. ${discountLine} Für Ihren konkreten Preis: ` + this.askNext(p, greet), this.optionsUI())]
    if (/öffnungs|uhrzeit|wann.*erreich|erreichbar/.test(low)) return [say(`Wir reinigen ${business.hours} – für Büros, Praxen und Schulen gern auch früh morgens oder abends außerhalb Ihrer Öffnungszeiten. Anfragen können Sie jederzeit hier im Chat stellen.`)]
    if (/storn|absag|verschieb/.test(low)) return [say('Sie können Termine bis 24 Stunden vorher kostenlos stornieren oder verschieben – einfach hier im Chat oder unter „Mein Konto“.')]
    if (/leistung|angebot|was.*(macht|bietet)|service|objekt/.test(low) && !this.expectingField) return [say(`Wir reinigen Büros, Praxen, Kitas, Schulen, Treppenhäuser, Gewerbeobjekte und Hallen/Lager – sowie Wohnungen und Häuser. Leistungen: Unterhalts-/Büroreinigung, Grundreinigung, Umzugsreinigung und Fensterreinigung, abgestimmt auf Ihre Böden (Fliesen, Teppich, PVC, Parkett, Stein …). Für welches Objekt darf ich ein Angebot vorbereiten?`, this.optionsUI('propertyType'))]
    if (/termin|buch|frei|verfügbar|slot/.test(low) && !missingFields(p).length) return [say('Diese Termine sind aktuell frei – bitte wählen Sie einen:', { type: 'slots', slots: slotsPayload() })]
    if (/^(hallo|hi|hey|guten|moin|servus)/.test(low) && !this.expectingField) return [say(`Hallo${greet ? ' ' + greet : ''}! Ich bin Clea von ${business.company}. Ich beantworte Fragen und stelle Ihre Angebotsanfrage direkt hier im Chat zusammen. ${missingFields(p).length ? this.askNext(p, greet) : 'Möchten Sie einen Termin anfragen?'}`, this.optionsUI())]

    // save answer for the field we are expecting
    if (this.expectingField) {
      const ok = this.parseAnswer(this.expectingField, t)
      if (!ok && !this.absorb(t)) return [say(this.hintFor(this.expectingField), this.optionsUI())]
    } else if (missingFields(p).length) {
      // first contact: start collecting
      return [say(`Gerne${greet ? ', ' + greet : ''}! Damit ich Ihr Angebot vorbereiten kann, stelle ich Ihnen ein paar kurze Fragen. ` + this.askNext(store.get().profile, greet), this.optionsUI())]
    }

    const now = store.get().profile
    const missing = missingFields(now)
    // show a price as soon as we know the area and rhythm
    const justSaved = this.expectingField
    if (justSaved === 'timesPerPeriod' || (justSaved === 'frequency' && now.frequency !== 'woechentlich' && now.frequency !== 'monatlich')) {
      const e = estimatePrice(now); const m = estimateMonthly(now)
      if (missing.length) return [say(`Danke! Ungefährer Preis: ${e[0]}–${e[1]} € pro Reinigung${m ? `, ca. ${m[0]}–${m[1]} € im Monat` : ''} – mit Direkt-Rabatt entsprechend weniger. ` + this.askNext(now, greet), estimateUI(now)), ...(this.optionsUI() ? [say('', this.optionsUI())] : [])]
    }
    if (missing.length) return [say(this.askNext(now, now.name ? now.name.split(' ')[0] : ''), this.optionsUI())]
    this.expectingField = null
    const e = estimatePrice(now)
    return [say(`Perfekt, ich habe alles${now.name ? ', ' + now.name.split(' ')[0] : ''}! Ungefähr ${e[0]}–${e[1]} € pro Reinigung${estimateMonthly(now) ? ` (ca. ${estimateMonthly(now)![0]}–${estimateMonthly(now)![1]} €/Monat)` : ''}, Dauer ca. ${estimateDuration(now)} Std. Wählen Sie bitte einen Termin für Start bzw. Besichtigung:`, { type: 'slots', slots: slotsPayload() })]
  }

  private expectingField: keyof Profile | null = null

  private optionsUI(field?: keyof Profile): ChatUI | undefined {
    const f = field ?? this.expectingField
    if (!f) return undefined
    const o = optionsFor(f, store.get().profile)
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
    const ct = parseCleaning(low); if (ct) patch.cleaningType = ct
    const n = Object.keys(patch).length
    if (n) store.updateProfile(patch)
    return n
  }

  private askNext(p: Profile, greet: string): string {
    const missing = missingFields(p)
    const f = missing[0]
    this.expectingField = f
    const g = greet ? `${greet}, ` : ''
    const commercial = p.propertyType && p.propertyType !== 'wohnung' && p.propertyType !== 'haus'
    const q: Record<string, string> = {
      name: 'Wie darf ich Sie ansprechen? Bitte nennen Sie mir Ihren Namen (bei Firmen gern auch den Firmennamen).',
      propertyType: 'Um welche Art von Objekt handelt es sich – Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbeobjekt, Halle/Lager, Wohnung oder Haus?',
      sizeSqm: 'Wie groß ist die zu reinigende Fläche ungefähr in Quadratmetern? (Daraus ergibt sich der Preis – ca. 1,30–1,45 € pro m².)',
      floorTypes: 'Welche Bodenarten gibt es – Fliesen, Teppich, PVC, Parkett, Laminat, Stein oder Linoleum? Mehrere sind möglich.',
      rooms: commercial ? 'Wie viele Räume sollen gereinigt werden?' : 'Wie viele Zimmer hat das Objekt?',
      bathrooms: commercial ? 'Wie viele Sanitärräume / WCs gibt es?' : 'Wie viele Bäder sollen gereinigt werden?',
      cleaningType: 'Welche Leistung wünschen Sie – Büro-/Unterhaltsreinigung, Grundreinigung, Umzugsreinigung oder Fensterreinigung?',
      frequency: 'Wie oft sollen wir kommen – täglich (Mo–Fr), wöchentlich, alle 2 Wochen, monatlich oder einmalig?',
      timesPerPeriod: p.frequency === 'monatlich' ? 'Wie oft pro Monat – 1×, 2× oder 3×?' : 'Wie oft pro Woche – z. B. 1×, 2×, 3× oder 5×?',
      timeWindow: 'Zu welcher Zeit passt es am besten – früh (06–08 Uhr), vormittags, nachmittags, abends oder flexibel?',
      street: `${g}wie lautet die Adresse des Objekts (Straße und Hausnummer)?`,
      zip: 'Wie lautet die Postleitzahl?',
      city: 'Und in welchem Ort befindet sich das Objekt?',
      floor: 'In welcher Etage bzw. welchen Etagen liegt das Objekt (z. B. EG, 2, EG–3)?',
      elevator: 'Gibt es einen Aufzug? (ja/nein)',
      pets: 'Leben Haustiere im Objekt? (ja/nein)',
      phone: 'Unter welcher Telefonnummer erreichen wir Sie?',
      email: 'Und Ihre E-Mail-Adresse für das Angebot?',
    }
    return q[f] ?? 'Gibt es noch Hinweise für unser Team?'
  }

  private hintFor(f: keyof Profile) {
    const h: Record<string, string> = {
      zip: 'Die Postleitzahl besteht aus 5 Ziffern, z. B. 12307.', sizeSqm: 'Bitte eine Zahl in m², z. B. 250.', rooms: 'Bitte eine Zahl, z. B. 8.', bathrooms: 'Bitte eine Zahl, z. B. 2.',
      elevator: 'Bitte antworten Sie mit ja oder nein.', pets: 'Bitte antworten Sie mit ja oder nein.', email: 'Bitte eine gültige E-Mail-Adresse, z. B. name@beispiel.de.',
      propertyType: 'Bitte wählen Sie: Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbeobjekt, Halle/Lager, Wohnung oder Haus.', floorTypes: 'Bitte wählen Sie: Fliesen, Teppich, PVC, Parkett, Laminat, Stein oder Linoleum.',
      cleaningType: 'Bitte wählen Sie: Büro-/Unterhaltsreinigung, Grundreinigung, Umzugsreinigung oder Fensterreinigung.', frequency: 'Bitte wählen Sie: täglich, wöchentlich, alle 2 Wochen, monatlich oder einmalig.',
      timesPerPeriod: 'Bitte eine Zahl, z. B. „3× pro Woche“.', timeWindow: 'Bitte wählen Sie: früh, vormittags, nachmittags, abends oder flexibel.',
      phone: 'Bitte eine Telefonnummer, z. B. +49 30 1234567.',
    }
    return h[f] ?? 'Das habe ich leider nicht verstanden – können Sie es noch einmal anders formulieren?'
  }

  private parseAnswer(f: keyof Profile, t: string): boolean {
    const low = t.toLowerCase()
    const yes = /\b(ja|jep|yes|klar|gibt es|vorhanden)\b/.test(low), no = /\b(nein|nö|keine|kein|nicht)\b/.test(low)
    const num = t.match(/\d+([.,]\d+)?/)
    switch (f) {
      case 'name': if (t.length < 2) return false; store.updateProfile({ name: t.replace(/^(ich heiße|mein name ist|ich bin|wir sind)\s*/i, '').trim() }); return true
      case 'street': {
        const zip = t.match(/\b(\d{5})\b/); const patch: Partial<Profile> = { street: t.replace(/,?\s*\b\d{5}\b.*$/, '').trim() || t }
        if (zip) { patch.zip = zip[1]; const c = cityFromZip(zip[1]); const after = t.split(zip[1])[1]?.replace(/[,\s]+/, '').trim(); patch.city = after || c || '' }
        store.updateProfile(patch); return true
      }
      case 'zip': { const z = t.match(/\b(\d{5})\b/); if (!z) return false; store.updateProfile({ zip: z[1], city: store.get().profile.city || cityFromZip(z[1]) || '' }); return true }
      case 'city': store.updateProfile({ city: t.trim() }); return true
      case 'propertyType': { const m = parseProperty(low); if (!m) return false; store.updateProfile({ propertyType: m }); return true }
      case 'sizeSqm': if (!num) return false; store.updateProfile({ sizeSqm: Math.round(parseFloat(num[0].replace(/\./g, '').replace(',', '.'))) }); return true
      case 'floorTypes': { const fl = parseFloors(low); if (!fl.length) return false; store.updateProfile({ floorTypes: fl }); return true }
      case 'rooms': if (!num) return false; store.updateProfile({ rooms: parseInt(num[0]) }); return true
      case 'bathrooms': if (!num) return false; store.updateProfile({ bathrooms: parseInt(num[0]) }); return true
      case 'floor': { const fl = /erdgeschoss|eg\b|parterre/.test(low) ? (num ? `EG–${num[0]}` : 'EG') : num ? num[0] : t.trim(); store.updateProfile({ floor: fl }); const el = yes ? true : no ? false : null; if (el !== null && /aufzug|lift|fahrstuhl/.test(low)) store.updateProfile({ elevator: el }); return true }
      case 'elevator': if (!yes && !no) return false; store.updateProfile({ elevator: yes && !no }); return true
      case 'pets': if (!yes && !no && !/hund|katze/.test(low)) return false; store.updateProfile({ pets: (yes || /hund|katze/.test(low)) && !no }); return true
      case 'cleaningType': { const m = parseCleaning(low); if (!m) return false; store.updateProfile({ cleaningType: m }); return true }
      case 'frequency': { const m = parseFrequency(low); if (!m) return false; store.updateProfile(m); return true }
      case 'timesPerPeriod': { if (!num) return false; const n = parseInt(num[0]); if (n < 1 || n > 7) return false; store.updateProfile({ timesPerPeriod: n }); return true }
      case 'timeWindow': { const m = /früh|frueh|06|6 uhr|vor 8/.test(low) ? 'frueh' : /vormittag|morgen|08|8 uhr|9 uhr|10 uhr/.test(low) ? 'vormittag' : /nachmittag|mittag|13|14|15|16/.test(low) ? 'nachmittag' : /abend|nach (17|18)|17|18|19|20/.test(low) ? 'abend' : /flexib|egal|jederzeit/.test(low) ? 'flexibel' : null; if (!m) return false; store.updateProfile({ timeWindow: m }); return true }
      case 'phone': { const ph = t.match(/[+\d][\d\s/()-]{5,}/); if (!ph) return false; store.updateProfile({ phone: ph[0].trim() }); return true }
      case 'email': { const em = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/); if (!em) return false; store.updateProfile({ email: em[0] }); return true }
      default: return true
    }
  }
}

/* ---------- parsers shared by offline brain ---------- */
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
function parseCleaning(low: string) {
  return /grund/.test(low) ? 'grund' as const : /umzug|endreinigung|übergabe/.test(low) ? 'umzug' as const : /fenster|glas/.test(low) ? 'fenster' as const : /büro|buero|praxis|gewerbe|objekt/.test(low) ? 'buero' as const : /unterhalt|normal|regelm|standard|laufend/.test(low) ? 'unterhalt' as const : null
}
function parseFrequency(low: string): Pick<Profile, 'frequency' | 'timesPerPeriod'> | null {
  const n = low.match(/(\d)\s*(x|×|mal)/)?.[1]
  const words: Record<string, number> = { einmal: 1, zweimal: 2, dreimal: 3, viermal: 4, fünfmal: 5, sechsmal: 6 }
  const w = Object.keys(words).find(k => low.includes(k))
  const count = n ? parseInt(n) : w ? words[w] : null
  if (/täglich|taeglich|jeden tag|mo-fr|mo–fr|montag bis freitag|werktäglich/.test(low) || count === 5 && /woche/.test(low)) return { frequency: 'taeglich', timesPerPeriod: null }
  if (/zwei ?wöchent|14[- ]?tägig|alle (2|zwei) wochen|zweiwöchentlich/.test(low)) return { frequency: 'zweiwoechentlich', timesPerPeriod: null }
  if (/monat/.test(low)) return { frequency: 'monatlich', timesPerPeriod: Math.min(3, count ?? 1) }
  if (/woche|wöchent|woechent|weekly/.test(low)) return { frequency: 'woechentlich', timesPerPeriod: Math.min(6, count ?? 1) }
  if (/einmalig|nur einmal|once|einmal\b/.test(low) && !count) return { frequency: 'einmalig', timesPerPeriod: null }
  if (count && count >= 1 && count <= 6) return { frequency: 'woechentlich', timesPerPeriod: count }
  return null
}

function uid() { return Math.random().toString(36).slice(2, 10) }
