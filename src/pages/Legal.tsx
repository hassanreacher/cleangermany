import { Reveal } from '@/components/motion'
import { business } from '@/lib/config'
export function Impressum() {
  return (
    <section className="pt-36 pb-20"><div className="container-x max-w-3xl"><Reveal><div className="glass p-8 prose-sm">
      <h1 className="text-3xl font-black">Impressum</h1>
      <p className="text-muted mt-2">Angaben gemäß § 5 TMG (Demo-Inhalte)</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p><b>{business.company}</b><br />Inh. {business.owner}<br />{business.street}<br />{business.zip} {business.city}</p>
        <p>Vertreten durch: {business.owner} ({business.ownerTitle})<br />Telefon: {business.phoneDisplay}<br />E-Mail: {business.email}</p>
        <p>Einzelunternehmen<br />USt-IdNr.: DE000000000 (Platzhalter)</p>
        <p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: {business.owner}, Anschrift wie oben.</p>
        <p className="text-muted">Hinweis: Demo-Website – Telefonnummer, E-Mail und USt-IdNr. sind Platzhalter.</p>
      </div>
    </div></Reveal></div></section>
  )
}
export function Datenschutz() {
  return (
    <section className="pt-36 pb-20"><div className="container-x max-w-3xl"><Reveal><div className="glass p-8">
      <h1 className="text-3xl font-black">Datenschutzerklärung</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
        <p><b className="text-text">1. Verantwortlicher</b><br />{business.company}, Inh. {business.owner}, {business.street}, {business.zip} {business.city}, {business.email}</p>
        <p><b className="text-text">2. Demo-Betrieb</b><br />Diese Website ist eine Demonstration. Alle von Ihnen eingegebenen Daten (Profil, Termine) werden ausschließlich lokal in Ihrem Browser (localStorage) gespeichert und nicht an einen Server übertragen.</p>
        <p><b className="text-text">3. KI-Assistentin</b><br />Chat-Nachrichten werden zur Beantwortung an den KI-Dienst Groq (Groq, Inc., USA) übermittelt, sofern ein API-Schlüssel konfiguriert ist. Es werden nur die im Chat eingegebenen Inhalte sowie die für die Terminbuchung nötigen Profilangaben übermittelt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
        <p><b className="text-text">4. Hosting</b><br />Die Website wird bei Vercel Inc. gehostet. Beim Aufruf werden technisch notwendige Zugriffsdaten (IP-Adresse, Zeitpunkt, User-Agent) verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p>
        <p><b className="text-text">5. Ihre Rechte</b><br />Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei einer Aufsichtsbehörde.</p>
      </div>
    </div></Reveal></div></section>
  )
}
export function NotFound() {
  return <section className="pt-40 pb-20 text-center"><div className="container-x"><h1 className="text-6xl font-black">404</h1><p className="text-muted mt-3">Diese Seite wurde wohl weggewischt.</p><a href="/" className="btn btn-primary mt-6">Zur Startseite</a></div></section>
}
