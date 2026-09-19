import { useEffect, useRef, useState } from 'react'
import { fmtRange } from '@/lib/pricing'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, CalendarCheck, Euro, RotateCcw, BadgePercent, Phone, Check } from 'lucide-react'
import { ChatEngine, type ChatMsg } from '@/lib/chat'
import { useStore } from '@/lib/store'
import { formatDateDE, weekdaysShort } from '@/lib/labels'
import { business } from '@/lib/config'
import { WhatsAppIcon } from './WhatsAppButton'

const suggestions = ['Angebot für mein Büro', 'Was kostet der m²?', 'Treppenhaus 3× pro Woche', 'Wie bekomme ich den Rabatt?']

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(false)
  const engine = useRef(new ChatEngine())
  const list = useRef<HTMLDivElement>(null)
  const profile = useStore(s => s.profile)
  const [hint, setHint] = useState(true)

  useEffect(() => {
    if (open && msgs.length === 0) {
      const g = profile.name ? `Hallo ${profile.name.split(' ')[0]}! ` : 'Hallo! '
      setMsgs([{ id: 'w', role: 'assistant', content: `${g}Ich bin Clea von ${business.company}. Sagen Sie mir einfach, was gereinigt werden soll – z. B. „Büro, 300 m², Fliesen, 3× pro Woche“ – und ich nenne Ihnen sofort einen ungefähren Preis (Unterhaltsreinigung ab 39 € netto pro Einsatz) und stelle Ihre Anfrage zusammen. Tipp: Nach dem Absenden per WhatsApp oder Anruf melden = ${business.directDiscount[0]}–${business.directDiscount[1]} % Rabatt.` }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }) }, [msgs, busy])
  useEffect(() => { const t = setTimeout(() => setHint(false), 9000); return () => clearTimeout(t) }, [])

  const send = async (text: string) => {
    const t = text.trim(); if (!t || busy) return
    setInput(''); setBusy(true)
    setMsgs(m => [...m.filter(x => x.ui?.type !== 'options'), { id: Math.random().toString(36).slice(2), role: 'user', content: t }])
    try {
      const replies = await engine.current.send(t)
      setOffline(engine.current.offline)
      setMsgs(m => [...m, ...replies])
    } catch {
      setMsgs(m => [...m, { id: 'err' + Date.now(), role: 'assistant', content: 'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.' }])
    } finally { setBusy(false) }
  }
  const reset = () => { engine.current = new ChatEngine(); setMsgs([]); setOffline(false); setTimeout(() => setOpen(true), 0) }

  return (
    <>
      {/* launcher */}
      <div className="fixed z-[950] end-4 sm:end-6" style={{ bottom: 'calc(16px + var(--safe-bottom))' }}>
        <AnimatePresence>
          {hint && !open && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full mb-3 end-0 glass-strong rounded-2xl px-4 py-3 text-sm w-[240px] shadow-lg">
              <b className="font-display">Hallo, ich bin Clea 👋</b><br /><span className="text-muted">Preis in 30 Sekunden – direkt im Chat.</span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setOpen(o => !o)} aria-label="Chat mit Clea öffnen"
          className="relative w-16 h-16 rounded-full grid place-items-center text-white shadow-[0_18px_40px_-10px_var(--glow)]" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}>
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: 'var(--cyan)' }} />
          {open ? <X size={26} /> : <MessageCircle size={26} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed z-[949] inset-x-3 sm:inset-x-auto sm:end-6 sm:w-[410px] glass-strong rounded-[26px] overflow-hidden flex flex-col shadow-2xl"
            style={{ bottom: 'calc(92px + var(--safe-bottom))', maxHeight: 'min(660px, calc(100dvh - 120px - var(--safe-bottom) - var(--safe-top)))' }} role="dialog" aria-label="Chat mit Clea">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))', color: '#fff' }}>
              <div className="w-10 h-10 rounded-full bg-white/20 grid place-items-center"><Sparkles size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold leading-tight">Clea · KI-Assistentin</div>
                <div className="text-[11px] opacity-90 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />{offline ? 'Demo-Modus (ohne Groq-Schlüssel)' : `Online · ${business.company}`}</div>
              </div>
              <button onClick={reset} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/15" aria-label="Chat zurücksetzen"><RotateCcw size={16} /></button>
              <button onClick={() => setOpen(false)} className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/15" aria-label="Schließen"><X size={18} /></button>
            </div>

            <div ref={list} className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-3 min-h-[240px]">
              {msgs.map(m => <Bubble key={m.id} m={m} onPick={t => send(t)} />)}
              {busy && <div className="chat-bubble bot typing w-fit"><span /><span /><span /></div>}
              {msgs.length <= 1 && !busy && (
                <div className="flex flex-wrap gap-2 pt-1">{suggestions.map(s => <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:border-cyan transition">{s}</button>)}</div>
              )}
            </div>

            <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex items-center gap-2 p-3 border-t border-line">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="z. B. Büro, 300 m², 3× pro Woche …" className="field !min-h-[46px] !py-2 !rounded-full flex-1" aria-label="Nachricht" />
              <button type="submit" disabled={!input.trim() || busy} className="w-11 h-11 shrink-0 rounded-full grid place-items-center text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }} aria-label="Senden"><Send size={18} className="rtl:-scale-x-100" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function OptionChips({ options, multi, onPick }: { options: { label: string; value: string }[]; multi?: boolean; onPick: (t: string) => void }) {
  const [sel, setSel] = useState<string[]>([])
  if (!multi) return <div className="flex flex-wrap gap-1.5">{options.map(o => <button key={o.value} onClick={() => onPick(o.value)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-cyan hover:text-white hover:border-cyan transition">{o.label}</button>)}</div>
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">{options.map(o => { const a = sel.includes(o.value); return <button key={o.value} onClick={() => setSel(s => (a ? s.filter(x => x !== o.value) : [...s, o.value]))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition inline-flex items-center gap-1 ${a ? 'bg-cyan text-white border-cyan' : 'border-line bg-surface hover:border-cyan'}`}>{a && <Check size={12} />}{o.label}</button> })}</div>
      {sel.length > 0 && <button onClick={() => onPick(sel.join(', '))} className="mt-2 btn btn-primary btn-sm">Übernehmen ({sel.length})</button>}
    </div>
  )
}

function Bubble({ m, onPick }: { m: ChatMsg; onPick: (t: string) => void }) {
  const text = m.content ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`chat-bubble ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</motion.div> : null
  if (!m.ui) return text
  return <>{text}<UiPart m={m} onPick={onPick} /></>
}

function UiPart({ m, onPick }: { m: ChatMsg; onPick: (t: string) => void }) {
  if (m.ui?.type === 'options' && m.ui.options) {
    return <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><OptionChips options={m.ui.options} multi={m.ui.multi} onPick={onPick} /></motion.div>
  }
  if (m.ui?.type === 'slots' && m.ui.slots) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-surface-strong p-3 space-y-2">
        {m.ui.slots.length === 0 && <p className="text-sm text-muted">Aktuell keine freien Termine gefunden.</p>}
        {m.ui.slots.map(d => (
          <div key={d.date}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">{weekdaysShort[(new Date(d.date + 'T00:00').getDay() + 6) % 7]}, {formatDateDE(d.date)}</div>
            <div className="flex flex-wrap gap-1.5">{d.times.map(t => <button key={t} onClick={() => onPick(`Ich möchte den Termin am ${d.date} um ${t} Uhr.`)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-cyan hover:text-white hover:border-cyan transition">{t}</button>)}</div>
          </div>
        ))}
      </motion.div>
    )
  }
  if (m.ui?.type === 'booking' && m.ui.booking) {
    const b = m.ui.booking
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}>
        <div className="flex items-center gap-2 font-display font-bold"><CalendarCheck size={18} /> Anfrage gesendet</div>
        <div className="text-sm mt-1 opacity-95">{formatDateDE(b.date, { weekday: true })} · {b.time} Uhr</div>
        <div className="text-xs mt-2 opacity-90">Anfragenummer <b>{b.code}</b> · Festpreis folgt von {business.owner}</div>
        <div className="mt-3 rounded-xl bg-white/15 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold"><BadgePercent size={14} /> Jetzt {business.directDiscount[0]}–{business.directDiscount[1]} % sichern</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={b.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] text-white px-3 py-1.5 font-bold"><WhatsAppIcon size={14} /> WhatsApp</a>
            <a href={`tel:${business.phoneTel}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 font-bold"><Phone size={14} /> Anrufen</a>
          </div>
        </div>
      </motion.div>
    )
  }
  if (m.ui?.type === 'contact' && m.ui.contact) {
    return (
      <div className="rounded-2xl border border-line bg-surface-strong p-3 flex flex-wrap gap-2">
        <a href={m.ui.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}><WhatsAppIcon size={15} /> WhatsApp</a>
        <a href={`tel:${business.phoneTel}`} className="btn btn-ghost btn-sm"><Phone size={15} /> {business.phoneDisplay}</a>
      </div>
    )
  }
  if (m.ui?.type === 'estimate' && m.ui.estimate) {
    const e = m.ui.estimate
    return (
      <div className="rounded-2xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm space-y-1.5">
        <div className="flex items-center gap-2"><Euro size={16} className="text-cyan-deep" /><b>{fmtRange(e.perCleaning)}</b> <span className="text-muted">netto pro Einsatz{e.sqm ? ` · ${e.sqm} m²` : ''}</span></div>
        {e.monthly && <div className="text-muted ps-6">≈ {fmtRange(e.monthly)} netto pro Monat ({e.rhythm}) · 1. Monat −25 %</div>}
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 ps-6 text-xs"><BadgePercent size={14} /> Mit Direkt-Rabatt ca. <b>{fmtRange(e.discounted)}</b></div>
      </div>
    )
  }
  return null
}
