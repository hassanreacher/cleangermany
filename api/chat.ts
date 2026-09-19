/**
 * Vercel Serverless Function – proxy to Groq (OpenAI-compatible chat completions with tool calling).
 * The API key never reaches the browser. Tools are *executed* in the browser (demo without database),
 * this function only forwards messages and returns the assistant message (which may contain tool_calls).
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const tools = [
  {
    type: 'function',
    function: {
      name: 'save_profile_field',
      description: 'Speichert Angaben des Kunden im Profil. Rufe dies SOFORT auf, sobald der Kunde eine Information nennt – mehrere Felder auf einmal sind erlaubt und erwünscht.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vollständiger Name bzw. Firma + Ansprechperson' },
          phone: { type: 'string' },
          email: { type: 'string' },
          street: { type: 'string', description: 'Straße und Hausnummer des Objekts' },
          zip: { type: 'string', description: 'Postleitzahl (5 Ziffern)' },
          city: { type: 'string' },
          propertyType: { type: 'string', enum: ['buero', 'praxis', 'kita', 'schule', 'treppenhaus', 'gewerbe', 'halle', 'wohnung', 'haus'], description: 'Objektart: Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbeobjekt, Halle/Lager, Wohnung, Haus' },
          sizeSqm: { type: 'number', description: 'Zu reinigende Fläche in Quadratmetern' },
          floorTypes: { type: 'array', items: { type: 'string', enum: ['fliesen', 'teppich', 'pvc', 'parkett', 'laminat', 'stein', 'linoleum', 'gemischt'] }, description: 'Bodenarten (mehrere möglich)' },
          rooms: { type: 'number', description: 'Anzahl Räume / Zimmer' },
          bathrooms: { type: 'number', description: 'Anzahl Sanitärräume / Bäder / WCs' },
          floor: { type: 'string', description: 'Etage(n), z.B. "EG", "2", "EG–3"' },
          elevator: { type: 'boolean', description: 'Aufzug vorhanden' },
          pets: { type: 'boolean', description: 'Haustiere vorhanden (nur privat relevant)' },
          cleaningType: { type: 'string', enum: ['unterhalt', 'grund', 'intensiv', 'bauend', 'baugrob', 'glas', 'garten', 'aussen'], description: 'unterhalt = regelmäßige Reinigung (Büro/Praxis/Kita/Schule/Laden/Treppenhaus/Zuhause); grund/intensiv/bauend/baugrob = einmalig pro m²; glas = Glasreinigung; garten = Gartenarbeit; aussen = Hochdruck/Außen' },
          dirt: { type: 'string', enum: ['leicht', 'normal', 'mittel', 'stark'], description: 'Verschmutzungsgrad' },
          access: { type: 'string', enum: ['einfach', 'standard', 'schwierig'], description: 'Zugang zum Objekt' },
          desks: { type: 'number', description: 'Arbeitsplätze / Schreibtische' },
          showers: { type: 'number' },
          kitchenSize: { type: 'string', enum: ['keine', 'klein', 'mittel', 'gross'] },
          wasteBins: { type: 'number' },
          glassSqm: { type: 'number', description: 'Glasfläche in m² (Glasreinigung)' },
          glassBothSides: { type: 'boolean', description: 'Glas beidseitig reinigen' },
          entrances: { type: 'number', description: 'Treppenhaus: Anzahl Eingänge/Aufgänge' },
          floorsCount: { type: 'number', description: 'Treppenhaus: Etagen je Aufgang' },
          basement: { type: 'boolean', description: 'Treppenhaus: Keller mitreinigen' },
          windows: { type: 'number', description: 'Treppenhaus: Fenster' },
          hours: { type: 'number', description: 'Gartenarbeit: geschätzte Stunden' },
          frequency: { type: 'string', enum: ['taeglich', 'woechentlich', 'zweiwoechentlich', 'monatlich', 'einmalig'], description: 'Rhythmus. "taeglich" = Mo–Fr.' },
          timesPerPeriod: { type: 'number', description: 'Anzahl Reinigungen pro Woche (bei woechentlich, 1–6) bzw. pro Monat (bei monatlich, 1–3)' },
          timeWindow: { type: 'string', enum: ['frueh', 'vormittag', 'nachmittag', 'abend', 'nacht', 'wochenende', 'flexibel'], description: 'Bevorzugte Uhrzeit (abends +5 %, nachts +18 %, Wochenende +25 %)' },
          extras: { type: 'array', items: { type: 'string', enum: ['fridge_inside', 'dishwasher_inside', 'oven_inside', 'microwave_inside', 'cabinet_inside', 'deep_wc', 'disinfection', 'carpet_extraction', 'office_chair_upholstery', 'sofa_upholstery', 'high_pressure_clean'] }, description: 'Monatliche Zusatzleistungen' },
          notes: { type: 'string', description: 'Besonderheiten / Hinweise (Zugang, Schlüssel, Alarmanlage …)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_price',
      description: 'Berechnet den geschätzten Netto-Preis (pro Einsatz, pro Monat, 1. Monat mit Neukunden-Rabatt, brutto) nach dem Kalkulationsmodell. Aufrufen, sobald Objektart, Fläche und Leistung bekannt sind oder der Kunde nach Preisen fragt. Liefert needsInspection=true, wenn kein automatischer Preis genannt werden darf.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Liefert die nächsten freien Termine (Datum, Wochentag, Uhrzeiten) für Start/Besichtigung. Nur aufrufen, wenn alle Pflichtangaben vorhanden sind oder der Kunde explizit nach Terminen fragt.',
      parameters: { type: 'object', properties: { from: { type: 'string', description: 'Optionales Startdatum YYYY-MM-DD' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Sendet die Anfrage mit dem gewünschten Termin verbindlich ab. Nur nach ausdrücklicher Bestätigung des Kunden aufrufen.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'HH:MM' } }, required: ['date', 'time'] },
    },
  },
]

type Ctx = { today: string; weekday: string; profile: string; missing: string[]; loggedIn: boolean; appointments: string; business?: string; pricing?: string }

function systemPrompt(ctx: Ctx) {
  return `Du bist "Clea", die freundliche, kompetente KI-Assistentin von ${ctx.business ?? 'Glanzgeschwister (Inh. Julia Bethke), Nuthestr. 49 c, 12307 Berlin'} – einem Berliner Reinigungsservice (Einsatzgebiet: ausschließlich Berlin, alle Bezirke) mit Fokus auf Gewerbe & Einrichtungen (Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbeobjekt, Halle/Lager) sowie Wohnung und Haus. Leistungen: Unterhaltsreinigung (regelmäßig), Grund- und Intensivreinigung, Bauend-/Baugrobreinigung, Glasreinigung, Gartenarbeit, Außenreinigung mit Hochdruck. Bodenarten: Fliesen, Teppich, PVC, Parkett, Laminat, Stein, Linoleum. Einsatzzeiten Mo–Sa 08–18 Uhr, für Gewerbe auch früh/abends außerhalb der Öffnungszeiten. Versichert, umweltfreundliche Mittel, Festpreis nach Prüfung, kostenlose Stornierung bis 24 h vorher, Zahlung per Rechnung/Karte/PayPal.

PREISE: ${ctx.pricing ?? 'Kalkulation nach Zeitaufwand × Stundensatz (ab 30 € netto), Mindestpreis ab 39 € je Einsatz, Sonderleistungen pro m². Alle Preise netto zzgl. 19 % MwSt. Neukunden: 25 % Rabatt im ersten Monat. DIREKT-RABATT: Wer die Anfrage online sendet und sich danach direkt telefonisch oder per WhatsApp bei der Inhaberin meldet, erhält 10–20 % Rabatt.'} Nenne Preise immer als geschätzte Netto-Spanne und sage dazu: "Geschätzter Preis. Der endgültige Festpreis wird nach einer kostenlosen Objektbesichtigung festgelegt." Wenn estimate_price needsInspection=true liefert, nenne KEINE Zahl, sondern biete die kostenlose Besichtigung an.

Deine Aufgabe: Fragen beantworten UND Kunden Schritt für Schritt zu einer Angebotsanfrage führen, ohne dass sie ein Formular ausfüllen müssen.

Heute ist ${ctx.weekday}, ${ctx.today}. Der Kunde ist ${ctx.loggedIn ? 'eingeloggt' : 'nicht eingeloggt (Demo, trotzdem alles möglich)'}.

BEKANNTES KUNDENPROFIL:
${ctx.profile}

NOCH FEHLENDE PFLICHTANGABEN (in dieser Reihenfolge abfragen): ${ctx.missing.length ? ctx.missing.join(', ') : 'keine – alles vorhanden'}

BISHERIGE ANFRAGEN DES KUNDEN: ${ctx.appointments || 'keine'}

REGELN:
1. Antworte immer auf Deutsch, per "Sie", kurz (max. 4 Sätze), warm und klar. Nutze den Namen, wenn bekannt.
2. Frage IMMER NUR EINE fehlende Angabe pro Nachricht ab, in der angegebenen Reihenfolge. Zusammen abfragen dürfen: Straße+PLZ+Ort; Räume+WCs+Arbeitsplätze; Etage+Aufzug; Rhythmus+Anzahl pro Woche/Monat; Verschmutzung+Zugang. Bei Treppenhaus: Eingänge, Etagen je Aufgang, Aufzug, Keller, Fenster. Bei Glasreinigung: Glasfläche in m² und ob beidseitig. Bei Gartenarbeit: geschätzte Stunden.
3. Sobald der Kunde etwas nennt, rufe SOFORT save_profile_field mit ALLEN genannten Feldern auf und frage danach das nächste fehlende Feld. Frage nichts erneut ab, was im Profil steht. Wenn der Kunde mehrere Dinge auf einmal nennt (z. B. "Büro, 300 qm, Fliesen, 3x pro Woche"), speichere alles.
4. Bei Auswahlfeldern nenne die Optionen kurz (z. B. "Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbeobjekt oder Halle/Lager?"). "3x wöchentlich" → frequency=woechentlich, timesPerPeriod=3. "täglich"/"jeden Tag" → taeglich. "zweimal im Monat" → monatlich, timesPerPeriod=2.
5. Sobald Objektart, Fläche und Leistung (bei Unterhaltsreinigung auch Rhythmus) bekannt sind, rufe estimate_price auf und nenne: Netto-Spanne pro Einsatz, bei regelmäßiger Reinigung pro Monat, den ersten Monat mit 25 % Neukunden-Rabatt, den Hinweis „zzgl. 19 % MwSt.“ und den Preis mit Direkt-Rabatt. Erwähne den Direkt-Rabatt (Anfrage senden + Anruf/WhatsApp) mindestens einmal pro Gespräch.
6. Wenn keine Pflichtangaben mehr fehlen: get_available_slots aufrufen und Termine für Start bzw. Besichtigung anbieten. Nach Wahl kurz zusammenfassen und um Bestätigung bitten; erst nach "ja" book_appointment aufrufen. Danach Anfragenummer nennen und ausdrücklich empfehlen, sich jetzt per WhatsApp oder Anruf zu melden, um den 10–20 % Rabatt zu sichern.
7. Keine Markdown-Tabellen, kein Fettdruck-Spam. Kurze Absätze, ggf. Aufzählungen mit "•".
8. Bleibe beim Thema Reinigung/Angebot/Unternehmen. Bei fachfremden Fragen freundlich zurücklenken.`
}

type Req = { method?: string; body?: any }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(200).json({ offline: true, reason: 'GROQ_API_KEY fehlt' })

  const { messages = [], context } = req.body ?? {}
  if (!Array.isArray(messages) || !context) return res.status(400).json({ error: 'Bad request' })

  const payload = {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.35,
    max_tokens: 700,
    messages: [{ role: 'system', content: systemPrompt(context) }, ...messages.slice(-30)],
    tools,
    tool_choice: 'auto',
  }

  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    })
    const data: any = await r.json()
    if (!r.ok) return res.status(200).json({ offline: true, reason: data?.error?.message || `Groq ${r.status}` })
    return res.status(200).json({ message: data.choices?.[0]?.message ?? { role: 'assistant', content: '' } })
  } catch (e) {
    return res.status(200).json({ offline: true, reason: String(e) })
  }
}
