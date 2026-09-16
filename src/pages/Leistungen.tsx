import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal, TextReveal, fadeUp, stagger } from '@/components/motion'
import { services } from '@/sections/Services'
import { CTA } from '@/sections/CTA'

const details: Record<string, string[]> = {
  unterhalt: ['Staubwischen aller Oberflächen', 'Böden saugen & wischen', 'Bad & WC desinfizieren', 'Küche inkl. Arbeitsflächen', 'Müll entsorgen', 'Betten beziehen (optional)'],
  grund: ['Alles aus der Unterhaltsreinigung', 'Fugen & Fliesen intensiv', 'Fensterrahmen & Türen', 'Heizkörper & Lampen', 'Schränke innen & außen', 'Kalk & Fett entfernen'],
  umzug: ['Besenreine Übergabe garantiert', 'Backofen, Kühlschrank, Dunstabzug', 'Fenster innen & außen', 'Keller & Balkon', 'Übergabeprotokoll-Check', 'Kautionsgarantie'],
  fenster: ['Glas innen & außen streifenfrei', 'Rahmen & Fensterbänke', 'Rollläden & Jalousien', 'Wintergärten', 'Osmose-Verfahren bis 12 m', 'Auch Glasfassaden'],
  buero: ['Außerhalb der Öffnungszeiten', 'Sanitär & Teeküche', 'Desinfektion nach RKI', 'Feste Ansprechperson', 'Monatlicher Reinigungsnachweis', 'Materialbestellung optional'],
  polster: ['Sprühextraktion ohne Chemie', 'Sofa, Sessel, Matratzen', 'Teppiche & Läufer', 'Fleck- & Geruchsentfernung', 'Autositze', 'Trocken in 4–6 Stunden'],
}

export default function Leistungen() {
  return (
    <>
      <section className="pt-36 pb-10">
        <div className="container-x max-w-3xl">
          <Reveal><span className="eyebrow">Leistungen</span></Reveal>
          <TextReveal as="h1" text="Sauber ist nicht gleich sauber." className="mt-4 text-4xl sm:text-6xl font-black" />
          <Reveal delay={0.2}><p className="mt-5 text-lg text-muted">Jede Leistung folgt einer Checkliste, die unser Team nach der Reinigung mit Ihnen durchgeht. Was drin ist, sehen Sie hier – transparent und ohne Kleingedrucktes.</p></Reveal>
        </div>
      </section>
      <section className="pb-10">
        <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }} className="container-x grid md:grid-cols-2 gap-5">
          {services.map(s => (
            <motion.div key={s.id} variants={fadeUp} className="glass p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><s.icon size={22} /></div>
                <span className="text-xs font-bold rounded-full bg-cyan/15 text-cyan-deep px-3 py-1.5">{s.price}</span>
              </div>
              <h2 className="mt-5 text-2xl font-bold">{s.title}</h2>
              <p className="mt-2 text-muted text-sm">{s.desc}</p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">{details[s.id].map(d => <li key={d} className="flex items-center gap-2"><Check size={15} className="text-cyan-deep shrink-0" />{d}</li>)}</ul>
              <Link to={`/termin?leistung=${s.id}`} className="btn btn-dark btn-sm mt-6">Anfragen <ArrowRight size={16} className="rtl:rotate-180" /></Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
      <CTA />
    </>
  )
}
