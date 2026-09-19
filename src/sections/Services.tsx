import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Baby, Footprints, Sparkles, AppWindow, HardHat, Leaf, ArrowUpRight } from 'lucide-react'
import { Reveal, TextReveal, Tilt, fadeUp, stagger } from '@/components/motion'

/** Services & entry prices taken from the pricing package (all prices net, VAT 19 % on top). */
export const services = [
  { id: 'buero', to: '/termin?objekt=buero&leistung=unterhalt', icon: Building2, title: 'Büroreinigung', desc: 'Arbeitsplätze, Böden, Sanitär und Teeküche – täglich, mehrmals pro Woche oder wöchentlich, gern außerhalb Ihrer Bürozeiten.', price: 'ab 39 € / Einsatz', meta: '30 € netto/Std. · 300 m²/Std.' },
  { id: 'praxis', to: '/termin?objekt=praxis&leistung=unterhalt', icon: Stethoscope, title: 'Praxisreinigung', desc: 'Hygienisch nach RKI-Standard, dokumentiert und diskret nach den Sprechzeiten. Behandlungsräume, Wartebereich, Sanitär.', price: 'ab 45 € / Einsatz', meta: '31,50 € netto/Std. · 240 m²/Std.' },
  { id: 'kita', to: '/termin?objekt=kita&leistung=unterhalt', icon: Baby, title: 'Kita- & Schulreinigung', desc: 'Kindgerecht und schadstoffarm: Gruppenräume, Klassenzimmer, Flure, Sanitär und Mensa – zuverlässig jeden Tag.', price: 'ab 45 € / Einsatz', meta: '30–31 € netto/Std.' },
  { id: 'treppenhaus', to: '/termin?objekt=treppenhaus&leistung=unterhalt', icon: Footprints, title: 'Treppenhausreinigung', desc: 'Eingänge, Stufen, Geländer, Fenster und Kellergänge – nach Aufgängen und Etagen kalkuliert, für Hausverwaltungen und Eigentümer.', price: 'ab 25 € / Einsatz', meta: '15 € je Eingang + 4,50 € je Etage' },
  { id: 'grund', to: '/termin?leistung=grund', icon: Sparkles, title: 'Grund- & Intensivreinigung', desc: 'Einmalig bis in die Ecken: Fugen, Rahmen, Heizkörper, Schränke innen. Intensivreinigung als gründlichere Unterhaltsreinigung.', price: 'ab 2,40 € / m²', meta: 'Grund 3,20 €/m² (mind. 180 €) · Intensiv 2,40 €/m² (mind. 150 €)' },
  { id: 'glas', to: '/termin?leistung=glas', icon: AppWindow, title: 'Glasreinigung', desc: 'Streifenfrei innen oder beidseitig, inklusive Rahmen auf Wunsch. Für Büros, Läden, Praxen und Wintergärten.', price: 'ab 2,20 € / m² Glas', meta: 'beidseitig 3,60 €/m² · Rahmen 1,40 €/m² · mind. 69 €' },
  { id: 'bauend', to: '/termin?leistung=bauend', icon: HardHat, title: 'Bauend- & Baugrobreinigung', desc: 'Grobreinigung während des Baus und bezugsfertige Endreinigung mit Staubbeseitigung, Fenstern und Sanitär.', price: 'ab 2,50 € / m²', meta: 'Grob 2,50 €/m² (mind. 220 €) · Endreinigung 4,00 €/m² (mind. 250 €)' },
  { id: 'garten', to: '/termin?leistung=garten', icon: Leaf, title: 'Garten & Außenreinigung', desc: 'Rasen, Hecke, Laub, Unkraut sowie Hochdruckreinigung von Wegen, Terrassen, Fassaden, Garagen und Solaranlagen.', price: 'ab 34 € / Std.', meta: 'Hochdruck 2,50 €/m² (mind. 120 €) · Fassade 4 €/m² · Garage 1 €/m²' },
]

export function Services() {
  return (
    <section id="leistungen" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow">Leistungen & Preise</span></Reveal>
          <TextReveal text="Alles, was glänzen soll." className="mt-4 text-4xl sm:text-5xl font-black" />
          <Reveal delay={0.2}><p className="mt-4 text-muted text-lg">Transparente Kalkulation: Unterhaltsreinigung nach Zeitaufwand und Stundensatz, Sonderleistungen nach Quadratmeter. Alle Preise netto zzgl. 19 % MwSt. – der Festpreis folgt nach kostenloser Besichtigung. Neukunden sparen 25 % im ersten Monat.</p></Reveal>
        </div>
        <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }} className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(s => (
            <motion.div key={s.id} variants={fadeUp} className="group">
              <Tilt className="glass p-6 h-full rounded-[22px] transition-shadow group-hover:shadow-[0_30px_60px_-20px_var(--glow)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><s.icon size={22} /></div>
                  <span className="text-xs font-bold rounded-full bg-cyan/15 text-cyan-deep px-3 py-1.5 text-end">{s.price}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{s.desc}</p>
                <p className="mt-3 text-[11px] text-muted/80 font-semibold">{s.meta}</p>
                <Link to={s.to} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-deep group-hover:gap-2 transition-all">Jetzt anfragen <ArrowUpRight size={16} className="rtl:-scale-x-100" /></Link>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
