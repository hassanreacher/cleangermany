import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal, TextReveal, fadeUp, stagger } from '@/components/motion'
import { services } from '@/sections/Services'
import { CTA } from '@/sections/CTA'
import { extraOptions } from '@/lib/labels'

const details: Record<string, string[]> = {
  buero: ['Arbeitsplätze & Oberflächen', 'Böden saugen & wischen', 'Sanitär desinfizieren', 'Teeküche & Geräte außen', 'Papierkörbe leeren', 'Nach Ihren Bürozeiten'],
  praxis: ['Behandlungs- & Wartebereich', 'Desinfektion nach RKI', 'Sanitär intensiv', 'Dokumentierter Reinigungsnachweis', 'Feste Ansprechperson', 'Diskret nach Sprechzeiten'],
  kita: ['Gruppen- & Klassenräume', 'Flure, Garderoben, Mensa', 'Sanitär kindgerecht', 'Schadstoffarme Mittel', 'Täglich oder mehrmals pro Woche', 'Ferienreinigung optional'],
  treppenhaus: ['Eingänge & Briefkastenanlage', 'Stufen, Podeste, Geländer', 'Fenster im Treppenhaus', 'Kellergänge optional', 'Aufzug innen', 'Turnusplan für die Hausverwaltung'],
  grund: ['Fugen & Fliesen intensiv', 'Türen, Rahmen, Heizkörper', 'Schränke innen & außen', 'Kalk & Fett entfernen', 'Lampen & Steckdosen', 'Ideal vor Neuvermietung'],
  glas: ['Glas innen oder beidseitig', 'Rahmen & Fensterbänke', 'Schaufenster & Glastüren', 'Wintergärten', 'Streifenfrei mit Reinwasser', 'Regelmäßig oder einmalig'],
  bauend: ['Grobreinigung während des Baus', 'Staub & Bauschmutz', 'Fenster, Rahmen, Böden', 'Sanitär & Küche bezugsfertig', 'Entsorgung nach Aufwand', 'Abnahmefertige Übergabe'],
  garten: ['Rasenmähen & Kanten', 'Heckenschnitt', 'Laub- & Unkrautentfernung', 'Hochdruck: Wege & Terrassen', 'Solar-/PV-Anlagen', 'Fassade niedrig & Garagen'],
}

export default function Leistungen() {
  return (
    <>
      <section className="pt-36 pb-10">
        <div className="container-x max-w-3xl">
          <Reveal><span className="eyebrow">Leistungen</span></Reveal>
          <TextReveal as="h1" text="Sauber ist nicht gleich sauber." className="mt-4 text-4xl sm:text-6xl font-black" />
          <Reveal delay={0.2}><p className="mt-5 text-lg text-muted">Jede Leistung folgt einer Checkliste, die unser Team nach der Reinigung mit Ihnen durchgeht. Ihr Angebot erhalten Sie schriftlich nach einer kostenlosen Besichtigung – transparent und ohne Kleingedrucktes.</p></Reveal>
        </div>
      </section>
      <section className="pb-10">
        <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={{ once: true }} className="container-x grid md:grid-cols-2 gap-5">
          {services.map(s => (
            <motion.div key={s.id} variants={fadeUp} className="glass p-6 sm:p-8">
              <div className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><s.icon size={22} /></div>
              <h2 className="mt-5 text-2xl font-bold">{s.title}</h2>
              <p className="mt-2 text-muted text-sm">{s.desc}</p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">{details[s.id].map(d => <li key={d} className="flex items-center gap-2"><Check size={15} className="text-cyan-deep shrink-0" />{d}</li>)}</ul>
              <Link to={s.to} className="btn btn-dark btn-sm mt-6">Anfragen <ArrowRight size={16} className="rtl:rotate-180" /></Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
      <section className="pb-10">
        <div className="container-x">
          <Reveal>
            <div className="glass p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Zusatzleistungen für Ihren Reinigungsvertrag</h2>
              <p className="mt-2 text-sm text-muted">Monatlich buchbar – einfach bei der Anfrage auswählen.</p>
              <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">{extraOptions.map(e => <li key={e.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface-strong px-3.5 py-2.5"><Check size={14} className="text-cyan-deep shrink-0" />{e.label}</li>)}</ul>
            </div>
          </Reveal>
        </div>
      </section>
      <CTA />
    </>
  )
}
