import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Home, Building2, Stethoscope, House, ArrowLeft, ArrowRight, Check, Minus, Plus, PartyPopper, Sparkles, CalendarCheck, Dog, ArrowUpDown } from 'lucide-react'
import { Input, OptionCard, Chip, Toggle, Textarea } from '@/components/ui'
import { Calendar } from '@/components/Calendar'
import { store, useStore, missingFields } from '@/lib/store'
import { cityFromZip, cities } from '@/lib/data'
import { estimatePrice, estimateDuration } from '@/lib/pricing'
import { cleaningLabels, extraOptions, formatDateDE, frequencyLabels, propertyLabels, extraLabel } from '@/lib/labels'
import type { CleaningType, Frequency, PropertyType, Appointment } from '@/lib/types'

const steps = ['Ort', 'Objekt', 'Wünsche', 'Kontakt', 'Termin', 'Prüfen']
const propIcons = { wohnung: Home, haus: House, buero: Building2, praxis: Stethoscope }

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const valid = useMemo(() => [
    p.street.trim().length > 3 && /^\d{5}$/.test(p.zip) && p.city.trim().length > 1,
    !!p.propertyType && !!p.sizeSqm && !!p.rooms && !!p.bathrooms && !!p.floor && p.elevator !== null && p.pets !== null,
    !!p.cleaningType && !!p.frequency,
    p.name.trim().length > 1 && /\S+@\S+\.\S+/.test(p.email) && p.phone.trim().length > 5,
    !!slot,
    true,
  ], [p, slot])

  const go = (d: number) => { setDir(d); setStep(s => Math.max(0, Math.min(steps.length - 1, s + d))); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const submit = () => { if (!slot || missingFields(p).length) return; setDone(store.book(slot.date, slot.time, 'web')) }
  const est = estimatePrice(p)

  if (done) return <Success a={done} />

  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x max-w-4xl">
        <div className="text-center">
          <span className="eyebrow justify-center">Termin buchen</span>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black">In 2 Minuten zum Termin.</h1>
          <p className="mt-3 text-muted">Oder lassen Sie <button onClick={() => (document.querySelector('[aria-label="Chat mit Clea öffnen"]') as HTMLButtonElement)?.click()} className="font-bold text-cyan-deep underline underline-offset-4">Clea</button> alles im Chat erledigen.</p>
        </div>

        {/* progress */}
        <div className="mt-10 relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-line" />
          <motion.div className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-cyan to-cyan-deep" animate={{ width: `calc(${(step / (steps.length - 1)) * 100}% - ${(step / (steps.length - 1)) * 32}px)` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          <ol className="relative grid grid-cols-6">
            {steps.map((s, i) => (
              <li key={s} className="flex flex-col items-center gap-2">
                <motion.button type="button" onClick={() => i < step && setStep(i)} animate={{ scale: i === step ? 1.15 : 1 }} className={`w-8 h-8 rounded-full grid place-items-center text-xs font-black border-2 transition ${i < step ? 'bg-cyan border-cyan text-white' : i === step ? 'bg-ink border-ink text-white dark:bg-cyan-deep dark:border-cyan-deep' : 'bg-bg border-line text-muted'}`}>{i < step ? <Check size={14} /> : i + 1}</motion.button>
                <span className={`text-[11px] sm:text-xs font-semibold ${i === step ? 'text-text' : 'text-muted'}`}>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 glass p-5 sm:p-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} initial={{ opacity: 0, x: 40 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * dir }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              {step === 0 && <StepLocation />}
              {step === 1 && <StepObject />}
              {step === 2 && <StepWishes />}
              {step === 3 && (
                <div>
                  <StepTitle icon={<Sparkles size={20} />} title="Wie erreichen wir Sie?" sub="Für die Preisbestätigung und Rückfragen unseres Teams." />
                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <Input label="Vollständiger Name" value={p.name} onChange={e => up({ name: e.target.value })} placeholder="Anna Schneider" autoComplete="name" />
                    <Input label="Telefon" value={p.phone} onChange={e => up({ phone: e.target.value })} placeholder="+49 30 1234567" type="tel" autoComplete="tel" />
                    <div className="sm:col-span-2"><Input label="E-Mail" value={p.email} onChange={e => up({ email: e.target.value })} placeholder="anna@beispiel.de" type="email" autoComplete="email" /></div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <StepTitle icon={<CalendarCheck size={20} />} title="Wann passt es Ihnen?" sub={`Voraussichtliche Dauer: ca. ${estimateDuration(p)} Stunden. Freie Tage sind markiert.`} />
                  <div className="mt-6"><Calendar value={slot} onChange={setSlot} /></div>
                </div>
              )}
              {step === 5 && <Review slot={slot!} est={est} />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            <button type="button" onClick={() => go(-1)} disabled={step === 0} className="btn btn-ghost"><ArrowLeft size={18} className="rtl:rotate-180" /> Zurück</button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => go(1)} disabled={!valid[step]} className="btn btn-primary">Weiter <ArrowRight size={18} className="rtl:rotate-180" /></button>
            ) : (
              <button type="button" onClick={submit} className="btn btn-primary">Termin verbindlich anfragen <Check size={18} /></button>
            )}
          </div>
        </div>
      </div>
    </section>
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

function StepLocation() {
  const p = useStore(s => s.profile)
  const up = store.updateProfile
  const known = cities.includes(p.city)
  return (
    <div>
      <StepTitle icon={<MapPin size={20} />} title="Wo dürfen wir glänzen?" sub="Die Adresse des Objekts – PLZ eingeben, wir ergänzen die Stadt automatisch." />
      <div className="grid lg:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="grid sm:grid-cols-[1fr_140px] gap-4">
          <div className="sm:col-span-2"><Input label="Straße & Hausnummer" value={p.street} onChange={e => up({ street: e.target.value })} placeholder="Kastanienallee 12" autoComplete="street-address" /></div>
          <Input label="Ort" value={p.city} onChange={e => up({ city: e.target.value })} placeholder="Berlin" list="cities" autoComplete="address-level2" />
          <datalist id="cities">{cities.map(c => <option key={c} value={c} />)}</datalist>
          <Input label="PLZ" value={p.zip} inputMode="numeric" maxLength={5} onChange={e => { const z = e.target.value.replace(/\D/g, ''); up({ zip: z }); const c = cityFromZip(z); if (c) up({ city: c }) }} placeholder="10435" autoComplete="postal-code" />
          <div className="sm:col-span-2"><Input label="Etage" value={p.floor} onChange={e => up({ floor: e.target.value })} placeholder="z. B. EG, 2, 4" /></div>
        </div>
        <div className="relative rounded-2xl overflow-hidden min-h-[200px] border border-line" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(31,192,228,.25), transparent 70%), var(--surface-strong)' }}>
          <svg viewBox="0 0 280 220" className="absolute inset-0 w-full h-full" aria-hidden>
            <g stroke="var(--line)" strokeWidth="1"><path d="M0 60 C60 40 120 90 280 70" fill="none" /><path d="M0 140 C90 120 160 170 280 150" fill="none" /><path d="M70 0 C90 80 60 140 90 220" fill="none" /><path d="M190 0 C170 70 220 150 200 220" fill="none" /></g>
            {[[40, 40], [220, 50], [60, 180], [230, 170], [140, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="var(--cyan)" opacity=".5" />)}
            <motion.circle cx="140" cy="110" r="30" fill="none" stroke="var(--cyan)" strokeWidth="2" style={{ transformOrigin: '140px 110px' }} animate={{ scale: [0.5, 1.6], opacity: [0.7, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </svg>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-full text-cyan-deep"><MapPin size={40} fill="var(--cyan)" stroke="#fff" /></motion.div>
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-bg/90 backdrop-blur px-3 py-2 text-xs font-semibold text-center">
            {p.city ? (known ? <span className="text-emerald-600 dark:text-emerald-300">✓ Wir sind in {p.city} verfügbar</span> : <span>{p.city} – Verfügbarkeit auf Anfrage</span>) : <span className="text-muted">PLZ eingeben …</span>}
          </div>
        </div>
      </div>
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
  const sqm = p.sizeSqm ?? 70
  const cells = Math.min(48, Math.max(4, Math.round(sqm / 10)))
  return (
    <div>
      <StepTitle icon={<Home size={20} />} title="Erzählen Sie uns vom Objekt" sub="Damit wir Zeit und Team richtig planen. Schätzungen reichen völlig." />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(propertyLabels) as PropertyType[]).map(k => { const I = propIcons[k]; return <OptionCard key={k} active={p.propertyType === k} title={propertyLabels[k]} icon={<I size={22} />} onClick={() => up({ propertyType: k })} /> })}
      </div>
      <div className="mt-7 grid lg:grid-cols-[1fr_220px] gap-6 items-center">
        <div>
          <div className="flex justify-between text-sm font-semibold mb-3"><span>Fläche</span><span className="text-cyan-deep font-display text-lg">{sqm} m²</span></div>
          <input type="range" min={20} max={400} step={5} value={sqm} onChange={e => up({ sizeSqm: +e.target.value })} style={{ ['--pct' as string]: `${((sqm - 20) / 380) * 100}%` }} aria-label="Fläche" />
          <div className="flex justify-between text-xs text-muted mt-1.5"><span>20 m²</span><span>400 m²</span></div>
          <div className="mt-6 flex flex-wrap gap-6">
            <Stepper label="Zimmer" value={p.rooms} onChange={n => up({ rooms: n })} />
            <Stepper label="Bäder" value={p.bathrooms} onChange={n => up({ bathrooms: n })} max={8} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface-strong p-3 aspect-square grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cells))}, 1fr)` }} aria-hidden>
          {Array.from({ length: cells }).map((_, i) => <motion.div key={i} layout initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.01 }} className="rounded-md" style={{ background: i % 7 === 0 ? 'var(--ink-2)' : 'var(--cyan)', opacity: 0.35 + (i % 5) * 0.12 }} />)}
        </div>
      </div>
      <div className="mt-7 grid sm:grid-cols-2 gap-6">
        <div><label className="lbl flex items-center gap-1.5"><ArrowUpDown size={13} /> Aufzug vorhanden?</label><Toggle value={p.elevator} onChange={v => up({ elevator: v })} /></div>
        <div><label className="lbl flex items-center gap-1.5"><Dog size={13} /> Haustiere?</label><Toggle value={p.pets} onChange={v => up({ pets: v })} /></div>
      </div>
      {!p.floor && <p className="mt-4 text-xs text-muted">Hinweis: Bitte im Schritt „Ort“ auch die Etage angeben.</p>}
    </div>
  )
}

function StepWishes() {
  const p = useStore(s => s.profile)
  const up = store.updateProfile
  return (
    <div>
      <StepTitle icon={<Sparkles size={20} />} title="Was dürfen wir für Sie tun?" sub="Wählen Sie Leistung, Rhythmus und Extras. Hinweise helfen unserem Team." />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {(Object.keys(cleaningLabels) as CleaningType[]).map(k => <OptionCard key={k} active={p.cleaningType === k} title={cleaningLabels[k]} onClick={() => up({ cleaningType: k })} />)}
      </div>
      <div className="mt-6"><div className="text-sm font-semibold mb-3">Häufigkeit</div><div className="flex flex-wrap gap-2">{(Object.keys(frequencyLabels) as Frequency[]).map(k => <Chip key={k} active={p.frequency === k} onClick={() => up({ frequency: k })}>{frequencyLabels[k]}</Chip>)}</div></div>
      <div className="mt-6"><div className="text-sm font-semibold mb-3">Extras <span className="text-muted font-normal">(optional)</span></div><div className="flex flex-wrap gap-2">{extraOptions.map(e => <Chip key={e.id} active={p.extras.includes(e.id)} onClick={() => up({ extras: p.extras.includes(e.id) ? p.extras.filter(x => x !== e.id) : [...p.extras, e.id] })}>{e.label}</Chip>)}</div></div>
      <div className="mt-6"><Textarea label="Hinweise für unser Team (optional)" value={p.notes} onChange={e => up({ notes: e.target.value })} placeholder="z. B. Schlüssel beim Nachbarn, Parkplatz im Hof, empfindlicher Parkettboden …" /></div>
    </div>
  )
}

function Review({ slot, est }: { slot: { date: string; time: string }; est: [number, number] }) {
  const p = useStore(s => s.profile)
  const rows: [string, string][] = [
    ['Adresse', `${p.street}, ${p.zip} ${p.city} · Etage ${p.floor}`],
    ['Objekt', `${propertyLabels[p.propertyType as PropertyType] ?? ''} · ${p.sizeSqm} m² · ${p.rooms} Zimmer · ${p.bathrooms} Bad`],
    ['Details', `Aufzug: ${p.elevator ? 'ja' : 'nein'} · Haustiere: ${p.pets ? 'ja' : 'nein'}`],
    ['Leistung', `${cleaningLabels[p.cleaningType as CleaningType] ?? ''} · ${frequencyLabels[p.frequency as Frequency] ?? ''}`],
    ['Extras', p.extras.length ? p.extras.map(extraLabel).join(', ') : 'keine'],
    ['Kontakt', `${p.name} · ${p.email} · ${p.phone}`],
    ['Termin', `${formatDateDE(slot.date, { weekday: true })} · ${slot.time} Uhr · ca. ${estimateDuration(p)} Std.`],
  ]
  return (
    <div>
      <StepTitle icon={<Check size={20} />} title="Alles richtig?" sub="Der Inhaber prüft Ihre Angaben und bestätigt den Festpreis per E-Mail." />
      <div className="mt-6 grid lg:grid-cols-[1fr_260px] gap-6">
        <dl className="divide-y divide-line rounded-2xl border border-line bg-surface-strong">
          {rows.map(([k, v]) => <div key={k} className="grid sm:grid-cols-[120px_1fr] gap-1 px-4 py-3 text-sm"><dt className="text-muted font-semibold">{k}</dt><dd>{v}</dd></div>)}
          {p.notes && <div className="grid sm:grid-cols-[120px_1fr] gap-1 px-4 py-3 text-sm"><dt className="text-muted font-semibold">Hinweise</dt><dd>{p.notes}</dd></div>}
        </dl>
        <div className="rounded-2xl p-5 text-white self-start" style={{ background: 'linear-gradient(150deg, var(--ink-2), var(--ink))' }}>
          <div className="text-xs font-bold tracking-[.2em] uppercase text-cyan-soft/80">Preisspanne</div>
          <div className="mt-2 font-display text-3xl font-black">{est[0]}–{est[1]} €</div>
          <p className="mt-3 text-xs text-white/70">Unverbindlich. Sie erhalten den endgültigen Festpreis vor der Reinigung und können jederzeit kostenlos stornieren.</p>
        </div>
      </div>
    </div>
  )
}

function Success({ a }: { a: Appointment }) {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ x: (Math.random() - 0.5) * 600, y: -(200 + Math.random() * 300), r: Math.random() * 720, d: 0.5 + Math.random() * 0.8, c: ['#1fc0e4', '#b9eef9', '#0e3b47', '#ffd166', '#fff'][i % 5] })), [])
  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x max-w-xl text-center relative">
        <div className="absolute left-1/2 top-24 pointer-events-none">{pieces.map((p, i) => <motion.span key={i} className="absolute w-2.5 h-4 rounded-sm" style={{ background: p.c }} initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }} animate={{ x: p.x, y: [p.y, p.y + 700], opacity: [1, 1, 0], rotate: p.r }} transition={{ duration: 2.2 + p.d, ease: 'easeOut', delay: 0.2 }} />)}</div>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="glass p-8 sm:p-10">
          <div className="w-20 h-20 mx-auto rounded-full grid place-items-center text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><PartyPopper size={36} /></div>
          <h1 className="mt-6 text-3xl font-black">Termin angefragt!</h1>
          <p className="mt-2 text-muted">Buchungsnummer <b className="text-text">{a.code}</b></p>
          <div className="mt-6 rounded-2xl border border-line bg-surface-strong p-4 text-sm">
            <div className="font-display font-bold text-lg">{formatDateDE(a.date, { weekday: true })} · {a.time} Uhr</div>
            <div className="text-muted mt-1">{a.customer.street}, {a.customer.zip} {a.customer.city}</div>
            <div className="mt-2">Preisspanne {a.estimate[0]}–{a.estimate[1]} € · Festpreis folgt per E-Mail</div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/konto" className="btn btn-primary">Zu meinen Terminen</Link>
            <Link to="/" className="btn btn-ghost">Zur Startseite</Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
