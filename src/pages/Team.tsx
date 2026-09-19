import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Play, MapPin, Navigation, Phone, ChevronDown, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui'
import { Loader, NotConfigured, ErrorBox } from '@/components/Loading'
import { OrderDetails } from '@/components/OrderDetails'
import { useAuth } from '@/lib/auth'
import { assignedOrders, setOrderStatus } from '@/lib/orders'
import { supabase, statusLabel, statusTone, errorText, type OrderRow } from '@/lib/supabase'
import { cleaningLabels, formatDateDE } from '@/lib/labels'
import type { CleaningType } from '@/lib/types'

/** Team member area: the orders assigned to me, with start / done actions. */
export default function Team() {
  const { user, role, loading, configured, profile } = useAuth()
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => { setError(''); try { setOrders(await assignedOrders()) } catch (e) { setError(errorText(e)); setOrders([]) } }, [])
  useEffect(() => { if (user && (role === 'team' || role === 'admin')) load() }, [user, role, load])
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('team-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, load])

  if (!configured) return <section className="pt-36 pb-20"><div className="container-x"><NotConfigured /></div></section>
  if (loading) return <section className="pt-36 pb-20"><div className="container-x"><Loader label="Einsätze werden geladen …" /></div></section>
  if (!user || (role !== 'team' && role !== 'admin')) {
    return <section className="pt-36 pb-20"><div className="container-x max-w-md text-center"><div className="glass p-8"><ClipboardList className="mx-auto text-cyan-deep" size={36} /><h1 className="mt-4 text-2xl font-black">Team-Bereich</h1><p className="text-muted text-sm mt-2">Dieser Bereich ist für Mitglieder des Reinigungsteams. {user ? 'Ihr Konto hat noch keine Team-Rolle – bitte bei der Inhaberin melden.' : ''}</p>{!user && <Link to="/login" className="btn btn-primary mt-6">Anmelden</Link>}</div></div></section>
  }

  const todo = (orders ?? []).filter(o => !['erledigt', 'storniert'].includes(o.status))
  const done = (orders ?? []).filter(o => o.status === 'erledigt')

  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x">
        <span className="eyebrow">Team</span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black">Meine Einsätze{profile?.full_name ? ` · ${profile.full_name.split(' ')[0]}` : ''}</h1>
        <p className="text-muted mt-2 text-sm">Alle Aufträge, die Ihnen zugewiesen wurden – mit Adresse, Details und Kundenkontakt.</p>
        {error && <div className="mt-6"><ErrorBox message={error} onRetry={load} /></div>}
        <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-3">
            {orders === null ? <Loader label="Einsätze werden geladen …" /> : todo.length === 0 ? (
              <div className="glass p-8 text-center text-sm text-muted">Aktuell sind Ihnen keine offenen Einsätze zugewiesen.</div>
            ) : todo.map(o => <TeamOrder key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} onChanged={load} />)}
          </div>
          <div className="glass p-5">
            <h2 className="font-bold">Erledigt</h2>
            <div className="mt-3 space-y-2 text-sm">
              {done.length === 0 && <div className="text-muted">Noch keine erledigten Einsätze.</div>}
              {done.slice(0, 12).map(o => <div key={o.id} className="flex items-center justify-between gap-2 border-b border-line pb-2"><span className="truncate">{o.code} · {o.customer_name}</span><span className="text-xs text-muted">{o.completed_at ? formatDateDE(o.completed_at.slice(0, 10)) : ''}</span></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TeamOrder({ o, open, onToggle, onChanged }: { o: OrderRow; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = async (s: 'in_arbeit' | 'erledigt') => {
    if (s === 'erledigt' && !confirm('Einsatz als erledigt markieren?')) return
    setBusy(true); setErr('')
    try { await setOrderStatus(o.id, s); onChanged() } catch (e) { setErr(errorText(e)) } finally { setBusy(false) }
  }
  const route = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${o.street}, ${o.zip} ${o.city}`)}`
  return (
    <motion.div layout className="glass overflow-hidden">
      <button onClick={onToggle} className="w-full text-start p-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap"><Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge><span className="text-xs text-muted">{o.code}</span></div>
          <div className="mt-1.5 font-display font-bold text-lg">{o.customer_name}</div>
          <div className="text-sm text-muted flex items-center gap-1"><MapPin size={13} /> {o.street}, {o.zip} {o.city}</div>
          <div className="text-sm text-muted">{cleaningLabels[o.cleaning_type as CleaningType] ?? o.cleaning_type} · {o.size_sqm} m²{o.preferred_date ? ` · ${formatDateDE(o.preferred_date, { weekday: true })} ${o.preferred_time ?? ''}` : ''}</div>
        </div>
        <ChevronDown size={18} className={`text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          <OrderDetails o={o} />
          {o.admin_notes && <div className="rounded-xl bg-cyan/10 border border-cyan/30 px-4 py-3 text-sm"><b>Hinweis der Inhaberin:</b> {o.admin_notes}</div>}
          {err && <div className="text-sm text-rose-500">{err}</div>}
          <div className="flex flex-wrap gap-2">
            <a href={route} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Navigation size={14} /> Route</a>
            <a href={`tel:${o.customer_phone}`} className="btn btn-ghost btn-sm"><Phone size={14} /> Kunde anrufen</a>
            {o.status !== 'in_arbeit' && <button disabled={busy} onClick={() => set('in_arbeit')} className="btn btn-dark btn-sm"><Play size={14} /> Einsatz starten</button>}
            <button disabled={busy} onClick={() => set('erledigt')} className="btn btn-primary btn-sm"><CheckCircle2 size={14} /> Erledigt</button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
