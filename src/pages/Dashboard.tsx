import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { LayoutDashboard, Inbox, CalendarDays, Users, Star, LogOut, Search, Send, Check, Ban, UserCheck, Euro, Clock, ShieldCheck, ChevronDown, Trash2, Lock, Unlock, ChevronLeft, ChevronRight, Calculator, ExternalLink } from 'lucide-react'
import { Badge, Textarea } from '@/components/ui'
import { Loader, NotConfigured, ErrorBox, Skeleton } from '@/components/Loading'
import { OrderDetails } from '@/components/OrderDetails'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth'
import { allOrders, updateOrder, orderEvents, allProfiles, setRole, adminStats, allReviews, setReviewApproved, deleteReview, listBlockedSlots, toggleBlockedSlot } from '@/lib/orders'
import { supabase, statusLabel, statusTone, roleLabel, errorText, type OrderRow, type OrderStatus, type ProfileRow, type ReviewRow, type OrderEventRow, type UserRole } from '@/lib/supabase'
import { cleaningLabels, formatDateDE, weekdaysShort, euro } from '@/lib/labels'
import { SLOT_TIMES, addDays, todayISO, fromISO } from '@/lib/slots'
import { quote, fmtEur } from '@/lib/pricing'
import type { CleaningType, Profile } from '@/lib/types'

const nav = [
  { to: '/dashboard', label: 'Übersicht', icon: LayoutDashboard, end: true },
  { to: '/dashboard/anfragen', label: 'Anfragen', icon: Inbox },
  { to: '/dashboard/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/dashboard/team', label: 'Team & Nutzer', icon: Users },
  { to: '/dashboard/bewertungen', label: 'Bewertungen', icon: Star },
]
const statuses: OrderStatus[] = ['neu', 'besichtigung', 'angebot', 'bestaetigt', 'zugewiesen', 'in_arbeit', 'erledigt', 'storniert']

export default function Dashboard() {
  const { user, role, loading, configured, signOut, profile } = useAuth()
  const go = useNavigate()
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [team, setTeam] = useState<ProfileRow[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try { const [o, p] = await Promise.all([allOrders(), allProfiles()]); setOrders(o); setTeam(p) } catch (e) { setError(errorText(e)); setOrders([]); setTeam([]) }
  }, [])
  useEffect(() => { if (user && role === 'admin') load() }, [user, role, load])
  useEffect(() => {
    if (!user || role !== 'admin') return
    const ch = supabase.channel('admin-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, role, load])

  if (!configured) return <section className="pt-36 pb-20"><div className="container-x"><NotConfigured /></div></section>
  if (loading) return <section className="pt-36 pb-20"><div className="container-x"><Loader label="Dashboard wird geladen …" /></div></section>
  if (!user || role !== 'admin') {
    return <section className="pt-36 pb-20"><div className="container-x max-w-md text-center"><div className="glass p-8"><ShieldCheck className="mx-auto text-cyan-deep" size={36} /><h1 className="mt-4 text-2xl font-black">Inhaber-Dashboard</h1><p className="text-muted text-sm mt-2">{user ? 'Ihr Konto hat keine Admin-Rolle.' : 'Bitte melden Sie sich mit Ihrem Admin-Konto an.'}</p>{!user && <Link to="/login" className="btn btn-primary mt-6">Anmelden</Link>}</div></div></section>
  }
  const teamMembers = (team ?? []).filter(p => p.role === 'team' || p.role === 'admin')

  return (
    <section className="pt-24 sm:pt-28 pb-16 min-h-[100svh]">
      <div className="container-x grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="glass p-4 lg:sticky lg:top-24 self-start">
          <div className="px-2 pt-1 pb-3 border-b border-line mb-3"><Logo tagline={false} size={22} /><div className="text-xs text-muted mt-2">{profile?.full_name || user.email} · Admin</div></div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {nav.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `side-link whitespace-nowrap ${isActive ? 'active' : ''}`}><n.icon size={17} /> {n.label}</NavLink>)}
            <button onClick={async () => { await signOut(); go('/') }} className="side-link whitespace-nowrap"><LogOut size={17} /> Abmelden</button>
          </nav>
        </aside>
        <main className="min-w-0">
          {error && <div className="mb-4"><ErrorBox message={error} onRetry={load} /></div>}
          <Routes>
            <Route index element={<Overview orders={orders} />} />
            <Route path="anfragen" element={<Requests orders={orders} team={teamMembers} onChanged={load} />} />
            <Route path="kalender" element={<CalendarAdmin orders={orders} />} />
            <Route path="team" element={<TeamAdmin profiles={team} onChanged={load} />} />
            <Route path="bewertungen" element={<ReviewsAdmin />} />
          </Routes>
        </main>
      </div>
    </section>
  )
}

function H({ title, sub }: { title: string; sub?: string }) { return <div className="mb-5"><h1 className="text-2xl sm:text-3xl font-black">{title}</h1>{sub && <p className="text-sm text-muted mt-1">{sub}</p>}</div> }

/* ---------------- Übersicht ---------------- */
function Overview({ orders }: { orders: OrderRow[] | null }) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null)
  useEffect(() => { adminStats().then(setStats).catch(() => setStats(null)) }, [orders])
  const open = (orders ?? []).filter(o => o.status === 'neu' || o.status === 'besichtigung')
  const cards = stats ? [
    { l: 'Offene Anfragen', v: String(stats.open), d: 'warten auf Rückmeldung', i: Clock },
    { l: 'Laufende Aufträge', v: String(stats.active), d: 'Angebot bis in Arbeit', i: Inbox },
    { l: 'Erledigt', v: String(stats.done), d: `${stats.customers} Kund:innen`, i: Check },
    { l: 'Umsatz (netto)', v: euro(Number(stats.revenue)), d: 'erledigte Aufträge mit Preis', i: Euro },
  ] : null
  return (
    <div>
      <H title="Guten Tag 👋" sub={`Heute ist ${formatDateDE(todayISO(), { weekday: true })}. ${open.length ? `${open.length} neue Anfrage${open.length > 1 ? 'n' : ''} warten.` : 'Keine offenen Anfragen.'}`} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {(cards ?? Array(4).fill(null)).map((c, i) => c ? (
          <motion.div key={c.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass p-5"><div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider">{c.l}<c.i size={16} className="text-cyan-deep" /></div><div className="mt-2 font-display text-3xl font-black">{c.v}</div><div className="text-xs text-muted mt-1">{c.d}</div></motion.div>
        ) : <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="mt-6 grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <div className="glass p-5">
          <div className="font-bold">Anfragen pro Monat</div>
          <div className="h-56 mt-3">
            {stats ? stats.by_month.length ? (
              <ResponsiveContainer><BarChart data={stats.by_month.map(m => ({ ...m, label: m.month.slice(5) + '/' + m.month.slice(2, 4) }))}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" width={28} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-strong)' }} /><Bar dataKey="orders" name="Anfragen" fill="var(--cyan)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted">Noch keine Anfragen.</div> : <Skeleton className="h-full" />}
          </div>
        </div>
        <div className="glass p-5">
          <div className="font-bold flex items-center justify-between">Neueste Anfragen <Link to="/dashboard/anfragen" className="text-xs font-bold text-cyan-deep">Alle →</Link></div>
          <div className="mt-3 space-y-2">
            {orders === null ? <><Skeleton className="h-14" /><Skeleton className="h-14" /></> : (orders.slice(0, 6).map(o => (
              <Link to="/dashboard/anfragen" key={o.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-strong p-3 hover:border-cyan transition">
                <Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge>
                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{o.customer_name}</div><div className="text-xs text-muted truncate">{cleaningLabels[o.cleaning_type as CleaningType]} · {o.size_sqm} m² · {formatDateDE(o.created_at.slice(0, 10))}</div></div>
              </Link>
            )))}
            {orders?.length === 0 && <div className="text-sm text-muted">Sobald Kunden das Formular oder Clea nutzen, erscheinen die Anfragen hier.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Anfragen ---------------- */
function Requests({ orders, team, onChanged }: { orders: OrderRow[] | null; team: ProfileRow[]; onChanged: () => void }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'offen' | 'aktiv' | 'alle' | 'erledigt'>('offen')
  const [open, setOpen] = useState<string | null>(null)
  const list = useMemo(() => (orders ?? []).filter(o => {
    const f = filter === 'offen' ? ['neu', 'besichtigung'].includes(o.status) : filter === 'aktiv' ? ['angebot', 'bestaetigt', 'zugewiesen', 'in_arbeit'].includes(o.status) : filter === 'erledigt' ? ['erledigt', 'storniert'].includes(o.status) : true
    const s = q.trim().toLowerCase()
    return f && (!s || `${o.code} ${o.customer_name} ${o.customer_email} ${o.street} ${o.zip} ${o.city}`.toLowerCase().includes(s))
  }), [orders, filter, q])
  return (
    <div>
      <H title="Anfragen & Aufträge" sub="Alle Angaben des Kunden prüfen, Status setzen, Festpreis eintragen und ein Teammitglied zuweisen." />
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {(['offen', 'aktiv', 'erledigt', 'alle'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${filter === f ? 'bg-ink text-white border-transparent dark:bg-cyan-deep' : 'bg-surface-strong border-line hover:border-cyan'}`}>{f[0].toUpperCase() + f.slice(1)}</button>)}
        <div className="relative ms-auto min-w-[220px]"><Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Suchen: Name, Nr., Adresse" className="field !min-h-[42px] !py-2 ps-9" /></div>
      </div>
      {orders === null ? <Loader label="Anfragen werden geladen …" /> : list.length === 0 ? <div className="glass p-8 text-center text-sm text-muted">Keine Anfragen in dieser Ansicht.</div> : (
        <div className="space-y-3">{list.map(o => <RequestCard key={o.id} o={o} team={team} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} onChanged={onChanged} />)}</div>
      )}
    </div>
  )
}

function RequestCard({ o, team, open, onToggle, onChanged }: { o: OrderRow; team: ProfileRow[]; open: boolean; onToggle: () => void; onChanged: () => void }) {
  const [price, setPrice] = useState<string>(o.price?.toString() ?? '')
  const [status, setStatus] = useState<OrderStatus>(o.status)
  const [assignee, setAssignee] = useState<string>(o.assigned_to ?? '')
  const [notes, setNotes] = useState(o.admin_notes ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [events, setEvents] = useState<OrderEventRow[] | null>(null)
  useEffect(() => { setPrice(o.price?.toString() ?? ''); setStatus(o.status); setAssignee(o.assigned_to ?? ''); setNotes(o.admin_notes ?? '') }, [o])
  useEffect(() => { if (open) orderEvents(o.id).then(setEvents).catch(() => setEvents([])) }, [open, o.id, o.updated_at])

  // internal calculation hint (never shown to customers)
  const hint = useMemo(() => {
    try {
      const d = o.details as Record<string, any>
      const p: Partial<Profile> = { propertyType: o.property_type as any, cleaningType: o.cleaning_type as any, sizeSqm: o.size_sqm, frequency: (o.frequency ?? '') as any, timesPerPeriod: o.times_per_period, timeWindow: (o.time_window ?? '') as any, floorTypes: d.floorTypes ?? [], dirt: d.dirt ?? '', access: d.access ?? '', rooms: d.rooms, bathrooms: d.bathrooms, desks: d.desks, showers: d.showers, kitchenSize: d.kitchenSize ?? '', wasteBins: d.wasteBins, glassSqm: d.glassSqm, glassBothSides: !!d.glassBothSides, entrances: d.entrances, floorsCount: d.floorsCount, basement: d.basement, windows: d.windows, hours: d.hours, elevator: d.elevator, extras: d.extras ?? [] }
      return quote(p)
    } catch { return null }
  }, [o])

  const save = async (extra: Partial<OrderRow> = {}, opts: { notifyStatus?: boolean; notifyAssign?: boolean } = {}) => {
    setBusy(true); setMsg('')
    try {
      const patch: Record<string, unknown> = { status, price: price === '' ? null : Number(price.replace(',', '.')), admin_notes: notes || null, assigned_to: assignee || null, ...extra }
      await updateOrder(o.id, patch, opts); setMsg('Gespeichert.'); onChanged()
    } catch (e) { setMsg(errorText(e)) } finally { setBusy(false) }
  }
  const sendOffer = () => { setStatus('angebot'); save({ status: 'angebot' }, { notifyStatus: true }) }
  const assign = () => { const s: OrderStatus = status === 'neu' || status === 'besichtigung' || status === 'angebot' || status === 'bestaetigt' ? 'zugewiesen' : status; setStatus(s); save({ status: s }, { notifyAssign: true }) }

  return (
    <motion.div layout className="glass overflow-hidden">
      <button onClick={onToggle} className="w-full text-start p-5 flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap"><Badge tone={statusTone[o.status]}>{statusLabel[o.status]}</Badge><span className="text-xs text-muted">{o.code} · {o.source === 'ki' ? 'via Clea' : 'Website'} · {formatDateDE(o.created_at.slice(0, 10))}</span></div>
          <div className="mt-2 font-display font-bold text-lg">{o.customer_name}</div>
          <div className="text-sm text-muted">{cleaningLabels[o.cleaning_type as CleaningType] ?? o.cleaning_type} · {o.size_sqm} m² · {o.street}, {o.zip} {o.city}</div>
        </div>
        <div className="text-end text-sm">
          <div className="text-xs text-muted">Wunschtermin</div>
          <div className="font-display font-bold">{o.preferred_date ? formatDateDE(o.preferred_date, { weekday: true }) : 'nach Absprache'}</div>
          <div className="text-muted">{o.preferred_time ? `${o.preferred_time} Uhr` : ''}{o.assignee ? ` · ${o.assignee.full_name}` : ''}</div>
        </div>
        <ChevronDown size={18} className={`text-muted transition mt-1 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          <OrderDetails o={o} />
          <div className="grid lg:grid-cols-[1fr_300px] gap-4">
            <div className="rounded-2xl border border-line bg-surface-strong p-4 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className="lbl">Status</label><select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="field">{statuses.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}</select></div>
                <div><label className="lbl">Festpreis netto (€)</label><div className="relative"><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="field pe-9 font-display font-bold" placeholder="–" /><span className="absolute end-4 top-1/2 -translate-y-1/2 text-muted">€</span></div></div>
                <div><label className="lbl">Teammitglied</label><select value={assignee} onChange={e => setAssignee(e.target.value)} className="field"><option value="">– nicht zugewiesen –</option>{team.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}{t.role === 'admin' ? ' (Admin)' : ''}</option>)}</select></div>
              </div>
              <Textarea label="Interne Notiz / Hinweis fürs Team" value={notes} onChange={e => setNotes(e.target.value)} placeholder="z. B. Schlüssel im Büro, Besichtigung am …" />
              {msg && <div className="text-sm text-muted">{msg}</div>}
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => save({}, { notifyStatus: status !== o.status })} className="btn btn-dark btn-sm"><Check size={14} /> Speichern</button>
                {['neu', 'besichtigung'].includes(o.status) && <button disabled={busy} onClick={sendOffer} className="btn btn-primary btn-sm"><Send size={14} /> Angebot senden</button>}
                <button disabled={busy || !assignee} onClick={assign} className="btn btn-primary btn-sm"><UserCheck size={14} /> Zuweisen & benachrichtigen</button>
                {o.status !== 'storniert' && o.status !== 'erledigt' && <button disabled={busy} onClick={() => { setStatus('storniert'); save({ status: 'storniert' }, { notifyStatus: true }) }} className="btn btn-ghost btn-sm"><Ban size={14} /> Stornieren</button>}
                <a href={`mailto:${o.customer_email}?subject=${encodeURIComponent(`Ihre Anfrage ${o.code} – Glanzgeschwister`)}`} className="btn btn-ghost btn-sm"><ExternalLink size={14} /> E-Mail an Kunde</a>
              </div>
            </div>
            <div className="space-y-3">
              {hint && (
                <div className="rounded-2xl p-4 text-white text-sm" style={{ background: 'linear-gradient(150deg, var(--ink-2), var(--ink))' }}>
                  <div className="flex items-center gap-2 font-bold"><Calculator size={16} className="text-cyan" /> Kalkulationshilfe <span className="text-[10px] font-normal text-white/60">intern</span></div>
                  {hint.needsInspection ? <div className="mt-2 text-white/80">Fläche außerhalb 20–5.000 m² oder unter Sicherheitsgrenze – bitte manuell kalkulieren.</div> : (
                    <ul className="mt-2 space-y-1 text-white/85">
                      <li className="flex justify-between"><span>{hint.serviceLabel}</span><b>{fmtEur(hint.perVisitNet)} € / Einsatz</b></li>
                      {hint.recurring && <li className="flex justify-between"><span>{hint.visitsPerMonth.toLocaleString('de-DE', { maximumFractionDigits: 1 })} Einsätze / Monat</span><b>{fmtEur(Math.round(hint.monthlyNet))} € netto</b></li>}
                      <li className="flex justify-between text-white/70"><span>Arbeitszeit</span><span>ca. {hint.hoursPerVisit.toFixed(1).replace('.', ',')} Std.</span></li>
                      {hint.minimumApplied && <li className="text-white/60 text-xs">Mindestpreis greift</li>}
                    </ul>
                  )}
                  {!hint.needsInspection && <button onClick={() => setPrice(String(hint.perVisitNet))} className="mt-3 text-xs font-bold text-cyan underline underline-offset-4">Als Festpreis übernehmen</button>}
                </div>
              )}
              <div className="rounded-2xl border border-line bg-surface-strong p-4 text-sm">
                <div className="font-bold mb-2">Verlauf</div>
                {events === null ? <Skeleton className="h-16" /> : events.length === 0 ? <div className="text-muted">–</div> : <ul className="space-y-1.5">{events.map(e => <li key={e.id} className="flex gap-2 text-xs"><span className="text-muted whitespace-nowrap">{new Date(e.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><span>{e.message}</span></li>)}</ul>}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ---------------- Kalender ---------------- */
function CalendarAdmin({ orders }: { orders: OrderRow[] | null }) {
  const [start, setStart] = useState(() => { const d = fromISO(todayISO()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10) })
  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i))
  const [blocked, setBlocked] = useState<Set<string> | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const load = useCallback(() => listBlockedSlots(days[0], days[5]).then(rows => setBlocked(new Set(rows.map(r => `${r.slot_date}T${r.slot_time.slice(0, 5)}`)))).catch(() => setBlocked(new Set())), [start]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setBlocked(null); load() }, [load])
  const byKey = useMemo(() => { const m = new Map<string, OrderRow[]>(); (orders ?? []).forEach(o => { if (o.preferred_date && o.preferred_time && o.status !== 'storniert') { const k = `${o.preferred_date}T${o.preferred_time.slice(0, 5)}`; m.set(k, [...(m.get(k) ?? []), o]) } }); return m }, [orders])
  const toggle = async (d: string, t: string) => { setBusy(`${d}T${t}`); try { await toggleBlockedSlot(d, t); await load() } finally { setBusy(null) } }
  return (
    <div>
      <H title="Wochenkalender" sub="Wunschtermine der Kunden und gesperrte Zeitfenster. Klicken Sie auf ein freies Fenster, um es zu sperren (z. B. Urlaub)." />
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setStart(addDays(start, -7))} className="btn btn-ghost btn-sm"><ChevronLeft size={16} /> Vorige Woche</button>
        <div className="font-display font-bold">{formatDateDE(days[0])} – {formatDateDE(days[5])}</div>
        <button onClick={() => setStart(addDays(start, 7))} className="btn btn-ghost btn-sm">Nächste Woche <ChevronRight size={16} /></button>
      </div>
      <div className="glass p-3 overflow-x-auto">
        <div className="grid min-w-[720px]" style={{ gridTemplateColumns: '70px repeat(6, 1fr)' }}>
          <div />{days.map((d, i) => <div key={d} className={`text-center text-xs font-bold py-2 ${d === todayISO() ? 'text-cyan-deep' : 'text-muted'}`}>{weekdaysShort[i]} {d.slice(8)}.{d.slice(5, 7)}.</div>)}
          {SLOT_TIMES.map(t => (<>
            <div key={t} className="text-xs text-muted py-3 pe-2 text-end">{t}</div>
            {days.map(d => {
              const k = `${d}T${t}`; const os = byKey.get(k) ?? []; const isBlocked = blocked?.has(k); const past = d < todayISO()
              return (
                <div key={k} className="p-1">
                  {os.length ? os.map(o => <Link to="/dashboard/anfragen" key={o.id} className="block rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white mb-1 truncate" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }} title={`${o.customer_name} · ${o.code}`}>{o.customer_name}</Link>) : (
                    <button disabled={past || busy === k || blocked === null} onClick={() => toggle(d, t)} className={`w-full h-11 rounded-lg border text-[11px] font-semibold transition flex items-center justify-center gap-1 ${isBlocked ? 'bg-rose-500/15 border-rose-400/40 text-rose-500' : 'border-dashed border-line text-muted hover:border-cyan'} ${past ? 'opacity-30' : ''}`}>
                      {blocked === null ? '…' : isBlocked ? <><Lock size={12} /> gesperrt</> : <><Unlock size={12} /> frei</>}
                    </button>
                  )}
                </div>
              )
            })}
          </>))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Team & Nutzer ---------------- */
function TeamAdmin({ profiles, onChanged }: { profiles: ProfileRow[] | null; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const change = async (id: string, role: UserRole) => { setBusy(id); setMsg(''); try { await setRole(id, role); onChanged() } catch (e) { setMsg(errorText(e)) } finally { setBusy(null) } }
  const groups: [string, ProfileRow[]][] = [['Team', (profiles ?? []).filter(p => p.role === 'team')], ['Administratoren', (profiles ?? []).filter(p => p.role === 'admin')], ['Kunden', (profiles ?? []).filter(p => p.role === 'client')]]
  return (
    <div>
      <H title="Team & Nutzer" sub="Registrierte Nutzer und ihre Rolle. Ein Teammitglied registriert sich zuerst auf der Website – danach setzen Sie hier die Rolle „Team“, damit Sie Aufträge zuweisen können." />
      {msg && <div className="mb-3 text-sm text-rose-500">{msg}</div>}
      {profiles === null ? <Loader label="Nutzer werden geladen …" /> : groups.map(([title, list]) => (
        <div key={title} className="glass p-5 mb-4">
          <div className="font-bold mb-3">{title} <span className="text-muted text-sm">({list.length})</span></div>
          {list.length === 0 ? <div className="text-sm text-muted">Noch niemand in dieser Gruppe.</div> : (
            <div className="divide-y divide-line">{list.map(p => (
              <div key={p.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-full grid place-items-center text-white font-bold shrink-0" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}>{(p.full_name || p.email)[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-[180px]"><div className="font-semibold">{p.full_name || '–'}</div><div className="text-xs text-muted">{p.email}{p.phone ? ` · ${p.phone}` : ''} · seit {formatDateDE(p.created_at.slice(0, 10))}</div></div>
                <select value={p.role} disabled={busy === p.id} onChange={e => change(p.id, e.target.value as UserRole)} className="field !w-[150px] !min-h-[40px] !py-1.5">{(['client', 'team', 'admin'] as UserRole[]).map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}</select>
              </div>
            ))}</div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------------- Bewertungen ---------------- */
function ReviewsAdmin() {
  const [list, setList] = useState<ReviewRow[] | null>(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => allReviews().then(setList).catch(e => { setErr(errorText(e)); setList([]) }), [])
  useEffect(() => { load() }, [load])
  const act = async (fn: () => Promise<void>) => { try { await fn(); await load() } catch (e) { setErr(errorText(e)) } }
  return (
    <div>
      <H title="Bewertungen" sub="Neue Bewertungen erscheinen erst nach Ihrer Freigabe auf der Startseite." />
      {err && <ErrorBox message={err} onRetry={load} />}
      {list === null ? <Loader label="Bewertungen werden geladen …" /> : list.length === 0 ? <div className="glass p-8 text-center text-sm text-muted">Noch keine Bewertungen.</div> : (
        <div className="space-y-3">{list.map(r => (
          <div key={r.id} className="glass p-5 flex flex-wrap gap-4 items-start">
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 flex-wrap"><span className="flex text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />)}</span><Badge tone={r.approved ? 'green' : 'amber'}>{r.approved ? 'Veröffentlicht' : 'Wartet auf Freigabe'}</Badge><span className="text-xs text-muted">{formatDateDE(r.created_at.slice(0, 10))}</span></div>
              <div className="mt-2 font-semibold">{r.author_name}{r.city ? ` · ${r.city}` : ''} <span className="text-xs text-muted">{r.email}</span></div>
              <p className="mt-1 text-sm">{r.text}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => act(() => setReviewApproved(r.id, !r.approved))} className={`btn btn-sm ${r.approved ? 'btn-ghost' : 'btn-primary'}`}>{r.approved ? 'Verbergen' : <><Check size={14} /> Freigeben</>}</button>
              <button onClick={() => { if (confirm('Bewertung löschen?')) act(() => deleteReview(r.id)) }} className="btn btn-ghost btn-sm text-rose-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
