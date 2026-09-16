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
      description: 'Speichert eine Angabe des Kunden im Profil. Rufe dies sofort auf, wenn der Kunde eine Information nennt. Mehrere Felder auf einmal sind erlaubt.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vollständiger Name' },
          phone: { type: 'string' },
          email: { type: 'string' },
          street: { type: 'string', description: 'Straße und Hausnummer' },
          zip: { type: 'string', description: 'Postleitzahl (5 Ziffern)' },
          city: { type: 'string' },
          propertyType: { type: 'string', enum: ['wohnung', 'haus', 'buero', 'praxis'] },
          sizeSqm: { type: 'number', description: 'Fläche in Quadratmetern' },
          rooms: { type: 'number', description: 'Anzahl Zimmer' },
          bathrooms: { type: 'number', description: 'Anzahl Bäder' },
          floor: { type: 'string', description: 'Etage, z.B. "EG", "2", "4"' },
          elevator: { type: 'boolean', description: 'Aufzug vorhanden' },
          pets: { type: 'boolean', description: 'Haustiere vorhanden' },
          cleaningType: { type: 'string', enum: ['unterhalt', 'grund', 'umzug', 'fenster', 'buero'] },
          frequency: { type: 'string', enum: ['einmalig', 'woechentlich', 'zweiwoechentlich', 'monatlich'] },
          extras: { type: 'array', items: { type: 'string', enum: ['fenster', 'backofen', 'kuehlschrank', 'buegeln', 'balkon', 'keller'] } },
          notes: { type: 'string', description: 'Besonderheiten / Hinweise' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Liefert die nächsten freien Termine (Datum, Wochentag, Uhrzeiten). Nur aufrufen, wenn alle Pflichtangaben vorhanden sind oder der Kunde explizit nach Terminen fragt.',
      parameters: { type: 'object', properties: { from: { type: 'string', description: 'Optionales Startdatum YYYY-MM-DD' } } },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Bucht den gewünschten Termin verbindlich als Anfrage. Nur nach ausdrücklicher Bestätigung des Kunden aufrufen.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'HH:MM' } }, required: ['date', 'time'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_price',
      description: 'Berechnet eine unverbindliche Preisspanne auf Basis der Profilangaben.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

function systemPrompt(ctx: { today: string; weekday: string; profile: string; missing: string[]; loggedIn: boolean; appointments: string }) {
  return `Du bist "Clea", die freundliche KI-Assistentin von CLEAN – Let it shine, einem Reinigungsservice in Deutschland (Wohnung, Haus, Büro, Praxis; Unterhalts-, Grund-, Umzugs-, Fenster- und Büroreinigung; bundesweit in allen großen Städten; Mo–Sa 08:00–18:00; versichert, Festpreise, umweltfreundliche Reinigungsmittel; Bezahlung nach der Reinigung per Rechnung, Karte oder PayPal; kostenlose Stornierung bis 24 h vorher).

Deine Aufgabe: Fragen beantworten UND Kunden Schritt für Schritt zu einem Termin führen, ohne dass sie ein Formular ausfüllen müssen.

Heute ist ${ctx.weekday}, ${ctx.today}. Der Kunde ist ${ctx.loggedIn ? 'eingeloggt' : 'nicht eingeloggt (Demo, trotzdem alles möglich)'}.

BEKANNTES KUNDENPROFIL:
${ctx.profile}

NOCH FEHLENDE PFLICHTANGABEN (in dieser Reihenfolge abfragen): ${ctx.missing.length ? ctx.missing.join(', ') : 'keine – alles vorhanden'}

BISHERIGE TERMINE DES KUNDEN: ${ctx.appointments || 'keine'}

REGELN:
1. Antworte immer auf Deutsch, per "Sie", kurz, warm und klar. Nutze den Namen des Kunden, wenn bekannt (z.B. "Hallo Anna, ...").
2. Frage IMMER NUR EINE fehlende Angabe pro Nachricht ab, in der angegebenen Reihenfolge. Beispiel: "Hallo Anna, können Sie mir bitte die Adresse des Objekts nennen (Straße, PLZ, Ort)?" – Straße, PLZ und Ort dürfen zusammen abgefragt werden. Ebenso Zimmer und Bäder zusammen, Etage und Aufzug zusammen.
3. Sobald der Kunde eine Angabe macht, rufe SOFORT save_profile_field mit allen genannten Feldern auf und fahre dann mit der nächsten fehlenden Angabe fort. Frage nichts erneut ab, was im Profil schon steht.
4. Erkläre bei Bedarf kurz, warum du eine Angabe brauchst (z.B. Fläche → Zeitaufwand & Preis). Biete bei Auswahlfeldern die Optionen an.
5. Wenn keine Pflichtangaben mehr fehlen: rufe estimate_price und danach get_available_slots auf und präsentiere die freien Termine übersichtlich (Wochentag, Datum, Uhrzeiten). Bitte den Kunden, einen zu wählen.
6. Wenn der Kunde einen Termin wählt, fasse kurz zusammen (Datum, Uhrzeit, Adresse, Leistung) und frage nach Bestätigung. Erst nach "ja"/Bestätigung book_appointment aufrufen. Danach Buchungsnummer nennen und erklären, dass der Inhaber die Angaben prüft und den endgültigen Preis per E-Mail bestätigt.
7. Der endgültige Preis wird vom Inhaber anhand der Angaben festgelegt; nenne nur Preisspannen aus estimate_price als unverbindlich.
8. Keine Markdown-Tabellen. Kurze Absätze, ggf. einfache Aufzählungen mit "•".
9. Bleibe beim Thema Reinigung/Termine/Unternehmen. Bei unpassenden Anfragen freundlich zurücklenken.`
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
    temperature: 0.4,
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
