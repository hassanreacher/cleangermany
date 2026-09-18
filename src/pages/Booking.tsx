import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Home, Building2, Stethoscope, House, ArrowLeft, ArrowRight, Check, Minus, Plus, PartyPopper, Sparkles, CalendarCheck, Dog, ArrowUpDown, Baby, GraduationCap, Footprints, Store, Warehouse, Layers, Repeat, Clock, Phone, BadgePercent } from 'lucide-react'
import { Input, Chip, Toggle, Textarea } from '@/components/ui'
import { Calendar } from '@/components/Calendar'
import { WhatsAppIcon } from '@/components/WhatsAppButton'
import { store, useStore, missingFields } from '@/lib/store'
import { cityFromZip, cities } from '@/lib/data'
import { estimatePrice, estimateDuration, estimateMonthly, withDiscount, cleaningsPerMonth } from '@/lib/pricing'
import { cleaningLabels, extraOptions, formatDateDE, frequencyLabels, propertyLabels, extraLabel, floorLabels, timeWindowLabels, frequencyText, isCommercial, commercialTypes } from '@/lib/labels'
import { business, whatsappUrl, inServiceArea } from '@/lib/config'
import { requestSummary } from '@/lib/summary'
import type { CleaningType, Frequency, PropertyType, Appointment, FloorType, TimeWindow } from '@/lib/types'

const steps = ['Objekt', 'Böden', 'Rhythmus', 'Ort', 'Kontakt', 'Termin', 'Prüfen']
const propIcons: Record<PropertyType, typeof Home> = { wohnung: Home, haus: House, buero: Building2, praxis: Stethoscope, kita: Baby, schule: GraduationCap, treppenhaus: Footprints, gewerbe: Store, halle: Warehouse }
const cleaningDesc: Record<CleaningType, string> = { buero: 'Regelmäßige Reinigung von Arbeitsplätzen, Böden, Sanitär & Teeküche', unterhalt: 'Regelmäßige Pflege: Böden, Bäder, Küche, Oberflächen', grund: 'Intensiv bis in die Ecken – Fugen, Rahmen, Schränke innen', umzug: 'Besenreine Übergabe inkl. Küche, Fenster & Keller', fenster: 'Glas innen & außen streifenfrei, inkl. Rahmen' }
const propDesc: Record<PropertyType, string> = { buero: 'Arbeitsplätze, Teeküche, Sanitär', praxis: 'Hygiene nach RKI-Standard', kita: 'Kindgerecht & schadstofffrei', schule: 'Klassenräume, Flure, WCs', treppenhaus: 'Stufen, Geländer, Handläufe', gewerbe: 'Laden, Werkstatt, Studio', halle: 'Große Flächen, Maschinenreinigung', wohnung: 'Privat, regelmäßig oder einmalig', haus: 'Mehrere Etagen, Außenbereich' }

/** Tiny pattern icons for the floor types. */
function FloorIcon({ type }: { type: FloorType }) {
  const c = 'currentColor'
  switch (type) {
    case 'fliesen': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></svg>
    case 'teppich': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9v6M10 9v6M13 9v6M17 9v6" /></svg>
    case 'parkett': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><path d="M3 8h18M3 12h18M3 16h18M9 4v4M15 8v4M9 12v4M15 16v4" /><rect x="3" y="4" width="18" height="16" rx="1.5" /></svg>
    case 'laminat': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M3 9.3h18M3 14.6h18M12 4v5.3M7 9.3v5.3M16 14.6V20" /></svg>
    case 'stein': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><path d="M4 9l5-5 7 2 4 6-3 7-8 1-5-4z" /><path d="M9 4l2 7-7 2M11 11l6 1M11 11l-2 8" /></svg>
    case 'linoleum': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M6 16c3-4 9-4 12 0M6 9c3 4 9 4 12 0" /></svg>
    case 'pvc': return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 12h18M8 4v16M16 4v16" /></svg>
    default: return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="4" /><rect x="3" y="13" width="8" height="8" rx="4" /><rect x="13" y="13" width="8" height="8" rx="1" /></svg>
  }
}

export default function Booking() {
  const p = useStore(s => s.profile)
  const [params] = useSearchParams()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [slot, setSlot] = useState<{ date: string; time: string } | null>(null)
  const [done, setDone] = useState<Appointment | null>(null)
  const up = store.updateProfile

  useEffect(() => {
    const l = params.get('leistung')
    if (l && l in cleaningLabels) up({ cleaningType: l as CleaningType })
    if (l === 'polster') up({ cleaningType: 'grund', notes: p.notes || 'Teppich-/Polsterreinigung gewünscht' })
    const o = params.get('objekt')
    if (o && o in propertyLabels) up({ propertyType: o as PropertyType })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const needsTimes = p.frequency === 'woechentlich' || p.frequency === 'monatlich'
  const valid = useMemo(() => [
    !!p.propertyType && !!p.sizeSqm && !!p.rooms && !!p.bathrooms,
    p.floorTypes.length > 0,
    !!p.cleaningType && !!p.frequency && (!needsTimes || !!p.timesPerPeriod) && !!p.timeWindow,
    p.street.trim().length > 3 && /^\d{5}$/.test(p.zip) && p.city.trim().length > 1 && !!p.floor && p.elevator !== null && (isCommercial(p.propertyType) || p.pets !== null),
    p.name.trim().length > 1 && /\S+@\S+\.\S+/.test(p.email) && p.phone.trim().length > 5,
    !!slot,
    true,
  ], [p, slot, needsTimes])

  const go = (d: number) => { setDir(d); setStep(s => Math.max(0, Math.min(steps.length - 1, s + d))); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const submit = () => { if (!slot || missingFields(p).length) return; setDone(store.book(slot.date, slot.time, 'web')) }
  const est = estimatePrice(p)

  if (done) return <Success a={done} />

  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x max-w-6xl">
        <div className="text-center">
          <span className="eyebrow justify-center">Angebot anfragen</span>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black">In 2 Minuten zum Angebot.</h1>
          <p className="mt-3 text-muted">Oder lassen Sie <button onClick={() => (document.querySelector('[aria-label="Chat mit Clea öffnen"]') as HTMLButtonElement)?.click()} className="font-bold text-cyan-deep underline underline-offset-4">Clea</button> alles im Chat erledigen.</p>
        </div>

        {/* progress */}
        <div className="mt-10 relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-line" />
          <motion.div className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-cyan to-cyan-deep" animate={{ width: `calc(${(step / (steps.length - 1)) * 100}% - ${(step / (steps.length - 1)) * 32}px)` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          <ol className="relative grid grid-cols-7">
            {steps.map((s, i) => (
              <li key={s} className="flex flex-col items-center gap-2">
                <motion.button type="button" onClick={() => i < step && setStep(i)} animate={{ scale: i === step ? 1.15 : 1 }} className={`w-8 h-8 rounded-full grid place-items-center text-xs font-black border-2 transition ${i < step ? 'bg-cyan border-cyan text-white' : i === step ? 'bg-ink border-ink text-white dark:bg-cyan-deep dark:border-cyan-deep' : 'bg-bg border-line text-muted'}`}>{i < step ? <Check size={14} /> : i + 1}</motion.button>
                <span className={`text-[10px] sm:text-xs font-semibold ${i === step ? 'text-text' : 'text-muted'}`}>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_330px] gap-6 items-start">
          <div className="glass p-5 sm:p-8 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir} initial={{ opacity: 0, x: 40 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * dir }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                {step === 0 && <StepObject />}
                {step === 1 && <StepFloors />}
                {step === 2 && <StepRhythm />}
                {step === 3 && <StepLocation />}
                {step === 4 && (
                  <div>
                    <StepTitle icon={<Sparkles size={20} />} title="Wie erreichen wir Sie?" sub="Für Angebot, Rückfragen und den Direkt-Rabatt." />
                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                      <Input label={isCommercial(p.propertyType) ? 'Ansprechperson / Firma' : 'Vollständiger Name'} value={p.name} onChange={e => up({ name: e.target.value })} placeholder={isCommercial(p.propertyType) ? 'Muster GmbH · Anna Schneider' : 'Anna Schneider'} autoComplete="name" />
                      <Input label="Telefon" value={p.phone} onChange={e => up({ phone: e.target.value })} placeholder="+49 30 1234567 oder 0176 …" type="tel" autoComplete="tel" />
                      <div className="sm:col-span-2"><Input label="E-Mail" value={p.email} onChange={e => up({ email: e.target.value })} placeholder="anna@beispiel.de" type="email" autoComplete="email" /></div>
                    </div>
                  </div>
                )}
                {step === 5 && (
                  <div>
                    <StepTitle icon={<CalendarCheck size={20} />} title={p.frequency === 'einmalig' ? 'Wann passt es Ihnen?' : 'Wann soll es losgehen?'} sub={`${p.frequency === 'einmalig' ? 'Voraussichtliche Dauer' : 'Erster Termin bzw. Besichtigung – Dauer'}: ca. ${estimateDuration(p)} Std. Freie Tage sind markiert.`} />
                    <div className="mt-6"><Calendar value={slot} onChange={setSlot} /></div>
                  </div>
                )}
                {step === 6 && <Review slot={slot!} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
              <button type="button" onClick={() => go(-1)} disabled={step === 0} className="btn btn-ghost"><ArrowLeft size={18} className="rtl:rotate-180" /> Zurück</button>
              {step < steps.length - 1 ? (
                <button type="button" onClick={() => go(1)} disabled={!valid[step]} className="btn btn-primary">Weiter <ArrowRight size={18} className="rtl:rotate-180" /></button>
              ) : (
                <button type="button" onClick={submit} className="btn btn-primary">Anfrage senden <Check size={18} /></button>
              )}
            </div>
          </div>

          {/* live estimate */}
          <EstimateCard est={est} compact={step < 6} />
        </div>
      </div>
    </section>
  )
}

function EstimateCard({ est, compact }: { est: [number, number]; compact: boolean }) {
  const p = useStore(s => s.profile)
  const monthly = estimateMonthly(p)
  const disc = withDiscount(est)
  return (
    <div className="lg:sticky lg:top-28 rounded-[26px] p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(150deg, var(--ink-2), var(--ink))' }}>
      <div className="absolute -top-20 -end-20 w-56 h-56 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, var(--cyan), transparent 70%)' }} />
      <div className="relative">
        <div className="text-[11px] font-bold tracking-[.2em] uppercase text-cyan-soft/80">Ungefährer Preis</div>
        <div className="mt-2 flex items-end gap-1.5 font-display">
          <AnimatePresence mode="popLayout"><motion.span key={est[0]} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="text-4xl font-black">{est[0]}</motion.span></AnimatePresence>
          <span className="text-xl font-bold pb-1">– {est[1]} €</span>
        </div>
        <div className="text-xs text-white/70 mt-1">pro Reinigung · {business.pricePerSqm[0].toFixed(2).replace('.', ',')}–{business.pricePerSqm[1].toFixed(2).replace('.', ',')} €/m²{p.sizeSqm ? ` · ${p.sizeSqm} m²` : ''}</div>
        {monthly && <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm"><span className="text-white/70">≈ monatlich</span> <b className="font-display">{monthly[0]}–{monthly[1]} €</b> <span className="text-white/60 text-xs">({cleaningsPerMonth(p)} Reinigungen)</span></div>}
        <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-400/15 px-3 py-2.5 text-xs text-amber-100 flex gap-2">
          <BadgePercent size={16} className="shrink-0 mt-0.5 text-amber-300" />
          <span><b>{business.directDiscount[0]}–{business.directDiscount[1]} % Rabatt</b>: Anfrage senden und direkt anrufen oder per WhatsApp schreiben → ca. <b>{disc[0]}–{disc[1]} €</b>.</span>
        </div>
        {!compact && <p className="mt-3 text-[11px] text-white/60">Alle Preise sind Richtwerte. {business.owner} bestätigt den Festpreis nach Prüfung Ihrer Angaben.</p>}
      </div>
    </div>
  )
}

/** Horizontal selection card – icon on the left, title + description on the right. Reads well at any width. */
function Tile({ active, title, desc, icon, onClick }: { active: boolean; title: string; desc?: string; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick} aria-pressed={active}
      className={`relative text-start rounded-2xl border p-3.5 sm:p-4 flex items-center gap-3.5 w-full min-h-[72px] transition ${active ? 'border-cyan bg-cyan/10 shadow-[0_12px_30px_-12px_var(--glow)]' : 'border-line bg-surface-strong hover:border-cyan/60'}`}>
      {icon && <span className={`w-11 h-11 shrink-0 rounded-xl grid place-items-center transition ${active ? 'text-white' : 'bg-cyan/10 text-cyan-deep'}`} style={active ? { background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' } : undefined}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-display font-bold leading-tight">{title}</span>
        {desc && <span className="block text-xs text-muted mt-0.5 leading-snug">{desc}</span>}
      </span>
      <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center border transition ${active ? 'bg-cyan border-cyan text-white' : 'border-line text-transparent'}`}><Check size={14} /></span>
    </motion.button>
  )
}

function StepTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}>{icon}</div>
      <div><h2 className="text-xl sm:text-2xl font-black">{title}</h2><p className="text-sm text-muted mt-1">{sub}</p></div>
    </div>
  )
}

function Stepper({ label, value, onChange, min = 1, max = 20 }: { label: string; value: number | null; onChange: (n: number) => void; min?: number; max?: number }) {
  const v = value ?? 0
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="inline-flex items-center rounded-full border border-line bg-surface-strong p-1">
        <button type="button" onClick={() => onChange(Math.max(min, v - 1))} className="w-10 h-10 rounded-full grid place-items-center hover:bg-cyan/15" aria-label="weniger"><Minus size={16} /></button>
        <AnimatePresence mode="popLayout"><motion.span key={v} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="w-10 text-center font-display font-black text-lg">{v || '–'}</motion.span></AnimatePresence>
        <button type="button" onClick={() => onChange(Math.min(max, v + 1))} className="w-10 h-10 rounded-full grid place-items-center hover:bg-cyan/15" aria-label="mehr"><Plus size={16} /></button>
      </div>
    </div>
  )
}

function StepObject() {
  const p = useStore(s => s.profile)
  const up = store.updateProfile
  const sqm = p.sizeSqm ?? 100
  const cells = Math.min(48, Math.max(4, Math.round(sqm / 25)))
  const privateTypes: PropertyType[] = ['wohnung', 'haus']
  return (
    <div>
      <StepTitle icon={<Building2 size={20} />} title="Was soll gereinigt werden?" sub="Objektart und Fläche bestimmen Zeitaufwand und Preis. Schätzungen reichen." />
      <div className="mt-6 text-xs font-bold uppercase tracking-wider text-muted">Gewerbe & Einrichtungen</div>
      <div className="mt-2 grid sm:grid-cols-2 gap-2.5">
        {commercialTypes.map(k => { const I = propIcons[k]; return <Tile key={k} active={p.propertyType === k} title={propertyLabels[k]} desc={propDesc[k]} icon={<I size={22} />} onClick={() => up({ propertyType: k, pets: p.pets ?? false })} /> })}
      </div>
      <div className="mt-5 text-xs font-bold uppercase tracking-wider text-muted">Privat</div>
      <div className="mt-2 grid sm:grid-cols-2 gap-2.5">
        {privateTypes.map(k => { const I = propIcons[k]; return <Tile key={k} active={p.propertyType === k} title={propertyLabels[k]} desc={propDesc[k]} icon={<I size={22} />} onClick={() => up({ propertyType: k })} /> })}
      </div>
      <div className="mt-8 grid lg:grid-cols-[1fr_220px] gap-8 items-center">
        <div>
          <div className="flex justify-between text-sm font-semibold mb-3"><span>Fläche</span><span className="text-cyan-deep font-display text-lg">{sqm} m²</span></div>
          <input type="range" min={20} max={2000} step={10} value={sqm} onChange={e => up({ sizeSqm: +e.target.value })} style={{ ['--pct' as string]: `${((sqm - 20) / 1980) * 100}%` }} aria-label="Fläche" />
          <div className="flex justify-between text-xs text-muted mt-1.5"><span>20 m²</span><span>2.000 m²</span></div>
          <div className="mt-3"><Input label="Oder genau eingeben (m²)" type="number" inputMode="numeric" min={10} value={p.sizeSqm ?? ''} onChange={e => up({ sizeSqm: e.target.value ? Math.max(1, +e.target.value) : null })} placeholder="z. B. 350" /></div>
          <div className="mt-6 flex flex-wrap gap-6">
            <Stepper label={isCommercial(p.propertyType) ? 'Räume' : 'Zimmer'} value={p.rooms} onChange={n => up({ rooms: n })} max={200} />
            <Stepper label={isCommercial(p.propertyType) ? 'Sanitärräume / WCs' : 'Bäder'} value={p.bathrooms} onChange={n => up({ bathrooms: n })} max={50} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface-strong p-3 aspect-square grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cells))}, 1fr)` }} aria-hidden>
          {Array.from({ length: cells }).map((_, i) => <motion.div key={i} layout initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.01 }} className="rounded-md" style={{ background: i % 7 === 0 ? 'var(--ink-2)' : 'var(--cyan)', opacity: 0.35 + (i % 5) * 0.12 }} />)}
        </div>
      </div>
    </div>
  )
}

function StepFloors() {
  const p = useStore(s => s.profile)
  const up = store.updateProfile
  const toggle = (f: FloorType) => up({ floorTypes: p.floorTypes.includes(f) ? p.floorTypes.filter(x => x !== f) : [...p.floorTypes, f] })
  const tips: Record<FloorType, string> = { fliesen: 'Wischen & Fugenpflege', teppich: 'Saugen, Sprühextraktion', pvc: 'Wischpflege, Beschichtung', parkett: 'Nebelfeucht, Parkettpflege', laminat: 'Nebelfeucht wischen', stein: 'Steinpflege, Kristallisation', linoleum: 'Wischpflege ohne Alkali', gemischt: 'Wir stimmen die Mittel je Bereich ab' }
  return (
    <div>
      <StepTitle icon={<Layers size={20} />} title="Welche Böden haben Sie?" sub="Mehrfachauswahl möglich. Jeder Bodenbelag bekommt das passende Reinigungsmittel." />
      <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
        {(Object.keys(floorLabels) as FloorType[]).map(f => <Tile key={f} active={p.floorTypes.includes(f)} title={floorLabels[f]} desc={tips[f]} icon={<FloorIcon type={f} />} onClick={() => toggle(f)} />)}
      </div>
      <p className="mt-4 text-xs text-muted">{p.floorTypes.length ? `Gewählt: ${p.floorTypes.map(f => floorLabels[f]).join(', ')}` : 'Bitte mindestens einen Bodenbelag wählen.'}</p>
    </div>
  )
}

function StepRhythm() {
  const p = useStore(s => s.profile)
  const up = store.updateProfile
  const setFreq = (f: Frequency) => up({ frequency: f, timesPerPeriod: f === 'woechentlich' ? (p.timesPerPeriod && p.timesPerPeriod <= 6 ? p.timesPerPeriod : 2) : f === 'monatlich' ? (p.timesPerPeriod && p.timesPerPeriod <= 3 ? p.timesPerPeriod : 1) : null })
  const types: CleaningType[] = isCommercial(p.propertyType) ? ['buero', 'unterhalt', 'grund', 'fenster'] : ['unterhalt', 'grund', 'umzug', 'fenster']
  return (
    <div>
      <StepTitle icon={<Repeat size={20} />} title="Wie oft dürfen wir kommen?" sub="Leistung, Rhythmus und bevorzugte Uhrzeit – bei Gewerbe gern außerhalb Ihrer Öffnungszeiten." />
      <div className="mt-6 text-sm font-semibold mb-3">Leistung</div>
      <div className="grid sm:grid-cols-2 gap-2.5">{types.map(k => <Tile key={k} active={p.cleaningType === k} title={cleaningLabels[k]} desc={cleaningDesc[k]} icon={<Sparkles size={20} />} onClick={() => up({ cleaningType: k })} />)}</div>

      <div className="mt-6 text-sm font-semibold mb-3">Rhythmus</div>
      <div className="flex flex-wrap gap-2">{(Object.keys(frequencyLabels) as Frequency[]).map(k => <Chip key={k} active={p.frequency === k} onClick={() => setFreq(k)}>{frequencyLabels[k]}</Chip>)}</div>

      <AnimatePresence>
        {(p.frequency === 'woechentlich' || p.frequency === 'monatlich') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-5 rounded-2xl border border-line bg-surface-strong p-4 flex flex-wrap items-center gap-5">
              <Stepper label={p.frequency === 'woechentlich' ? 'Reinigungen pro Woche' : 'Reinigungen pro Monat'} value={p.timesPerPeriod} onChange={n => up({ timesPerPeriod: n })} min={1} max={p.frequency === 'woechentlich' ? 6 : 3} />
              <div className="text-sm text-muted">{p.frequency === 'woechentlich' ? <>z. B. <b className="text-text">Mo / Mi / Fr</b> = 3× pro Woche · ergibt ca. <b className="text-text">{cleaningsPerMonth(p)}</b> Reinigungen im Monat</> : <>ergibt <b className="text-text">{cleaningsPerMonth(p)}</b> Reinigung{cleaningsPerMonth(p) > 1 ? 'en' : ''} im Monat</>}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {p.frequency === 'taeglich' && <p className="mt-3 text-xs text-muted">Täglich = Montag bis Freitag (ca. 21 Reinigungen im Monat). Samstage gern auf Anfrage.</p>}

      <div className="mt-6 text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock size={14} /> Bevorzugte Uhrzeit</div>
      <div className="flex flex-wrap gap-2">{(Object.keys(timeWindowLabels) as TimeWindow[]).map(k => <Chip key={k} active={p.timeWindow === k} onClick={() => up({ timeWindow: k })}>{timeWindowLabels[k]}</Chip>)}</div>

      <div className="mt-6"><div className="text-sm font-semibold mb-3">Extras <span className="text-muted font-normal">(optional)</span></div><div className="flex flex-wrap gap-2">{extraOptions.map(e => <Chip key={e.id} active={p.extras.includes(e.id)} onClick={() => up({ extras: p.extras.includes(e.id) ? p.extras.filter(x => x !== e.id) : [...p.extras, e.id] })}>{e.label}</Chip>)}</div></div>
      <div className="mt-6"><Textarea label="Hinweise für unser Team (optional)" value={p.notes} onChange={e => up({ notes: e.target.value })} placeholder="z. B. Schlüsselübergabe, Zugang über Hinterhof, Alarmanlage, empfindliche Oberflächen …" /></div>
    </div>
  )
}

function StepLocation() {
  const p = useStore(s => s.profile)
  const up = store.updateProfile
  const known = cities.includes(p.city)
  const inArea = inServiceArea(p.zip)
  return (
    <div>
      <StepTitle icon={<MapPin size={20} />} title="Wo dürfen wir glänzen?" sub="Die Adresse des Objekts in Berlin – PLZ eingeben, wir ergänzen die Stadt automatisch." />
      <div className="grid lg:grid-cols-[1fr_260px] gap-6 mt-6">
        <div className="grid sm:grid-cols-[1fr_140px] gap-4">
          <div className="sm:col-span-2"><Input label="Straße & Hausnummer" value={p.street} onChange={e => up({ street: e.target.value })} placeholder="Kastanienallee 12" autoComplete="street-address" /></div>
          <Input label="Ort" value={p.city} onChange={e => up({ city: e.target.value })} placeholder="Berlin" list="cities" autoComplete="address-level2" />
          <datalist id="cities">{cities.map(c => <option key={c} value={c} />)}</datalist>
          <Input label="PLZ" value={p.zip} inputMode="numeric" maxLength={5} onChange={e => { const z = e.target.value.replace(/\D/g, ''); up({ zip: z }); const c = cityFromZip(z); if (c) up({ city: c }) }} placeholder="12307" autoComplete="postal-code" />
          <div className="sm:col-span-2"><Input label="Etage(n)" value={p.floor} onChange={e => up({ floor: e.target.value })} placeholder="z. B. EG, 2, EG–3" /></div>
          <div><label className="lbl flex items-center gap-1.5"><ArrowUpDown size={13} /> Aufzug vorhanden?</label><Toggle value={p.elevator} onChange={v => up({ elevator: v })} /></div>
          {!isCommercial(p.propertyType) && <div><label className="lbl flex items-center gap-1.5"><Dog size={13} /> Haustiere?</label><Toggle value={p.pets} onChange={v => up({ pets: v })} /></div>}
        </div>
        <div className="relative rounded-2xl overflow-hidden min-h-[200px] border border-line" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(31,192,228,.25), transparent 70%), var(--surface-strong)' }}>
          <svg viewBox="0 0 280 220" className="absolute inset-0 w-full h-full" aria-hidden>
            <g stroke="var(--line)" strokeWidth="1"><path d="M0 60 C60 40 120 90 280 70" fill="none" /><path d="M0 140 C90 120 160 170 280 150" fill="none" /><path d="M70 0 C90 80 60 140 90 220" fill="none" /><path d="M190 0 C170 70 220 150 200 220" fill="none" /></g>
            {[[40, 40], [220, 50], [60, 180], [230, 170], [140, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="var(--cyan)" opacity=".5" />)}
            <motion.circle cx="140" cy="110" r="30" fill="none" stroke="var(--cyan)" strokeWidth="2" style={{ transformOrigin: '140px 110px' }} animate={{ scale: [0.5, 1.6], opacity: [0.7, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </svg>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-full text-cyan-deep"><MapPin size={40} fill="var(--cyan)" stroke="#fff" /></motion.div>
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-bg/90 backdrop-blur px-3 py-2 text-xs font-semibold text-center">
            {inArea === true || (known && !p.zip) ? <span className="text-emerald-600 dark:text-emerald-300">✓ Berlin – wir sind bei Ihnen im Einsatz</span> : inArea === false ? <span className="text-amber-600 dark:text-amber-300">Außerhalb Berlins – wir reinigen aktuell nur in Berlin</span> : <span className="text-muted">Berliner PLZ eingeben …</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Review({ slot }: { slot: { date: string; time: string } }) {
  const p = useStore(s => s.profile)
  const rows: [string, string][] = [
    ['Objekt', `${propertyLabels[p.propertyType as PropertyType] ?? ''} · ${p.sizeSqm} m² · ${p.rooms} ${isCommercial(p.propertyType) ? 'Räume' : 'Zimmer'} · ${p.bathrooms} ${isCommercial(p.propertyType) ? 'Sanitär' : 'Bad'}`],
    ['Böden', p.floorTypes.map(f => floorLabels[f]).join(', ')],
    ['Leistung', `${cleaningLabels[p.cleaningType as CleaningType] ?? ''} · ${frequencyText(p)} · ${timeWindowLabels[p.timeWindow as TimeWindow] ?? ''}`],
    ['Extras', p.extras.length ? p.extras.map(extraLabel).join(', ') : 'keine'],
    ['Adresse', `${p.street}, ${p.zip} ${p.city} · Etage ${p.floor} · Aufzug ${p.elevator ? 'ja' : 'nein'}${isCommercial(p.propertyType) ? '' : ` · Haustiere ${p.pets ? 'ja' : 'nein'}`}`],
    ['Kontakt', `${p.name} · ${p.email} · ${p.phone}`],
    [p.frequency === 'einmalig' ? 'Termin' : 'Start / Besichtigung', `${formatDateDE(slot.date, { weekday: true })} · ${slot.time} Uhr · ca. ${estimateDuration(p)} Std.`],
  ]
  return (
    <div>
      <StepTitle icon={<Check size={20} />} title="Alles richtig?" sub={`${business.owner} prüft Ihre Angaben und bestätigt den Festpreis per E-Mail oder Telefon.`} />
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface-strong">
        {rows.map(([k, v]) => <div key={k} className="grid sm:grid-cols-[150px_1fr] gap-1 px-4 py-3 text-sm"><dt className="text-muted font-semibold">{k}</dt><dd>{v}</dd></div>)}
        {p.notes && <div className="grid sm:grid-cols-[150px_1fr] gap-1 px-4 py-3 text-sm"><dt className="text-muted font-semibold">Hinweise</dt><dd>{p.notes}</dd></div>}
      </dl>
    </div>
  )
}

function Success({ a }: { a: Appointment }) {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ x: (Math.random() - 0.5) * 600, y: -(200 + Math.random() * 300), r: Math.random() * 720, d: 0.5 + Math.random() * 0.8, c: ['#1fc0e4', '#b9eef9', '#0e3b47', '#ffd166', '#fff'][i % 5] })), [])
  const disc = withDiscount(a.estimate)
  const monthly = estimateMonthly(a.customer)
  const wa = whatsappUrl(requestSummary(a.customer, a.code))
  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x max-w-xl text-center relative">
        <div className="absolute left-1/2 top-24 pointer-events-none">{pieces.map((p, i) => <motion.span key={i} className="absolute w-2.5 h-4 rounded-sm" style={{ background: p.c }} initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }} animate={{ x: p.x, y: [p.y, p.y + 700], opacity: [1, 1, 0], rotate: p.r }} transition={{ duration: 2.2 + p.d, ease: 'easeOut', delay: 0.2 }} />)}</div>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="glass p-8 sm:p-10">
          <div className="w-20 h-20 mx-auto rounded-full grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><PartyPopper size={36} /></div>
          <h1 className="mt-6 text-3xl font-black">Anfrage gesendet!</h1>
          <p className="mt-2 text-muted">Anfragenummer <b className="text-text">{a.code}</b></p>
          <div className="mt-6 rounded-2xl border border-line bg-surface-strong p-4 text-sm">
            <div className="font-display font-bold text-lg">{formatDateDE(a.date, { weekday: true })} · {a.time} Uhr</div>
            <div className="text-muted mt-1">{a.customer.street}, {a.customer.zip} {a.customer.city}</div>
            <div className="mt-2">Ungefähr {a.estimate[0]}–{a.estimate[1]} € pro Reinigung{monthly ? ` · ca. ${monthly[0]}–${monthly[1]} €/Monat` : ''}</div>
          </div>

          <div className="mt-6 rounded-2xl p-5 text-white text-start" style={{ background: 'linear-gradient(135deg, var(--ink-2), var(--ink))' }}>
            <div className="flex items-center gap-2 font-display font-bold text-lg"><BadgePercent size={20} className="text-amber-300" /> Jetzt {business.directDiscount[0]}–{business.directDiscount[1]} % sparen</div>
            <p className="mt-2 text-sm text-white/80">Melden Sie sich direkt bei {business.owner} – per Anruf oder WhatsApp mit Ihrer Anfragenummer <b>{a.code}</b>. Sie erhalten dann Ihr Angebot mit Direkt-Rabatt: ca. <b>{disc[0]}–{disc[1]} €</b> statt {a.estimate[0]}–{a.estimate[1]} €.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}><WhatsAppIcon size={18} /> Per WhatsApp senden</a>
              <a href={`tel:${business.phoneTel}`} className="btn bg-white/10 border border-white/20 text-white hover:bg-white/20"><Phone size={18} /> {business.phoneDisplay}</a>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn btn-primary">Zur Startseite</Link>
            <Link to="/leistungen" className="btn btn-ghost">Leistungen ansehen</Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
