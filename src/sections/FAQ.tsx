import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'
export const faqs = [
  { q: 'Wie wird der Preis festgelegt?', a: 'Richtwert sind ca. 1,30–1,45 € pro m² und Reinigung. Sie geben Objektart, Fläche, Bodenarten und Rhythmus an – online oder im Chat – und sehen sofort den ungefähren Preis pro Reinigung und pro Monat. Inhaberin Julia Bethke prüft Ihre Angaben und bestätigt den Festpreis.' },
  { q: 'Wie bekomme ich die 10–20 % Direkt-Rabatt?', a: 'Ganz einfach: Anfrage online senden und sich danach direkt per WhatsApp oder Anruf bei uns melden – mit Ihrer Anfragenummer. Sie erhalten dann Ihr Angebot mit 10–20 % Rabatt.' },
  { q: 'Welche Objekte reinigen Sie?', a: 'Büros, Praxen, Kitas, Schulen, Treppenhäuser, Gewerbeobjekte sowie Hallen und Lager – und natürlich Wohnungen und Häuser. Die Reinigungsmittel stimmen wir auf Ihre Böden ab: Fliesen, Teppich, PVC, Parkett, Laminat, Stein oder Linoleum.' },
  { q: 'Muss ich Reinigungsmittel bereitstellen?', a: 'Nein. Unser Team bringt alle Geräte und umweltfreundlichen, geruchsneutralen Mittel mit. Wenn Sie eigene Produkte wünschen, vermerken Sie das einfach in den Hinweisen.' },
  { q: 'Kann ich kurzfristig stornieren oder verschieben?', a: 'Ja, bis 24 Stunden vor dem Termin kostenlos – direkt unter „Mein Konto“ oder im Chat mit Clea.' },
  { q: 'Sind Ihre Mitarbeitenden versichert?', a: 'Selbstverständlich. Alle Teams sind fest angestellt, geschult und über unsere Betriebshaftpflicht bis 5 Mio. € versichert.' },
  { q: 'Was passiert mit meinen Daten?', a: 'In dieser Demo werden alle Daten ausschließlich lokal in Ihrem Browser gespeichert. In der Live-Version gelten DSGVO-konforme Prozesse mit Servern in Deutschland.' },
  { q: 'Wie funktioniert die Buchung mit Clea?', a: 'Clea kennt Ihr Profil. Fehlt eine Angabe, fragt sie Schritt für Schritt nach – Adresse, Fläche, Wünsche – und zeigt Ihnen anschließend freie Termine. Sie wählen, Clea bucht.' },
]
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="section">
      <div className="container-x grid lg:grid-cols-[1fr_1.4fr] gap-10">
        <div>
          <Reveal><span className="eyebrow">FAQ</span></Reveal>
          <TextReveal text="Häufige Fragen." className="mt-4 text-4xl sm:text-5xl font-black" />
          <Reveal delay={0.15}><p className="mt-4 text-muted">Noch etwas unklar? Clea beantwortet Ihre Fragen rund um die Uhr im Chat.</p></Reveal>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="glass overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-start font-display font-bold" aria-expanded={open === i}>
                  {f.q}<motion.span animate={{ rotate: open === i ? 45 : 0 }} className="w-8 h-8 shrink-0 rounded-full bg-cyan/15 text-cyan-deep grid place-items-center"><Plus size={16} /></motion.span>
                </button>
                <AnimatePresence initial={false}>{open === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}><p className="px-5 pb-5 text-sm text-muted leading-relaxed">{f.a}</p></motion.div>}</AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
