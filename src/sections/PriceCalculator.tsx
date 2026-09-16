import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Info } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'
import { Chip, OptionCard } from '@/components/ui'
import { estimatePrice, estimateDuration } from '@/lib/pricing'
import { cleaningLabels, extraOptions, frequencyLabels, propertyLabels } from '@/lib/labels'
import { store } from '@/lib/store'
import type { CleaningType, Frequency, PropertyType } from '@/lib/types'

export function PriceCalculator() {
  const [sqm, setSqm] = useState(75)
  const [prop, setProp] = useState<PropertyType>('wohnung')
  const [type, setType] = useState<CleaningType>('unterhalt')
  const [freq, setFreq] = useState<Frequency>('einmalig')
  const [extras, setExtras] = useState<string[]>([])
  const est = useMemo(() => estimatePrice({ sizeSqm: sqm, propertyType: prop, cleaningType: type, frequency: freq, extras, bathrooms: 1 }), [sqm, prop, type, freq, extras])
  const dur = estimateDuration({ sizeSqm: sqm, cleaningType: type })
  const apply = () => store.updateProfile({ sizeSqm: sqm, propertyType: prop, cleaningType: type, frequency: freq, extras })

  return (
    <section id="preis" className="section">
      <div className="container-x">
        <div className="glass p-6 sm:p-10 grid lg:grid-cols-[1.2fr_1fr] gap-10">
          <div>
            <Reveal><span className="eyebrow">Preisrechner</span></Reveal>
            <TextReveal text="Was kostet mein Glanz?" className="mt-3 text-3xl sm:text-4xl font-black" />
            <Reveal delay={0.15}><p className="mt-3 text-muted">Schieben, klicken, wissen. Die Spanne ist unverbindlich – den Festpreis bestätigt der Inhaber nach Prüfung Ihrer Angaben.</p></Reveal>

            <div className="mt-8 space-y-7">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-3"><span>Fläche</span><span className="text-cyan-deep font-display text-lg">{sqm} m²</span></div>
                <input type="range" min={20} max={400} step={5} value={sqm} onChange={e => setSqm(+e.target.value)} style={{ ['--pct' as string]: `${((sqm - 20) / 380) * 100}%` }} aria-label="Fläche in Quadratmetern" />
                <div className="flex justify-between text-xs text-muted mt-1.5"><span>20 m²</span><span>400 m²</span></div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Objekt</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(Object.keys(propertyLabels) as PropertyType[]).map(k => <OptionCard key={k} active={prop === k} title={propertyLabels[k]} onClick={() => setProp(k)} />)}</div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Reinigungsart</div>
                <div className="flex flex-wrap gap-2">{(Object.keys(cleaningLabels) as CleaningType[]).map(k => <Chip key={k} active={type === k} onClick={() => setType(k)}>{cleaningLabels[k]}</Chip>)}</div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Häufigkeit <span className="text-muted font-normal">(bis zu 15 % Rabatt)</span></div>
                <div className="flex flex-wrap gap-2">{(Object.keys(frequencyLabels) as Frequency[]).map(k => <Chip key={k} active={freq === k} onClick={() => setFreq(k)}>{frequencyLabels[k]}</Chip>)}</div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Extras</div>
                <div className="flex flex-wrap gap-2">{extraOptions.map(e => <Chip key={e.id} active={extras.includes(e.id)} onClick={() => setExtras(x => (x.includes(e.id) ? x.filter(i => i !== e.id) : [...x, e.id]))}>{e.label}</Chip>)}</div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 self-start">
            <div className="rounded-[26px] p-6 sm:p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(150deg, var(--ink-2), var(--ink))' }}>
              <div className="absolute -top-20 -end-20 w-64 h-64 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, var(--cyan), transparent 70%)' }} />
              <div className="relative">
                <div className="text-xs font-bold tracking-[.2em] uppercase text-cyan-soft/80">Unverbindliche Schätzung</div>
                <div className="mt-3 flex items-end gap-2 font-display">
                  <AnimatePresence mode="popLayout">
                    <motion.span key={est[0]} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }} className="text-5xl sm:text-6xl font-black">{est[0]}</motion.span>
                  </AnimatePresence>
                  <span className="text-2xl font-bold pb-1.5">– {est[1]} €</span>
                </div>
                <div className="mt-2 text-sm text-white/70">{freq === 'einmalig' ? 'pro Reinigung' : 'pro Reinigung bei ' + frequencyLabels[freq].toLowerCase() + 'er Buchung'} · ca. {dur} Std.</div>
                <ul className="mt-6 space-y-2 text-sm text-white/85">
                  <li className="flex justify-between border-b border-white/10 pb-2"><span>{propertyLabels[prop]} · {sqm} m²</span><span>{cleaningLabels[type]}</span></li>
                  <li className="flex justify-between border-b border-white/10 pb-2"><span>Extras</span><span>{extras.length ? extras.length + ' gewählt' : 'keine'}</span></li>
                  <li className="flex justify-between"><span>Inklusive</span><span>Material, Anfahrt, Versicherung</span></li>
                </ul>
                <Link to="/termin" onClick={apply} className="btn btn-primary w-full mt-7">Mit diesen Angaben Termin buchen <ArrowRight size={18} className="rtl:rotate-180" /></Link>
                <p className="mt-4 text-[11px] text-white/60 flex items-start gap-1.5"><Info size={14} className="shrink-0 mt-0.5" /> Der Inhaber legt den endgültigen Preis anhand Ihrer Angaben (Lage, Zustand, Zugang) fest und bestätigt ihn per E-Mail.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
