import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Baby, Footprints, Sparkles, AppWindow, HardHat, Leaf, ArrowUpRight } from 'lucide-react'
import { Reveal, TextReveal, Tilt, fadeUp, stagger } from '@/components/motion'

export const services = [
  { id: 'buero', to: '/termin?objekt=buero&leistung=unterhalt', icon: Building2, title: 'Büroreinigung', desc: 'Arbeitsplätze, Böden, Sanitär und Teeküche – täglich, mehrmals pro Woche oder wöchentlich, gern außerhalb Ihrer Bürozeiten.' },
  { id: 'praxis', to: '/termin?objekt=praxis&leistung=unterhalt', icon: Stethoscope, title: 'Praxisreinigung', desc: 'Hygienisch nach RKI-Standard, dokumentiert und diskret nach den Sprechzeiten. Behandlungsräume, Wartebereich, Sanitär.' },
  { id: 'kita', to: '/termin?objekt=kita&leistung=unterhalt', icon: Baby, title: 'Kita- & Schulreinigung', desc: 'Kindgerecht und schadstoffarm: Gruppenräume, Klassenzimmer, Flure, Sanitär und Mensa – zuverlässig jeden Tag.' },
  { id: 'treppenhaus', to: '/termin?objekt=treppenhaus&leistung=unterhalt', icon: Footprints, title: 'Treppenhausreinigung', desc: 'Eingänge, Stufen, Geländer, Fenster und Kellergänge – im festen Turnus für Hausverwaltungen und Eigentümer.' },
  { id: 'grund', to: '/termin?leistung=grund', icon: Sparkles, title: 'Grund- & Intensivreinigung', desc: 'Einmalig bis in die Ecken: Fugen, Rahmen, Heizkörper, Schränke innen. Ideal vor Neuvermietung oder nach dem Winter.' },
  { id: 'glas', to: '/termin?leistung=glas', icon: AppWindow, title: 'Glasreinigung', desc: 'Streifenfrei innen oder beidseitig, inklusive Rahmen auf Wunsch. Für Büros, Läden, Praxen und Wintergärten.' },
  { id: 'bauend', to: '/termin?leistung=bauend', icon: HardHat, title: 'Bauend- & Baugrobreinigung', desc: 'Grobreinigung während des Baus und bezugsfertige Endreinigung mit Staubbeseitigung, Fenstern und Sanitär.' },
  { id: 'garten', to: '/termin?leistung=garten', icon: Leaf, title: 'Garten & Außenreinigung', desc: 'Rasen, Hecke, Laub, Unkraut sowie Hochdruckreinigung von Wegen, Terrassen, Fassaden, Garagen und Solaranlagen.' },
]

export function Services() {
  return (
    <section id="leistungen" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow">Leistungen</span></Reveal>
          <TextReveal text="Alles, was glänzen soll." className="mt-4 text-4xl sm:text-5xl font-black" />
          <Reveal delay={0.2}><p className="mt-4 text-muted text-lg">Acht Leistungen, ein Anspruch: Wenn wir gehen, sieht es aus wie neu. Sie schildern uns Ihr Objekt, wir kommen zur kostenlosen Besichtigung und Sie erhalten ein schriftliches Angebot mit Festpreis.</p></Reveal>
        </div>
        <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }} className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(s => (
            <motion.div key={s.id} variants={fadeUp} className="group">
              <Tilt className="glass p-6 h-full rounded-[22px] transition-shadow group-hover:shadow-[0_30px_60px_-20px_var(--glow)]">
                <div className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><s.icon size={22} /></div>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{s.desc}</p>
                <Link to={s.to} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-cyan-deep group-hover:gap-2 transition-all">Jetzt anfragen <ArrowUpRight size={16} className="rtl:-scale-x-100" /></Link>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
