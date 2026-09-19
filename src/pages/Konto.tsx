import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck, LogOut, X, UserRound, Star, Save, Phone, ChevronDown } from 'lucide-react'
import { Badge, Input, Textarea } from '@/components/ui'
import { Reveal } from '@/components/motion'
import { Loader, NotConfigured, ErrorBox, SkeletonCards } from '@/components/Loading'
import { OrderDetails } from '@/components/OrderDetails'
import { WhatsAppIcon } from '@/components/WhatsAppButton'
import { useAuth } from '@/lib/auth'
import { myOrders, cancelMyOrder, submitReview } from '@/lib/orders'
import { supabase, statusLabel, statusTone, errorText, type OrderRow } from '@/lib/supabase'
import { cleaningLabels, formatDateDE } from '@/lib/labels'
import { business, whatsappUrl } from '@/lib/config'
import type { CleaningType } from '@/lib/types'

export default function Konto() {
  const { user, profile, loading, configured, signOut, updateProfile } = useAuth()
  const nav = useNavigate()
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError('')
    try { setOrders(await myOrders()) } catch (e) { setError(errorText(e)); setOrders([]) }
  }, [])
  useEffect(() => { if (user) load() }, [user, load])
  // live updates when the admin changes something
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('my-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, load])

  if (!configured) return <section className="pt-36 pb-20"><div className="container-x"><NotConfigured /></div></section>
  if (loading) return <section className="pt-36 pb-20"><div className="container-x"><Loader label="Konto wird geladen …" /></div></section>
  if (!user) {
    return (
      <section className="pt-36 pb-20"><div className="container-x max-w-md text-center"><div className="glass p-8">
        <UserRound className="mx-auto text-cyan-deep" size={36} /><h1 className="mt-4 text-2xl font-black">Mein Konto</h1>
        <p className="text-muted text-sm mt-2">Melden Sie sich an, um den Status Ihrer Anfragen zu sehen, Termine zu stornieren und Bewertungen abzugeben.</p>
        <div className="mt-6 flex justify-center gap-2"><Link to="/login" className="btn btn-primary">Anmelden</Link><Link to="/login?mode=signup" className="btn btn-ghost">Registrieren</Link></div>
      </div></div></section>
    )
  }

  const first = (profile?.full_name || user.email || '').split(' ')[0]
  const active = (orders ?? []).filter(o => !['erledigt', 'storniert'].includes(o.status))
  const past = (orders ?? []).filter(o => ['erledigt', 'storniert'].includes(o.status))

  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><span className="eyebrow">Mein Konto</span><h1 className="mt-2 text-3xl sm:text-4xl font-black">Hallo {first} 👋</h1></div>
          <div className="flex gap-2">
            <Link to="/termin" className="btn btn-primary btn-sm"><CalendarCheck size={16} /> Neue Anfrage</Link>
            <button onClick={async () => { await signOut(); nav('/') }} className="btn btn-ghost btn-sm"><LogOut size={16} /> Abmelden</button>
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            <Reveal>
              <div className="glass p-5 sm:p-6">
                <h2 className="text-lg font-bold">Aktuelle Anfragen</h2>
                <div className="mt-4 space-y-3">
                  {orders === null ? <SkeletonCards n={2} /> : error ? <ErrorBox message={error} onRetry={load} /> : active.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">Noch keine offene Anfrage. <Link to="/termin" className="font-bold text-cyan-deep">Jetzt Angebot anfragen</Link></div>
                  ) : active.map(o => <OrderCard key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} onChanged={load} />)}
                </div>
              </div>
            </Reveal>
            {past.length > 0 && (
              <Reveal>
                <div className="glass p-5 sm:p-6">
                  <h2 className="text-lg font-bold">Abgeschlossen</h2>
                  <div className="mt-4 space-y-3">{past.map(o => <OrderCard key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} onChanged={load} />)}</div>
                </div>
              </Reveal>
            )}
          </div>

          <div className="space-y-6">
            <Reveal delay={0.1}><ProfileCard name={profile?.full_name ?? ''} phone={profile?.phone ?? ''} email={user.email ?? ''} onSave={updateProfile} /></Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-[26px] p-5 text-white" style={{ background: 'linear-gradient(150deg, var(--ink-2), var(--ink))' }}>
                <div className="font-display font-bold">Fragen zu Ihrer Anfrage?</div>
                <p className="text-sm text-white/75 mt-1">{business.owner} hilft Ihnen persönlich – per WhatsApp oder Anruf.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={whatsappUrl(`Hallo ${business.company}, ich habe eine Frage zu meiner Anfrage.`)} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}><WhatsAppIcon size={15} /> WhatsApp</a>
                  <a href={`tel:${business.phoneTel}`} className="btn btn-sm bg-white/10 border border-white/20 text-white hover:bg-white/20"><Phone size={15} /> Anrufen</a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

function OrderCard({ o, open, onToggle, onChanged }: { o: OrderRow; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [review, setReview] = useState(false)
  const cancellable = ['neu', 'besichtigung', 'angebot', 'bestaetigt'].includes(o.status)
  const cancel = async () => {
    if (!confirm('Anfrage wirklich stornieren?')) return
    setBusy(true); setErr('')
    try { await cancelMyOrder(o.id); onChanged() } catch (e) { setErr(errorText(e)) } finally { setBusy(false) }
  }
  return (
    <motion.div layout className="rounded-2xl border border-line bg-surface-strong overflow-hidden">
      <button onClick={onToggle} className="w-full text-start p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap"><Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge><span className="text-xs text-muted">{o.code}</span></div>
          <div className="mt-1.5 font-display font-bold">{cleaningLabels[o.cleaning_type as CleaningType] ?? o.cleaning_type} · {o.size_sqm} m²</div>
          <div className="text-sm text-muted">{o.street}, {o.zip} {o.city}{o.preferred_date ? ` · Wunschtermin ${formatDateDE(o.preferred_date)} ${o.preferred_time ?? ''}` : ''}</div>
          {o.assignee && <div className="text-xs text-cyan-deep mt-1">Ihr Team: {o.assignee.full_name ?? 'zugewiesen'}</div>}
        </div>
        <ChevronDown size={18} className={`text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <OrderDetails o={o} showContact={false} compact />
          {o.status === 'angebot' && <div className="rounded-xl bg-cyan/10 border border-cyan/30 px-4 py-3 text-sm">Ihr Angebot ist unterwegs – {business.owner} meldet sich per E-Mail oder Telefon. Fragen? Einfach per WhatsApp.</div>}
          {err && <div className="text-sm text-rose-500">{err}</div>}
          <div className="flex flex-wrap gap-2">
            {cancellable && <button onClick={cancel} disabled={busy} className="btn btn-ghost btn-sm"><X size={14} /> Stornieren</button>}
            {o.status === 'erledigt' && !review && <button onClick={() => setReview(true)} className="btn btn-primary btn-sm"><Star size={14} /> Bewertung abgeben</button>}
          </div>
          {review && <ReviewForm o={o} onDone={() => setReview(false)} />}
        </div>
      )}
    </motion.div>
  )
}

function ReviewForm({ o, onDone }: { o: OrderRow; onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('')
    try { await submitReview({ author_name: o.customer_name, email: o.customer_email, city: o.city ? `Berlin-${o.city === 'Berlin' ? '' : o.city}`.replace(/-$/, '') : 'Berlin', rating, text, order_id: o.id }); setMsg('Vielen Dank! Ihre Bewertung wird nach kurzer Prüfung veröffentlicht.'); setTimeout(onDone, 2500) } catch (err) { setMsg(errorText(err)) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={send} className="rounded-xl border border-line p-4 space-y-3">
      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} Sterne`}><Star size={22} className={n <= rating ? 'text-amber-400' : 'text-line'} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div>
      <Textarea label="Ihre Erfahrung" value={text} onChange={e => setText(e.target.value)} placeholder="Wie zufrieden waren Sie mit der Reinigung?" required minLength={10} />
      {msg && <div className="text-sm">{msg}</div>}
      <div className="flex gap-2"><button disabled={busy} className="btn btn-primary btn-sm">Absenden</button><button type="button" onClick={onDone} className="btn btn-ghost btn-sm">Abbrechen</button></div>
    </form>
  )
}

function ProfileCard({ name, phone, email, onSave }: { name: string; phone: string; email: string; onSave: (p: { full_name?: string; phone?: string }) => Promise<void> }) {
  const [n, setN] = useState(name), [p, setP] = useState(phone), [busy, setBusy] = useState(false), [msg, setMsg] = useState('')
  useEffect(() => { setN(name); setP(phone) }, [name, phone])
  return (
    <form onSubmit={async e => { e.preventDefault(); setBusy(true); setMsg(''); try { await onSave({ full_name: n, phone: p }); setMsg('Gespeichert.') } catch (err) { setMsg(errorText(err)) } finally { setBusy(false) } }} className="glass p-5 space-y-3">
      <h2 className="text-lg font-bold">Profil</h2>
      <Input label="Name / Firma" value={n} onChange={e => setN(e.target.value)} />
      <Input label="Telefon" value={p} onChange={e => setP(e.target.value)} type="tel" />
      <Input label="E-Mail" value={email} disabled />
      {msg && <div className="text-xs text-muted">{msg}</div>}
      <button disabled={busy} className="btn btn-dark btn-sm"><Save size={14} /> Speichern</button>
    </form>
  )
}
