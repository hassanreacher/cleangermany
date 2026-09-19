# Glanzgeschwister · Präzise. Sicher. Zuverlässig.

Website mit Anfrage-Assistent, Kundenkonto, Team-Bereich und Inhaber-Dashboard für **Glanzgeschwister, Inh. Julia Bethke, Nuthestr. 49 c, 12307 Berlin**.
Alle Daten (Anfragen, Nutzer, Rollen, Zuweisungen, Bewertungen, gesperrte Zeitfenster) liegen in **Supabase** (Postgres + Auth + Realtime).
Die Website zeigt **keine Preise** – sie sammelt alle Angaben, die Inhaberin erstellt das Angebot persönlich (das Preismodell aus
`Cleaning_Pricing_Web_Package` dient im Dashboard nur als interne Kalkulationshilfe).

## Einrichtung (einmalig, ca. 15 Minuten)

1. **Supabase-Projekt anlegen** (https://supabase.com, Region Frankfurt).
2. **SQL ausführen:** Dashboard → *SQL Editor* → Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen → *Run*.
   Das legt Tabellen, Rollen, Trigger, Sicherheitsregeln (RLS) und Funktionen an.
3. **Eigene SMTP für Auth-Mails:** Supabase → *Authentication → SMTP Settings* → eigenen Mailserver eintragen
   (z. B. GMX: `mail.gmx.net`, Port 587, Benutzer = E-Mail, Absender `Glanzgeschwister@gmx.de`).
   Damit kommen Registrierungs-Bestätigungen und Passwort-Resets von Ihrer Adresse.
   Unter *Authentication → URL Configuration* die Site-URL (`https://cleangermany.vercel.app`) und `…/login` als Redirect eintragen.
4. **Umgebungsvariablen** (lokal in `.env`, auf Vercel unter *Settings → Environment Variables*) – Vorlage: [`.env.example`](.env.example):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Supabase → *Project Settings → API*)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (nur Server – für die E-Mail-Funktion)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_EMAIL`, `SITE_URL` (Anfrage-/Zuweisungs-/Status-/Bewertungs-Mails aus `api/submit.ts` und `api/notify.ts`).
     GMX: Host `mail.gmx.net`, Port `465` (SSL/TLS) – der Code fällt automatisch auf `587` (STARTTLS) zurück. Wichtig: In den GMX-Einstellungen
     unter *Einstellungen → POP3/IMAP Abruf* den **Zugriff über externe Programme aktivieren**, sonst antwortet GMX mit `535 Authentication credentials invalid`.
     Die Absenderadresse wird immer auf `SMTP_USER` gesetzt (GMX akzeptiert keine abweichende Absenderadresse), `SMTP_FROM` liefert nur den Anzeigenamen.
   - `GROQ_API_KEY` (KI-Assistentin Clea; ohne Key läuft ein regelbasierter Assistenz-Modus)
5. **Admin freischalten:** auf der Website registrieren, E-Mail bestätigen, dann im SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'glanzgeschwister@gmx.de';
   ```
6. **Team anlegen:** Teammitglieder registrieren sich selbst; im Dashboard → *Team & Nutzer* Rolle auf „Team“ setzen.

## Rollen & Bereiche

| Rolle | Bereich | Kann |
|---|---|---|
| Gast | `/termin`, Chat | Anfrage senden (ohne Konto), Bewertung einreichen |
| Kunde (`client`) | `/konto` | eigene Anfragen & Status sehen, zugewiesenes Team, stornieren, Profil, Bewertung nach Abschluss |
| Team (`team`) | `/team` | zugewiesene Einsätze mit allen Details, Route, Kunde anrufen, „Einsatz starten“ / „Erledigt“ |
| Admin (`admin`) | `/dashboard` | alle Anfragen, Status, Festpreis (intern), Teammitglied zuweisen, Notizen, Verlauf, Wochenkalender mit Sperrzeiten, Rollen verwalten, Bewertungen freigeben, KPIs |

Anmeldung leitet automatisch in den passenden Bereich. Gast-Anfragen werden beim späteren Registrieren mit derselben E-Mail dem Konto zugeordnet.

## E-Mails

| Ereignis | Empfänger | Absender |
|---|---|---|
| Registrierung / Passwort vergessen | Nutzer | Supabase Auth mit Ihrer SMTP |
| Neue Anfrage | Inhaberin + Bestätigung an Kunde (mit 25 % WhatsApp-Hinweis) | `api/notify.ts` (Ihre SMTP) |
| Teammitglied zugewiesen | Teammitglied + Kunde | `api/notify.ts` |
| Statusänderung (Angebot, bestätigt, erledigt, storniert) | Kunde (bzw. Inhaberin bei Kunden-Storno) | `api/notify.ts` |
| Neue Bewertung | Inhaberin (Freigabe im Dashboard) | `api/notify.ts` |

## Lokal starten

```bash
npm install
cp .env.example .env      # Werte eintragen
npm run dev               # http://localhost:5173
npm run build
```

## Struktur

```
supabase/schema.sql        komplettes Datenbankschema (Tabellen, RLS, Trigger, RPCs)
api/notify.ts              E-Mail-Versand (nodemailer, eigene SMTP)
api/chat.ts                Groq-Proxy für Clea (Tools: Angaben speichern, Termine, Anfrage senden)
src/lib/supabase.ts        Client + Typen
src/lib/auth.tsx           Auth-Context (Session, Profil, Rolle)
src/lib/orders.ts          Datenzugriff: Anfragen, Zuweisung, Bewertungen, Zeitfenster
src/lib/store.ts           lokaler Formular-Entwurf (Wizard + Clea teilen sich die Daten)
src/lib/pricing*.ts        interne Kalkulationshilfe (nur Dashboard)
src/pages/                 Home, Leistungen, Termin (Wizard), Login, Konto, Team, Dashboard, Rechtliches
src/components/Loading.tsx Lade-Animationen (Logo-Pulse, Skeletons)
```

Technik: Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase JS · Recharts · lucide-react · Groq API · nodemailer
