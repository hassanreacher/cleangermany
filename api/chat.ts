/**
 * Vercel Serverless Function – proxy to Groq (OpenAI-compatible chat completions with tool calling).
 * The API key never reaches the browser. Tools are *executed* in the browser (Supabase writes with the user's session),
 * this function only forwards messages and returns the assistant message (which may contain tool_calls).
 */
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const tools = [
  {
    type: 'function',
    function: {
      name: 'save_profile_field',
      description: 'Speichert Angaben des Kunden in der Anfrage. Rufe dies SOFORT auf, sobald der Kunde eine Information nennt – mehrere Felder auf einmal sind erlaubt und erwünscht.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vollständiger Name bzw. Firma + Ansprechperson' },
          phone: { type: 'string' },
          email: { type: 'string' },
          street: { type: 'string', description: 'Straße und Hausnummer des Objekts' },
          zip: { type: 'string', description: 'Postleitzahl (5 Ziffern, Berlin 10115–14199)' },
          city: { type: 'string' },
          propertyType: { type: 'string', enum: ['buero', 'praxis', 'kita', 'schule', 'treppenhaus', 'gewerbe', 'halle', 'wohnung', 'haus'] },
          sizeSqm: { type: 'number', description: 'Zu reinigende Fläche in Quadratmetern' },
          floorTypes: { type: 'array', items: { type: 'string', enum: ['fliesen', 'teppich', 'pvc', 'parkett', 'laminat', 'stein', 'linoleum', 'gemischt'] } },
          rooms: { type: 'number', description: 'Anzahl Räume / Zimmer' },
          bathrooms: { type: 'number', description: 'Anzahl WCs / Sanitärräume / Bäder' },
          desks: { type: 'number', description: 'Arbeitsplätze / Schreibtische' },
          showers: { type: 'number' },
          kitchenSize: { type: 'string', enum: ['keine', 'klein', 'mittel', 'gross'] },
          wasteBins: { type: 'number' },
          floor: { type: 'string', description: 'Etage(n), z.B. "EG", "2", "EG–3"' },
          elevator: { type: 'boolean' },
          pets: { type: 'boolean', description: 'Haustiere (nur privat relevant)' },
          cleaningType: { type: 'string', enum: ['unterhalt', 'grund', 'intensiv', 'bauend', 'baugrob', 'glas', 'garten', 'aussen'], description: 'unterhalt = regelmäßige Reinigung; grund/intensiv/bauend/baugrob = einmalig; glas = Glasreinigung; garten = Gartenarbeit; aussen = Hochdruck/Außen' },
          dirt: { type: 'string', enum: ['leicht', 'normal', 'mittel', 'stark'] },
          access: { type: 'string', enum: ['einfach', 'standard', 'schwierig'] },
          frequency: { type: 'string', enum: ['taeglich', 'woechentlich', 'zweiwoechentlich', 'monatlich', 'einmalig'], description: '"taeglich" = Mo–Fr' },
          timesPerPeriod: { type: 'number', description: 'Reinigungen pro Woche (woechentlich, 1–6) bzw. pro Monat (monatlich, 1–3)' },
          timeWindow: { type: 'string', enum: ['frueh', 'vormittag', 'nachmittag', 'abend', 'nacht', 'wochenende', 'flexibel'] },
          glassSqm: { type: 'number' }, glassBothSides: { type: 'boolean' },
          entrances: { type: 'number', description: 'Treppenhaus: Eingänge/Aufgänge' }, floorsCount: { type: 'number', description: 'Treppenhaus: Etagen je Aufgang' }, basement: { type: 'boolean' }, windows: { type: 'number' },
          hours: { type: 'number', description: 'Gartenarbeit: geschätzte Stunden' },
          extras: { type: 'array', items: { type: 'string', enum: ['fridge_inside', 'dishwasher_inside', 'oven_inside', 'microwave_inside', 'cabinet_inside', 'deep_wc', 'disinfection', 'carpet_extraction', 'office_chair_upholstery', 'sofa_upholstery', 'high_pressure_clean'] } },
          notes: { type: 'string', description: 'Besonderheiten / Hinweise (Zugang, Schlüssel, Alarmanlage …)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Liefert die nächsten freien Zeitfenster (Datum, Wochentag, Uhrzeiten) für Start bzw. kostenlose Besichtigung. Aufrufen, wenn alle Pflichtangaben vorhanden sind oder der Kunde nach Terminen fragt.',
      parameters: { type: 'object', properties: { from: { type: 'string', description: 'Optionales Startdatum YYYY-MM-DD' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'submit_request',
      description: 'Speichert die Anfrage verbindlich in der Datenbank (mit optionalem Wunschtermin). Nur nach ausdrücklicher Bestätigung des Kunden aufrufen.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'HH:MM' } } },
    },
  },
]

type Ctx = { today: string; weekday: string; profile: string; missing: string[]; business?: string; discount?: string }

function systemPrompt(ctx: Ctx) {
  return `Du bist "Clea", die freundliche, kompetente KI-Assistentin von ${ctx.business ?? 'Glanzgeschwister (Inh. Julia Bethke), Nuthestr. 49 c, 12307 Berlin'} – einem Berliner Reinigungsservice (Einsatzgebiet: ausschließlich Berlin) mit Fokus auf Gewerbe & Einrichtungen (Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbe/Laden, Halle/Lager) sowie Wohnung und Haus. Leistungen: Unterhaltsreinigung (regelmäßig), Grund- und Intensivreinigung, Bauend-/Baugrobreinigung, Glasreinigung, Gartenarbeit, Außenreinigung mit Hochdruck. Einsatzzeiten Mo–Sa 08–18 Uhr, für Gewerbe auch früh, abends, nachts oder am Wochenende. Versichert, umweltfreundliche Mittel, kostenlose Stornierung bis 24 h vorher.

PREISE: Du nennst NIEMALS Preise, Stundensätze oder Schätzungen – auch nicht auf Nachfrage. Antworte stattdessen: Das Angebot erstellt die Inhaberin persönlich nach Prüfung der Angaben, gern mit kostenloser Besichtigung, schriftlich und mit Festpreis. ${ctx.discount ?? '25 % Direkt-Rabatt, wenn sich der Kunde nach dem Absenden direkt per WhatsApp oder Anruf meldet.'}

Deine Aufgabe: Fragen beantworten UND Kunden Schritt für Schritt zu einer vollständigen Angebotsanfrage führen, die du am Ende mit submit_request speicherst.

Heute ist ${ctx.weekday}, ${ctx.today}.

BEKANNTE ANGABEN:
${ctx.profile}

NOCH FEHLENDE PFLICHTANGABEN (in dieser Reihenfolge abfragen): ${ctx.missing.length ? ctx.missing.join(', ') : 'keine – alles vorhanden'}

REGELN:
1. Antworte immer auf Deutsch, per "Sie", kurz (max. 4 Sätze), warm und klar. Nutze den Namen, wenn bekannt.
2. Frage IMMER NUR EINE fehlende Angabe pro Nachricht ab, in der angegebenen Reihenfolge. Zusammen abfragen dürfen: Straße+PLZ+Ort; Räume+WCs+Arbeitsplätze; Etage+Aufzug; Rhythmus+Anzahl pro Woche/Monat; Verschmutzung+Zugang. Bei Treppenhaus: Eingänge, Etagen je Aufgang, Aufzug, Keller, Fenster. Bei Glasreinigung: Glasfläche und ob beidseitig. Bei Gartenarbeit: geschätzte Stunden.
3. Sobald der Kunde etwas nennt, rufe SOFORT save_profile_field mit ALLEN genannten Feldern auf und frage danach das nächste fehlende Feld. Frage nichts erneut ab, was schon bekannt ist. Wenn der Kunde mehrere Dinge auf einmal nennt (z. B. "Büro, 300 qm, Fliesen, 3x pro Woche"), speichere alles.
4. Bei Auswahlfeldern nenne die Optionen kurz. "3x wöchentlich" → frequency=woechentlich, timesPerPeriod=3. "täglich" → taeglich. "zweimal im Monat" → monatlich, timesPerPeriod=2.
5. Wenn keine Pflichtangaben mehr fehlen: get_available_slots aufrufen und Wunschtermine für Start bzw. Besichtigung anbieten. Nach Wahl kurz zusammenfassen und um Bestätigung bitten; erst nach "ja" submit_request aufrufen. Danach Anfragenummer nennen, erklären, dass eine Bestätigung per E-Mail kommt und die Inhaberin sich innerhalb von 24 Stunden meldet – und ausdrücklich den Direkt-Rabatt per WhatsApp/Anruf empfehlen.
6. Keine Markdown-Tabellen, kein Fettdruck-Spam. Kurze Absätze, ggf. Aufzählungen mit "•".
7. Bleibe beim Thema Reinigung/Anfrage/Unternehmen. Bei fachfremden Fragen freundlich zurücklenken. Anfragen außerhalb Berlins freundlich ablehnen.`
}

type Req = { method?: string; body?: any }
type Res = { status: (c: number) => Res; json: (d: unknown) => void }

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(200).json({ offline: true, reason: 'GROQ_API_KEY fehlt' })
  const { messages = [], context } = req.body ?? {}
  if (!Array.isArray(messages) || !context) return res.status(400).json({ error: 'Bad request' })
  const payload = { model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.35, max_tokens: 700, messages: [{ role: 'system', content: systemPrompt(context) }, ...messages.slice(-30)], tools, tool_choice: 'auto' }
  try {
    const r = await fetch(GROQ_URL, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(payload) })
    const data: any = await r.json()
    if (!r.ok) return res.status(200).json({ offline: true, reason: data?.error?.message || `Groq ${r.status}` })
    return res.status(200).json({ message: data.choices?.[0]?.message ?? { role: 'assistant', content: '' } })
  } catch (e) {
    return res.status(200).json({ offline: true, reason: String(e) })
  }
}
