# CLEAN – Let it shine · Demo-Website

Moderne, animierte React-Website für einen deutschen Reinigungsservice (Wohnung, Haus, Büro, Praxis) – inklusive
Buchungs-Assistent, Kalender, Inhaber-Dashboard und KI-Assistentin **Clea** (Groq). Alles läuft **ohne Datenbank**:
Profil und Termine werden im Browser (localStorage) gespeichert, Beispieldaten sind vorinstalliert.

## Features

- **Startseite** mit transparent-animiertem Seifenblasen-Hintergrund (Canvas, reagiert auf Maus, Blasen platzen bei Klick),
  Lenis-Smooth-Scrolling, Framer-Motion-Reveals, Vorher/Nachher-Wischer, Preisrechner, Ablauf, Kundenstimmen, FAQ.
- **Full-Screen-Menü**: animierter Hamburger → X, kreisförmige Clip-Path-Enthüllung vom Button aus, GSAP-gestaffelte 3D-Links
  mit Indexnummern, Kontakt/Social-Footer, Scroll-Lock, Esc schließt, RTL-tauglich, Light/Dark-Theme.
- **Termin buchen** (`/termin`): 6-Schritte-Wizard – Ort (PLZ → Stadt automatisch, animierte Karte), Objekt (Slider mit
  Flächen-Visualisierung, Zimmer/Bäder, Etage/Aufzug/Haustiere), Wünsche, Kontakt, Kalender mit freien Slots, Prüfung + Konfetti.
- **Mein Konto** (`/konto`): Profil-Vollständigkeit, Termine, Angebot annehmen/ablehnen, stornieren.
- **Dashboard** (`/dashboard`, Demo-Inhaber): KPIs, Umsatz- und Leistungsmix-Charts, Anfragen mit **Preisfestlegung**
  (Ort, Fläche, Angaben des Kunden sichtbar → Festpreis → Angebot senden), Wochenkalender mit Sperrung von Zeitfenstern,
  Kunden, Team, Einstellungen.
- **Clea – KI-Chat** (Groq, `llama-3.3-70b-versatile`, Tool-Calling): beantwortet Fragen, prüft das Kundenprofil, fragt
  fehlende Angaben **Schritt für Schritt** ab („Hallo Anna, können Sie mir bitte die Adresse nennen?“), speichert sie,
  zeigt freie Termine und bucht nach Bestätigung. Ohne API-Key läuft ein vollständiger **Offline-Demo-Modus** mit derselben Logik.
- Vollständig auf Deutsch, responsive (iPhone-Safe-Areas, 100dvh), Light/Dark, `prefers-reduced-motion`.

## Lokal starten

```bash
npm install
cp .env.example .env      # GROQ_API_KEY eintragen (optional)
npm run dev               # http://localhost:5173  (API-Route /api/chat läuft lokal mit)
npm run build             # Produktions-Build nach dist/
```

## Deployment auf Vercel

1. Repository in Vercel importieren (Framework: **Vite** wird automatisch erkannt).
2. Environment Variable `GROQ_API_KEY` setzen (Key von https://console.groq.com). Optional `GROQ_MODEL`.
3. Deploy. Die Serverless Function `api/chat.ts` proxied Anfragen an Groq – der Key bleibt serverseitig.

Ohne `GROQ_API_KEY` funktioniert die Website inklusive Chat weiterhin (Offline-Demo-Modus, Hinweis im Chat-Header).

## Demo-Zugänge

| Rolle   | Login                              |
|---------|------------------------------------|
| Kunde   | beliebige E-Mail, z. B. `anna.schneider@example.de` |
| Inhaber | `inhaber@clean-shine.de` (oder jede E-Mail mit „inhaber“/„admin“) |

Auf `/login` gibt es Ein-Klick-Buttons für beide Rollen. „Demo zurücksetzen“ (Konto/Einstellungen) stellt die Beispieldaten wieder her.

## Struktur

```
api/chat.ts            Vercel Serverless Function (Groq, Tools, System-Prompt)
src/lib/chat.ts        Chat-Engine: Tool-Ausführung im Browser + Offline-Modus
src/lib/store.ts       localStorage-Store (Profil, Termine, gesperrte Slots)
src/lib/slots.ts       Verfügbarkeit (Mo–Sa 08–18 Uhr, 2-Stunden-Fenster)
src/lib/pricing.ts     Preisspanne & Dauer
src/components/        Hintergrund, Menü, Navbar, Kalender, Chat-Widget, UI
src/sections/          Startseiten-Abschnitte
src/pages/             Home, Leistungen, Termin, Konto, Dashboard, Login, Rechtliches
```

## Technik

Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · GSAP · Lenis · Recharts · lucide-react · Groq API
