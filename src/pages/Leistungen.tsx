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
  garten: ['Rasenmähen (0,12 €/m²)', 'Heckenschnitt (4 €/lfm)', 'Laub (0,18 €/m²) & Unkraut (0,80 €/m²)', 'Hochdruck: Wege & Terrassen', 'Solar-/PV-Anlagen (2,50 €/m²)', 'Fassade niedrig & Garagen'],
}

export default function Leistungen() {
  return (
    <>
      <section className="pt-36 pb-10">
        <div className="container-x max-w-3xl">
          <Reveal><span className="eyebrow">Leistungen & Preise</span></Reveal>
          <TextReveal as="h1" text="Sauber ist nicht gleich sauber." className="mt-4 text-4xl sm:text-6xl font-black" />
          <Reveal delay={0.2}><p className="mt-5 text-lg text-muted">Jede Leistung folgt einer Checkliste, die unser Team nach der Reinigung mit Ihnen durchgeht. Die Preise sind Richtwerte netto zzgl. 19 % MwSt. – den Festpreis erhalten Sie schriftlich nach einer kostenlosen Besichtigung.</p></Reveal>
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
              <p className="mt-2 text-xs font-semibold text-muted/80">{s.meta}</p>
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
              <p className="mt-2 text-sm text-muted">Monatlich buchbar, alle Preise netto.</p>
              <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">{extraOptions.map(e => <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-strong px-3.5 py-2.5"><span>{e.label}</span><span className="text-xs text-muted whitespace-nowrap">{e.priceText}</span></li>)}</ul>
              <p className="mt-4 text-xs text-muted">Faktoren auf den Zeitaufwand: Verschmutzung leicht −10 % · mittel +20 % · stark +45 % · Teppich +8 % · Stein +12 % · abends +5 % · nachts +18 % · Wochenende +25 % · schwieriger Zugang +18 %. Häufigere Reinigung senkt den Preis pro Einsatz (bis −18 % bei täglicher Reinigung).</p>
            </div>
          </Reveal>
        </div>
      </section>
      <CTA />
    </>
  )
}
