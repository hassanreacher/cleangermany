import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'
const list = [
  { n: 'Anna S.', c: 'Berlin', t: 'Ich habe den Termin komplett im Chat mit Clea gebucht – zwei Minuten, fertig. Das Team war pünktlich, freundlich und die Wohnung hat wirklich geglänzt.' },
  { n: 'Familie Müller', c: 'Köln', t: 'Mit zwei Kindern und Hund brauchen wir alle zwei Wochen Hilfe. Immer dasselbe Team, immer top. Der Festpreis ist fair und es gab nie Überraschungen.' },
  { n: 'Dr. Hoffmann', c: 'München', t: 'Für unsere Praxis brauchen wir Hygiene mit Nachweis. Glanzgeschwister liefert das zuverlässig außerhalb unserer Sprechzeiten. Sehr professionell.' },
  { n: 'Jonas F.', c: 'Stuttgart', t: 'Umzugsreinigung mit Kautionsgarantie – der Vermieter hatte nichts zu beanstanden. Ich habe die volle Kaution zurückbekommen.' },
  { n: 'Sophie B.', c: 'Frankfurt', t: 'Ich liebe, dass mein Profil alles speichert. Nachbuchen geht in 20 Sekunden. Und die Reinigungsmittel riechen nicht nach Chemie.' },
]
export function Testimonials() {
  return (
    <section className="section overflow-hidden">
      <div className="container-x">
        <Reveal><span className="eyebrow">Kundenstimmen</span></Reveal>
        <TextReveal text="Das sagen unsere Kund:innen." className="mt-4 text-4xl sm:text-5xl font-black max-w-2xl" />
      </div>
      <motion.div className="mt-12 cursor-grab active:cursor-grabbing" drag="x" dragConstraints={{ left: -1200, right: 0 }} dragElastic={0.08}>
        <div className="flex gap-5 px-4 sm:px-6 lg:px-[max(32px,calc((100vw-1200px)/2+32px))]">
          {list.map((r, i) => (
            <Reveal key={r.n} delay={i * 0.06} className="shrink-0 w-[300px] sm:w-[360px]">
              <div className="glass p-6 h-full flex flex-col">
                <Quote className="text-cyan" size={26} />
                <p className="mt-4 text-[15px] leading-relaxed flex-1">{r.t}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div><div className="font-display font-bold">{r.n}</div><div className="text-xs text-muted">{r.c}</div></div>
                  <div className="flex text-amber-400">{[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
