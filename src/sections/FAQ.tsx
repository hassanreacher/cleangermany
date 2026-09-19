import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'
import { business } from '@/lib/config'

export const faqs = [
  { q: 'Wie komme ich zu meinem Angebot?', a: `Sie beschreiben Ihr Objekt in 2 Minuten – online oder im Chat mit Clea. ${business.owner} prüft Ihre Angaben, vereinbart bei Bedarf eine kostenlose Besichtigung und sendet Ihnen ein schriftliches Angebot mit Festpreis. Kostenlos und unverbindlich.` },
  { q: `Wie bekomme ich die ${business.directDiscount} % Direkt-Rabatt?`, a: `Ganz einfach: Anfrage online senden und sich danach direkt per WhatsApp oder Anruf bei uns melden – mit Ihrer Anfragenummer. Sie erhalten dann Ihr Angebot mit ${business.directDiscount} % Rabatt.` },
  { q: 'In welchen Gebieten sind Sie tätig?', a: 'Wir reinigen ausschließlich in Berlin – in allen Bezirken, von Lichtenrade bis Pankow. Unser Standort ist die Nuthestr. 49 c in 12307 Berlin.' },
  { q: 'Welche Objekte reinigen Sie?', a: 'Büros, Praxen, Kitas, Schulen, Treppenhäuser, Gewerbeobjekte sowie Hallen und Lager – und natürlich Wohnungen und Häuser. Die Reinigungsmittel stimmen wir auf Ihre Böden ab: Fliesen, Teppich, PVC, Parkett, Laminat, Stein oder Linoleum.' },
  { q: 'Muss ich Reinigungsmittel bereitstellen?', a: 'Nein. Unser Team bringt alle Geräte und umweltfreundlichen, geruchsneutralen Mittel mit. Wenn Sie eigene Produkte wünschen, vermerken Sie das einfach in den Hinweisen.' },
  { q: 'Kann ich kurzfristig stornieren oder verschieben?', a: 'Ja, bis 24 Stunden vor dem Termin kostenlos – in Ihrem Konto, per WhatsApp, Anruf oder im Chat mit Clea.' },
  { q: 'Sind Ihre Mitarbeitenden versichert?', a: 'Selbstverständlich. Alle Teams sind fest angestellt, geschult und über unsere Betriebshaftpflicht versichert.' },
  { q: 'Wofür brauche ich ein Kundenkonto?', a: 'Im Konto sehen Sie den Status Ihrer Anfragen, Ihr zugewiesenes Team, können Termine stornieren und nach der Reinigung eine Bewertung abgeben. Anfragen sind aber auch ohne Konto möglich.' },
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
