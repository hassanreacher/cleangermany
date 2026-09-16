import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MessageSquareText, CalendarClock, Sparkles } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'

const steps = [
  { icon: MessageSquareText, title: 'Angaben in 2 Minuten', text: 'Adresse, Fläche, Objektart und Wünsche – im Formular oder einfach im Chat mit Clea. Ihr Profil merkt sich alles für das nächste Mal.' },
  { icon: CalendarClock, title: 'Termin wählen, Preis erhalten', text: 'Wählen Sie aus freien Zeitfenstern Mo–Sa. Unser Inhaber prüft Ihre Angaben und bestätigt Ihren Festpreis – ohne Überraschungen.' },
  { icon: Sparkles, title: 'Zurücklehnen & glänzen lassen', text: 'Ein festes Team kommt pünktlich mit allen Mitteln. Nach der Reinigung bezahlen Sie bequem per Rechnung, Karte oder PayPal.' },
]

export function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])
  return (
    <section id="ablauf" className="section">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal><span className="eyebrow justify-center">So funktioniert’s</span></Reveal>
          <TextReveal text="Drei Schritte zum Glanz." className="mt-4 text-4xl sm:text-5xl font-black" />
        </div>
        <div ref={ref} className="relative mt-14 max-w-3xl mx-auto">
          <div className="absolute start-[27px] top-4 bottom-4 w-0.5 bg-line" />
          <motion.div style={{ scaleY }} className="absolute start-[27px] top-4 bottom-4 w-0.5 origin-top bg-gradient-to-b from-cyan to-cyan-deep" />
          <div className="space-y-10">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="flex gap-6 items-start">
                  <div className="relative z-10 w-14 h-14 shrink-0 rounded-full grid place-items-center text-white shadow-[0_10px_30px_-10px_var(--glow)]" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><s.icon size={22} /></div>
                  <div className="glass p-6 flex-1">
                    <div className="text-xs font-bold tracking-[.2em] text-cyan-deep">SCHRITT {i + 1}</div>
                    <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-muted text-sm leading-relaxed">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
