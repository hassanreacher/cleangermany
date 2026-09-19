import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Quote, MessageSquarePlus } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'
import { Input, Textarea } from '@/components/ui'
import { Skeleton } from '@/components/Loading'
import { approvedReviews, submitReview } from '@/lib/orders'
import { supabaseConfigured, errorText, type ReviewRow } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

/** Customer reviews from the database (approved only) + a form to submit a new one. */
export function Testimonials() {
  const [list, setList] = useState<ReviewRow[] | null>(null)
  const [form, setForm] = useState(false)
  useEffect(() => {
    if (!supabaseConfigured) { setList([]); return }
    approvedReviews(12).then(setList).catch(() => setList([]))
  }, [])
  return (
    <section id="bewertungen" className="section overflow-hidden">
      <div className="container-x flex flex-wrap items-end justify-between gap-4">
        <div>
          <Reveal><span className="eyebrow">Kundenstimmen</span></Reveal>
          <TextReveal text="Das sagen unsere Kund:innen." className="mt-4 text-4xl sm:text-5xl font-black max-w-2xl" />
        </div>
        <Reveal delay={0.1}><button onClick={() => setForm(f => !f)} className="btn btn-ghost btn-sm"><MessageSquarePlus size={16} /> Bewertung schreiben</button></Reveal>
      </div>
      {form && <div className="container-x mt-6"><ReviewForm onDone={() => setForm(false)} /></div>}
      {list === null ? (
        <div className="mt-12 flex gap-5 px-4 sm:px-6 lg:px-[max(32px,calc((100vw-1200px)/2+32px))] overflow-hidden">{[0, 1, 2].map(i => <Skeleton key={i} className="w-[340px] h-[220px] shrink-0 !rounded-[22px]" />)}</div>
      ) : list.length === 0 ? (
        <div className="container-x mt-10"><div className="glass p-8 text-center text-muted text-sm">Noch keine veröffentlichten Bewertungen. Waren Sie schon Kund:in? Wir freuen uns über Ihre Erfahrung.</div></div>
      ) : (
        <motion.div className="mt-12 cursor-grab active:cursor-grabbing" drag="x" dragConstraints={{ left: -Math.max(0, list.length * 360 - 900), right: 0 }} dragElastic={0.08}>
          <div className="flex gap-5 px-4 sm:px-6 lg:px-[max(32px,calc((100vw-1200px)/2+32px))]">
            {list.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="glass p-6 w-[340px] shrink-0 select-none">
                <Quote className="text-cyan/50" size={28} />
                <div className="flex text-amber-400 mt-3">{[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < r.rating ? 'currentColor' : 'none'} />)}</div>
                <p className="mt-3 text-sm leading-relaxed">{r.text}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full grid place-items-center text-white font-bold" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}>{r.author_name[0]}</div>
                  <div className="text-sm"><b>{r.author_name}</b><div className="text-muted text-xs">{r.city || 'Berlin'}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  )
}

function ReviewForm({ onDone }: { onDone: () => void }) {
  const { user, profile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [city, setCity] = useState('Berlin')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('')
    try { await submitReview({ author_name: name, email, city, rating, text }); setMsg('Vielen Dank! Ihre Bewertung wird nach kurzer Prüfung veröffentlicht.'); setTimeout(onDone, 3000) } catch (err) { setMsg(errorText(err)) } finally { setBusy(false) }
  }
  if (!supabaseConfigured) return <div className="glass p-5 text-sm text-muted">Bewertungen können erst nach Anbindung der Datenbank gespeichert werden.</div>
  return (
    <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={send} className="glass p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
      <Input label="Name" value={name} onChange={e => setName(e.target.value)} required placeholder="Anna S." />
      <Input label="E-Mail (wird nicht veröffentlicht)" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="anna@beispiel.de" />
      <Input label="Bezirk / Ort" value={city} onChange={e => setCity(e.target.value)} placeholder="Berlin-Steglitz" />
      <div><label className="lbl">Bewertung</label><div className="flex items-center gap-1 h-[52px]">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} Sterne`}><Star size={26} className={n <= rating ? 'text-amber-400' : 'text-line'} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div></div>
      <div className="sm:col-span-2"><Textarea label="Ihre Erfahrung" value={text} onChange={e => setText(e.target.value)} required minLength={10} placeholder="Wie zufrieden waren Sie mit Glanzgeschwister?" /></div>
      {msg && <div className="sm:col-span-2 text-sm">{msg}</div>}
      <div className="sm:col-span-2 flex gap-2"><button disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Wird gesendet …' : 'Bewertung absenden'}</button><button type="button" onClick={onDone} className="btn btn-ghost btn-sm">Abbrechen</button></div>
    </motion.form>
  )
}
