import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, Sparkles, CalendarCheck, Euro, RotateCcw } from 'lucide-react'
import { ChatEngine, type ChatMsg } from '@/lib/chat'
import { useStore } from '@/lib/store'
import { formatDateDE, weekdaysShort } from '@/lib/labels'

const suggestions = ['Termin buchen', 'Was kostet eine Reinigung?', 'Welche Leistungen gibt es?', 'Wann seid ihr erreichbar?']

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
      setMsgs([{ id: 'w', role: 'assistant', content: g + 'Ich bin Clea, Ihre persönliche Assistentin von CLEAN. Ich beantworte Fragen zu unseren Leistungen und buche Ihren Reinigungstermin direkt hier im Chat – ganz ohne Formular. Womit darf ich helfen?' }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }) }, [msgs, busy])
  useEffect(() => { const t = setTimeout(() => setHint(false), 9000); return () => clearTimeout(t) }, [])

  const send = async (text: string) => {
    const t = text.trim(); if (!t || busy) return
    setInput(''); setBusy(true)
    setMsgs(m => [...m, { id: Math.random().toString(36).slice(2), role: 'user', content: t }])
    try {
      const replies = await engine.current.send(t)
      setOffline(engine.current.offline)
      setMsgs(m => [...m, ...replies])
    } catch (e) {
      setMsgs(m => [...m, { id: 'err', role: 'assistant', content: 'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.' }])
    } finally { setBusy(false) }
  }
  const reset = () => { engine.current = new ChatEngine(); setMsgs([]); setOffline(false); setTimeout(() => setOpen(true), 0) }

  return (
    <>
      {/* launcher */}
      <div className="fixed z-[950] end-4 sm:end-6" style={{ bottom: 'calc(16px + var(--safe-bottom))' }}>
        <AnimatePresence>
          {hint && !open && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full mb-3 end-0 glass-strong rounded-2xl px-4 py-3 text-sm w-[230px] shadow-lg">
              <b className="font-display">Hallo, ich bin Clea 👋</b><br /><span className="text-muted">Ich buche Ihren Termin im Chat.</span>
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
            className="fixed z-[949] inset-x-3 sm:inset-x-auto sm:end-6 sm:w-[400px] glass-strong rounded-[26px] overflow-hidden flex flex-col shadow-2xl"
            style={{ bottom: 'calc(92px + var(--safe-bottom))', maxHeight: 'min(640px, calc(100dvh - 120px - var(--safe-bottom) - var(--safe-top)))' }} role="dialog" aria-label="Chat mit Clea">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))', color: '#fff' }}>
              <div className="w-10 h-10 rounded-full bg-white/20 grid place-items-center"><Sparkles size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold leading-tight">Clea · KI-Assistentin</div>
                <div className="text-[11px] opacity-90 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />{offline ? 'Demo-Modus (ohne Groq-Schlüssel)' : 'Online · powered by Groq'}</div>
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
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Nachricht an Clea …" className="field !min-h-[46px] !py-2 !rounded-full flex-1" aria-label="Nachricht" />
              <button type="submit" disabled={!input.trim() || busy} className="w-11 h-11 shrink-0 rounded-full grid place-items-center text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }} aria-label="Senden"><Send size={18} className="rtl:-scale-x-100" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Bubble({ m, onPick }: { m: ChatMsg; onPick: (t: string) => void }) {
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
        <div className="flex items-center gap-2 font-display font-bold"><CalendarCheck size={18} /> Termin angefragt</div>
        <div className="text-sm mt-1 opacity-95">{formatDateDE(b.date, { weekday: true })} · {b.time} Uhr</div>
        <div className="text-xs mt-2 opacity-90">Buchungsnummer <b>{b.code}</b> · Preis wird vom Inhaber bestätigt</div>
        <Link to="/konto" className="inline-block mt-3 text-xs font-bold underline underline-offset-4">Zu meinen Terminen →</Link>
      </motion.div>
    )
  }
  if (m.ui?.type === 'estimate' && m.ui.estimate) {
    return <div className="rounded-2xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm flex items-center gap-3"><Euro size={18} className="text-cyan-deep" /><div><b>{m.ui.estimate[0]}–{m.ui.estimate[1]} €</b> <span className="text-muted">unverbindliche Preisspanne</span></div></div>
  }
  if (!m.content) return null
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`chat-bubble ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</motion.div>
}
