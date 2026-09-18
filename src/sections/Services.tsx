import { Link } from 'react-router-dom'
import { sqmRateText } from '@/lib/pricing'
import { motion } from 'framer-motion'
import { Home, Sparkles, Truck, AppWindow, Building2, Sofa, ArrowUpRight } from 'lucide-react'
import { Reveal, TextReveal, Tilt, fadeUp, stagger } from '@/components/motion'

export const services = [
  { id: 'unterhalt', icon: Home, title: 'Unterhaltsreinigung', desc: 'Regelmäßig glänzend: Böden, Bäder, Küche, Staubwischen – wöchentlich, 14-tägig oder monatlich.', price: 'ab 59 €' },
  { id: 'grund', icon: Sparkles, title: 'Grundreinigung', desc: 'Intensiv bis in die Ecken: Fugen, Fensterrahmen, Heizkörper, Schränke innen. Für den Frühjahrsputz oder den Neustart.', price: 'ab 149 €' },
  { id: 'umzug', icon: Truck, title: 'Umzugsreinigung', desc: 'Besenrein war gestern. Wir übergeben Ihre alte Wohnung so, wie der Vermieter sie sich wünscht – Kautionsgarantie inklusive.', price: 'ab 189 €' },
  { id: 'fenster', icon: AppWindow, title: 'Fensterreinigung', desc: 'Streifenfrei innen und außen, inklusive Rahmen und Fensterbänke. Auch für Wintergärten und Glasfassaden.', price: 'ab 49 €' },
  { id: 'buero', icon: Building2, title: 'Büro, Praxis & Gewerbe', desc: 'Büro, Praxis, Kita, Schule, Treppenhaus, Halle & Lager – täglich, wöchentlich oder monatlich, außerhalb Ihrer Öffnungszeiten.', price: `ab ${sqmRateText()}/m²` },
  { id: 'polster', icon: Sofa, title: 'Teppich & Polster', desc: 'Tiefenreinigung mit Sprühextraktion – Sofa, Matratze und Teppich sehen aus wie neu, ohne Chemie-Geruch.', price: 'ab 79 €' },
]

export function Services() {
  return (
    <section id="leistungen" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow">Leistungen</span></Reveal>
          <TextReveal text="Alles, was glänzen soll." className="mt-4 text-4xl sm:text-5xl font-black" />
          <Reveal delay={0.2}><p className="mt-4 text-muted text-lg">Sechs Leistungen, ein Anspruch: Wenn wir gehen, sieht es aus wie neu. Richtwert ca. {sqmRateText()} pro m² – Festpreis nach Prüfung Ihrer Angaben, 10–20 % Rabatt bei direktem Kontakt.</p></Reveal>
        </div>
        <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }} className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(s => (
            <motion.div key={s.id} variants={fadeUp} className="group">
              <Tilt className="glass p-6 h-full rounded-[22px] transition-shadow group-hover:shadow-[0_30px_60px_-20px_var(--glow)]">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><s.icon size={22} /></div>
                  <span className="text-xs font-bold rounded-full bg-cyan/15 text-cyan-deep px-3 py-1.5">{s.price}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{s.desc}</p>
                <Link to={`/termin?leistung=${s.id}`} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-cyan-deep group-hover:gap-2 transition-all">Jetzt anfragen <ArrowUpRight size={16} className="rtl:-scale-x-100" /></Link>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
