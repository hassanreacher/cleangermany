import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Info, BadgePercent, Phone } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'
import { Chip, OptionCard } from '@/components/ui'
import { WhatsAppIcon } from '@/components/WhatsAppButton'
import { estimatePrice, estimateDuration, estimateMonthly, withDiscount, cleaningsPerMonth, fmtRange, sqmRateText } from '@/lib/pricing'
import { cleaningLabels, floorLabels, frequencyLabels, propertyLabels, commercialTypes, frequencyText } from '@/lib/labels'
import { store } from '@/lib/store'
import { business, whatsappUrl } from '@/lib/config'
import { requestSummary } from '@/lib/summary'
import type { CleaningType, FloorType, Frequency, PropertyType } from '@/lib/types'

export function PriceCalculator() {
  const [sqm, setSqm] = useState(250)
  const [prop, setProp] = useState<PropertyType>('buero')
  const [floors, setFloors] = useState<FloorType[]>(['fliesen', 'teppich'])
  const [type, setType] = useState<CleaningType>('buero')
  const [freq, setFreq] = useState<Frequency>('woechentlich')
  const [times, setTimes] = useState(3)
  const profile = useMemo(() => ({ sizeSqm: sqm, propertyType: prop, floorTypes: floors, cleaningType: type, frequency: freq, timesPerPeriod: freq === 'woechentlich' || freq === 'monatlich' ? times : null, extras: [] as string[] }), [sqm, prop, floors, type, freq, times])
  const est = estimatePrice(profile)
  const monthly = estimateMonthly(profile)
  const disc = withDiscount(est)
  const dur = estimateDuration(profile)
  const apply = () => store.updateProfile({ ...profile, bathrooms: null })
  const maxTimes = freq === 'monatlich' ? 3 : 6

  return (
    <section id="preis" className="section">
      <div className="container-x">
        <div className="glass p-6 sm:p-10 grid lg:grid-cols-[1.2fr_1fr] gap-10">
          <div>
            <Reveal><span className="eyebrow">Preisrechner</span></Reveal>
            <TextReveal text="Was kostet mein Glanz?" className="mt-3 text-3xl sm:text-4xl font-black" />
            <Reveal delay={0.15}><p className="mt-3 text-muted">Ungefähr <b className="text-text">{sqmRateText()} pro m²</b> und Reinigung. Objekt, Fläche und Rhythmus wählen – den Festpreis bestätigt {business.owner} nach Prüfung.</p></Reveal>

            <div className="mt-8 space-y-7">
              <div>
                <div className="text-sm font-semibold mb-3">Objekt</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{[...commercialTypes, 'wohnung' as PropertyType, 'haus' as PropertyType].map(k => <OptionCard key={k} active={prop === k} title={propertyLabels[k]} onClick={() => { setProp(k); if (k === 'wohnung' || k === 'haus') setType('unterhalt'); else if (type === 'umzug') setType('buero') }} />)}</div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-3"><span>Fläche</span><span className="text-cyan-deep font-display text-lg">{sqm} m²</span></div>
                <input type="range" min={20} max={2000} step={10} value={sqm} onChange={e => setSqm(+e.target.value)} style={{ ['--pct' as string]: `${((sqm - 20) / 1980) * 100}%` }} aria-label="Fläche in Quadratmetern" />
                <div className="flex justify-between text-xs text-muted mt-1.5"><span>20 m²</span><span>2.000 m²</span></div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Bodenarten <span className="text-muted font-normal">(Mehrfachauswahl)</span></div>
                <div className="flex flex-wrap gap-2">{(Object.keys(floorLabels) as FloorType[]).map(f => <Chip key={f} active={floors.includes(f)} onClick={() => setFloors(x => (x.includes(f) ? x.filter(i => i !== f) : [...x, f]))}>{floorLabels[f]}</Chip>)}</div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Reinigungsart</div>
                <div className="flex flex-wrap gap-2">{(Object.keys(cleaningLabels) as CleaningType[]).map(k => <Chip key={k} active={type === k} onClick={() => setType(k)}>{cleaningLabels[k]}</Chip>)}</div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-3">Rhythmus</div>
                <div className="flex flex-wrap gap-2">{(Object.keys(frequencyLabels) as Frequency[]).map(k => <Chip key={k} active={freq === k} onClick={() => { setFreq(k); setTimes(t => Math.min(t, k === 'monatlich' ? 3 : 6)) }}>{frequencyLabels[k]}</Chip>)}</div>
                <AnimatePresence>
                  {(freq === 'woechentlich' || freq === 'monatlich') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-semibold">{freq === 'woechentlich' ? 'Wie oft pro Woche?' : 'Wie oft pro Monat?'}</span>
                        <div className="flex gap-1.5">{Array.from({ length: maxTimes }, (_, i) => i + 1).map(n => <button key={n} type="button" onClick={() => setTimes(n)} className={`w-10 h-10 rounded-full border text-sm font-bold transition ${times === n ? 'bg-ink text-white border-transparent dark:bg-cyan-deep' : 'bg-surface-strong border-line hover:border-cyan'}`}>{n}×</button>)}</div>
                        <span className="text-muted">≈ {cleaningsPerMonth(profile)} Reinigungen / Monat</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 self-start">
            <div className="rounded-[26px] p-6 sm:p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(150deg, var(--ink-2), var(--ink))' }}>
              <div className="absolute -top-20 -end-20 w-64 h-64 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, var(--cyan), transparent 70%)' }} />
              <div className="relative">
                <div className="text-xs font-bold tracking-[.2em] uppercase text-cyan-soft/80">Ungefährer Preis</div>
                <div className="mt-3 flex items-end gap-2 font-display">
                  <AnimatePresence mode="popLayout">
                    <motion.span key={est[0]} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }} className="text-5xl sm:text-6xl font-black">{est[0]}</motion.span>
                  </AnimatePresence>
                  <span className="text-2xl font-bold pb-1.5">{est[1] !== est[0] ? `– ${est[1]} ` : ''}€</span>
                </div>
                <div className="mt-2 text-sm text-white/70">pro Reinigung · {frequencyText(profile).toLowerCase() || 'einmalig'} · ca. {dur} Std.</div>
                {monthly && <div className="mt-4 rounded-xl bg-white/10 px-4 py-3 flex items-center justify-between"><span className="text-sm text-white/75">≈ pro Monat</span><b className="font-display text-xl">{fmtRange(monthly)}</b></div>}
                <ul className="mt-5 space-y-2 text-sm text-white/85">
                  <li className="flex justify-between border-b border-white/10 pb-2"><span>{propertyLabels[prop]} · {sqm} m²</span><span>{cleaningLabels[type]}</span></li>
                  <li className="flex justify-between border-b border-white/10 pb-2"><span>Böden</span><span className="text-end">{floors.length ? floors.map(f => floorLabels[f]).join(', ') : 'keine gewählt'}</span></li>
                  <li className="flex justify-between"><span>Inklusive</span><span>Material, Anfahrt, Versicherung</span></li>
                </ul>
                <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-400/15 p-3.5 text-xs text-amber-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-200"><BadgePercent size={16} /> {business.directDiscount[0]}–{business.directDiscount[1]} % Direkt-Rabatt</div>
                  <p className="mt-1">Anfrage senden und danach direkt anrufen oder per WhatsApp schreiben → ca. <b>{fmtRange(disc)}</b> pro Reinigung.</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <a href={whatsappUrl(requestSummary(profile))} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}><WhatsAppIcon size={15} /> WhatsApp</a>
                    <a href={`tel:${business.phoneTel}`} className="btn btn-sm bg-white/10 border border-white/20 text-white hover:bg-white/20"><Phone size={15} /> Anrufen</a>
                  </div>
                </div>
                <Link to="/termin" onClick={apply} className="btn btn-primary w-full mt-5">Mit diesen Angaben anfragen <ArrowRight size={18} className="rtl:rotate-180" /></Link>
                <p className="mt-4 text-[11px] text-white/60 flex items-start gap-1.5"><Info size={14} className="shrink-0 mt-0.5" /> Richtwerte. Den endgültigen Preis legt {business.owner} anhand Ihrer Angaben (Zustand, Zugang, Zeiten) fest.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
