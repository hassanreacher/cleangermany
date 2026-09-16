import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { freeSlots, fromISO, toISO, todayISO } from '@/lib/slots'
import { months, weekdaysShort, formatDateDE } from '@/lib/labels'
import { useStore } from '@/lib/store'

/** Month calendar showing available days (dot) + time slots for the selected day. */
export function Calendar({ value, onChange, compact = false }: { value: { date: string; time: string } | null; onChange: (v: { date: string; time: string } | null) => void; compact?: boolean }) {
  const { appointments, blockedSlots } = useStore(s => ({ appointments: s.appointments, blockedSlots: s.blockedSlots }))
  const today = todayISO()
  const [cursor, setCursor] = useState(() => { const d = fromISO(value?.date ?? today); return { y: d.getFullYear(), m: d.getMonth() } })
  const [dir, setDir] = useState(1)
  const [selDate, setSelDate] = useState<string | null>(value?.date ?? null)

  const days = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1)
    const offset = (first.getDay() + 6) % 7 // Monday first
    const n = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const cells: (string | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= n; d++) cells.push(toISO(new Date(cursor.y, cursor.m, d)))
    return cells
  }, [cursor])

  const slotsFor = (iso: string) => freeSlots(iso, appointments, blockedSlots)
  const move = (d: number) => { setDir(d); setCursor(c => { const dt = new Date(c.y, c.m + d, 1); return { y: dt.getFullYear(), m: dt.getMonth() } }) }
  const minMonth = cursor.y === fromISO(today).getFullYear() && cursor.m === fromISO(today).getMonth()

  return (
    <div className={`grid gap-5 ${compact ? '' : 'md:grid-cols-[1.2fr_1fr]'}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => move(-1)} disabled={minMonth} className="w-10 h-10 grid place-items-center rounded-full border border-line bg-surface-strong disabled:opacity-30 hover:border-cyan" aria-label="Vorheriger Monat"><ChevronLeft size={18} className="rtl:rotate-180" /></button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${cursor.y}-${cursor.m}`} initial={{ opacity: 0, x: 20 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 * dir }} transition={{ duration: 0.25 }} className="font-display font-bold">
              {months[cursor.m]} {cursor.y}
            </motion.div>
          </AnimatePresence>
          <button type="button" onClick={() => move(1)} className="w-10 h-10 grid place-items-center rounded-full border border-line bg-surface-strong hover:border-cyan" aria-label="Nächster Monat"><ChevronRight size={18} className="rtl:rotate-180" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-muted mb-1.5">{weekdaysShort.map(d => <div key={d}>{d}</div>)}</div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${cursor.y}-${cursor.m}g`} initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * dir }} transition={{ duration: 0.25 }} className="grid grid-cols-7 gap-1.5">
            {days.map((iso, i) => {
              if (!iso) return <div key={'e' + i} />
              const free = slotsFor(iso).length > 0
              const sel = selDate === iso
              return (
                <button type="button" key={iso} disabled={!free} onClick={() => { setSelDate(iso); onChange(null) }}
                  className={`cal-day ${sel ? 'selected' : free ? 'free' : 'off'}`} aria-label={formatDateDE(iso, { weekday: true })}>
                  {parseInt(iso.slice(-2))}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-cyan inline-block" /> frei</span><span className="opacity-60">grau = ausgebucht / geschlossen</span></div>
      </div>
      <div className="rounded-2xl border border-line bg-surface-strong p-4 min-h-[180px]">
        <div className="flex items-center gap-2 font-semibold text-sm mb-3"><Clock size={16} className="text-cyan-deep" />{selDate ? formatDateDE(selDate, { weekday: true }) : 'Bitte einen Tag wählen'}</div>
        <AnimatePresence mode="wait">
          {selDate && (
            <motion.div key={selDate} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slotsFor(selDate).map((t, i) => (
                <motion.button type="button" key={t} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onChange({ date: selDate, time: t })}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold transition min-h-[46px] ${value?.date === selDate && value?.time === t ? 'bg-cyan text-white border-transparent' : 'border-line hover:border-cyan'}`}>
                  {t}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {!selDate && <p className="text-xs text-muted">Termine sind in 2-Stunden-Fenstern zwischen 08:00 und 18:00 Uhr verfügbar, Montag bis Samstag.</p>}
      </div>
    </div>
  )
}
