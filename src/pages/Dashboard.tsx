import { useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { LayoutDashboard, Inbox, CalendarDays, Users, UsersRound, Settings, TrendingUp, Euro, Star, Clock, MapPin, Send, ChevronLeft, ChevronRight, Ban, KeyRound, LogOut, Bot, Check } from 'lucide-react'
import { store, useStore } from '@/lib/store'
import { revenueByMonth, serviceMix, team } from '@/lib/data'
import { Badge } from '@/components/ui'
import { Counter } from '@/components/motion'
import { cleaningLabels, euro, extraLabel, formatDateDE, frequencyLabels, propertyLabels, statusLabels, weekdaysShort } from '@/lib/labels'
import { SLOT_TIMES, addDays, fromISO, isBusinessDay, toISO, todayISO } from '@/lib/slots'
import { useTheme } from '@/components/theme'
import type { Appointment, AppointmentStatus } from '@/lib/types'

const tone: Record<AppointmentStatus, 'cyan' | 'green' | 'amber' | 'red' | 'gray'> = { anfrage: 'amber', angebot: 'cyan', bestaetigt: 'green', erledigt: 'gray', storniert: 'red' }
const nav = [
  { to: '/dashboard', label: 'Übersicht', icon: LayoutDashboard, end: true },
  { to: '/dashboard/anfragen', label: 'Anfragen & Preise', icon: Inbox },
  { to: '/dashboard/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/dashboard/kunden', label: 'Kunden', icon: Users },
  { to: '/dashboard/team', label: 'Team', icon: UsersRound },
  { to: '/dashboard/einstellungen', label: 'Einstellungen', icon: Settings },
]

export default function Dashboard() {
  const user = useStore(s => s.user)
  const loc = useLocation()
  const open = useStore(s => s.appointments.filter(a => a.status === 'anfrage').length)

  if (!user || user.role !== 'inhaber') {
    return (
      <section className="pt-36 pb-20"><div className="container-x max-w-md text-center"><div className="glass p-8">
        <KeyRound className="mx-auto text-cyan-deep" size={36} /><h1 className="mt-4 text-2xl font-black">Inhaber-Dashboard</h1>
        <p className="text-muted text-sm mt-2">Dieser Bereich ist für den Geschäftsinhaber. Für die Demo können Sie sich direkt als Inhaber anmelden.</p>
        <button onClick={() => store.login('inhaber@clean-shine.de')} className="btn btn-primary mt-6">Als Demo-Inhaber anmelden</button>
      </div></div></section>
    )
  }

  return (
    <section className="pt-24 sm:pt-28 pb-10 min-h-[100svh]">
      <div className="container-x grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="lg:sticky lg:top-28 self-start">
          <div className="glass p-3">
            <div className="px-3 py-2 text-[11px] font-bold tracking-[.2em] text-muted uppercase hidden lg:block">Inhaber</div>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scroll-thin -mx-1 px-1">
              {nav.map(n => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `side-link shrink-0 ${isActive ? 'active' : ''}`}>
                  <n.icon size={18} /><span className="whitespace-nowrap">{n.label}</span>
                  {n.to.endsWith('anfragen') && open > 0 && <span className="ms-auto text-[10px] font-black rounded-full bg-amber-400 text-ink px-1.5 py-0.5">{open}</span>}
                </NavLink>
              ))}
            </nav>
            <div className="hidden lg:block border-t border-line mt-3 pt-3 px-1">
              <div className="text-xs text-muted truncate px-2">{user.email}</div>
              <button onClick={() => store.logout()} className="side-link w-full mt-1"><LogOut size={16} /> Abmelden</button>
            </div>
          </div>
        </aside>
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <Routes>
              <Route index element={<Overview />} />
              <Route path="anfragen" element={<Requests />} />
              <Route path="kalender" element={<CalendarView />} />
              <Route path="kunden" element={<Customers />} />
              <Route path="team" element={<Team />} />
              <Route path="einstellungen" element={<SettingsView />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function H({ title, sub }: { title: string; sub?: string }) { return <div className="mb-5"><h1 className="text-2xl sm:text-3xl font-black">{title}</h1>{sub && <p className="text-sm text-muted mt-1">{sub}</p>}</div> }

function Overview() {
  const appts = useStore(s => s.appointments)
  const { theme } = useTheme()
  const today = todayISO()
  const upcoming = appts.filter(a => a.date >= today && a.status !== 'storniert').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5)
  const open = appts.filter(a => a.status === 'anfrage')
  const monthRevenue = revenueByMonth[revenueByMonth.length - 1].umsatz
  const ink = theme === 'dark' ? '#9dbac2' : '#5b7078'
  const tip = { contentStyle: { background: 'var(--surface-strong)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12, color: 'var(--text)' }, cursor: { stroke: 'var(--line)' } }
  return (
    <div>
      <H title={`Guten Tag 👋`} sub={`Heute ist ${formatDateDE(today, { weekday: true })}. ${open.length ? `${open.length} neue Anfrage${open.length > 1 ? 'n' : ''} warten auf einen Preis.` : 'Keine offenen Anfragen.'}`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { l: 'Umsatz September', v: <Counter to={monthRevenue} prefix="" suffix=" €" />, d: '+8,2 % zum Vormonat', i: Euro },
          { l: 'Aufträge (30 Tage)', v: <Counter to={68} />, d: '+5 zum Vormonat', i: TrendingUp },
          { l: 'Ø Bewertung', v: '4,9', d: '1.240 Bewertungen', i: Star },
          { l: 'Offene Anfragen', v: String(open.length), d: 'Preis festlegen', i: Clock },
        ].map(k => (
          <div key={k.l} className="glass p-5"><div className="flex items-center justify-between text-muted text-xs font-semibold"><span>{k.l}</span><k.i size={16} className="text-cyan-deep" /></div><div className="mt-2 font-display text-2xl sm:text-3xl font-black">{k.v}</div><div className="text-xs text-muted mt-1">{k.d}</div></div>
        ))}
      </div>
      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-4 mt-4">
        <div className="glass p-5">
          <div className="font-display font-bold">Umsatz je Monat <span className="text-muted font-normal text-xs">(EUR)</span></div>
          <div className="h-[240px] mt-3">
            <ResponsiveContainer><AreaChart data={revenueByMonth} margin={{ left: -10, right: 8, top: 10 }}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1fc0e4" stopOpacity=".45" /><stop offset="1" stopColor="#1fc0e4" stopOpacity="0" /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="m" tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip {...tip} formatter={(v) => [euro(Number(v)), 'Umsatz']} />
              <Area type="monotone" dataKey="umsatz" stroke="#0aa3c7" strokeWidth={2} fill="url(#rev)" dot={{ r: 4, fill: '#0aa3c7', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart></ResponsiveContainer>
          </div>
        </div>
        <div className="glass p-5">
          <div className="font-display font-bold">Leistungsmix <span className="text-muted font-normal text-xs">(% der Aufträge)</span></div>
          <div className="h-[240px] mt-3">
            <ResponsiveContainer><BarChart data={serviceMix} layout="vertical" margin={{ left: 0, right: 30 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={70} tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip {...tip} formatter={(v) => [`${v} %`, 'Anteil']} cursor={{ fill: 'var(--line)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} label={{ position: 'right', fill: ink, fontSize: 12, formatter: (v: unknown) => `${v} %` }}>
                {serviceMix.map((_, i) => <Cell key={i} fill={['#0aa3c7', '#1fc0e4', '#5fd3ec', '#8fdff2', '#b9eef9'][i]} />)}
              </Bar>
            </BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid xl:grid-cols-2 gap-4 mt-4">
        <div className="glass p-5">
          <div className="flex items-center justify-between"><div className="font-display font-bold">Nächste Termine</div><Link to="/dashboard/kalender" className="text-xs font-bold text-cyan-deep">Kalender →</Link></div>
          <ul className="mt-3 divide-y divide-line">{upcoming.map(a => (
            <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
              <div className="w-12 text-center rounded-xl bg-cyan/15 py-1.5"><div className="text-[10px] font-bold text-cyan-deep uppercase">{weekdaysShort[(fromISO(a.date).getDay() + 6) % 7]}</div><div className="font-display font-black">{a.date.slice(-2)}</div></div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate">{a.customer.name}</div><div className="text-xs text-muted truncate">{a.time} Uhr · {a.customer.city} · {cleaningLabels[a.customer.cleaningType as keyof typeof cleaningLabels]}</div></div>
              <Badge tone={tone[a.status]}>{statusLabels[a.status]}</Badge>
            </li>))}</ul>
        </div>
        <div className="glass p-5">
          <div className="flex items-center justify-between"><div className="font-display font-bold">Neue Anfragen</div><Link to="/dashboard/anfragen" className="text-xs font-bold text-cyan-deep">Alle →</Link></div>
          {open.length === 0 && <p className="text-sm text-muted mt-3">Alles erledigt 🎉</p>}
          <ul className="mt-3 divide-y divide-line">{open.slice(0, 4).map(a => (
            <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-full grid place-items-center bg-amber-400/20 text-amber-600">{a.source === 'ki' ? <Bot size={16} /> : <Inbox size={16} />}</div>
              <div className="flex-1 min-w-0"><div className="font-semibold truncate">{a.customer.name}</div><div className="text-xs text-muted truncate">{a.customer.sizeSqm} m² · {a.customer.city} · Spanne {a.estimate[0]}–{a.estimate[1]} €</div></div>
              <Link to="/dashboard/anfragen" className="btn btn-dark btn-sm">Preis</Link>
            </li>))}</ul>
        </div>
      </div>
    </div>
  )
}

function Requests() {
  const appts = useStore(s => s.appointments)
  const [filter, setFilter] = useState<AppointmentStatus | 'alle'>('anfrage')
  const list = appts.filter(a => filter === 'alle' || a.status === filter).sort((a, b) => (b.createdAt + b.id).localeCompare(a.createdAt + a.id))
  return (
    <div>
      <H title="Anfragen & Preise" sub="Prüfen Sie Ort, Fläche und Angaben, legen Sie den Festpreis fest und senden Sie das Angebot." />
      <div className="flex flex-wrap gap-2 mb-5">{(['anfrage', 'angebot', 'bestaetigt', 'erledigt', 'storniert', 'alle'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-xs font-bold border transition ${filter === f ? 'bg-ink text-white border-transparent dark:bg-cyan-deep' : 'border-line bg-surface-strong hover:border-cyan'}`}>{f === 'alle' ? 'Alle' : statusLabels[f]} <span className="opacity-60">{appts.filter(a => f === 'alle' || a.status === f).length}</span></button>)}</div>
      {list.length === 0 && <div className="glass p-8 text-center text-muted text-sm">Keine Einträge.</div>}
      <div className="space-y-4">{list.map(a => <RequestCard key={a.id} a={a} />)}</div>
    </div>
  )
}

function RequestCard({ a }: { a: Appointment }) {
  const [price, setPrice] = useState<number>(a.price ?? Math.round((a.estimate[0] + a.estimate[1]) / 2 / 5) * 5)
  const [teamSel, setTeamSel] = useState(a.team ?? team[0].name)
  const c = a.customer
  return (
    <motion.div layout className="glass p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap"><Badge tone={tone[a.status]}>{statusLabels[a.status]}</Badge><span className="text-xs text-muted">{a.code} · {a.source === 'ki' ? 'via Clea (KI)' : a.source === 'web' ? 'via Website' : 'telefonisch'} · eingegangen {formatDateDE(a.createdAt)}</span></div>
          <div className="mt-2 font-display font-bold text-lg">{c.name}</div>
          <div className="text-sm text-muted">{c.email} · {c.phone}</div>
        </div>
        <div className="text-end"><div className="text-xs text-muted">Wunschtermin</div><div className="font-display font-bold">{formatDateDE(a.date, { weekday: true })}</div><div className="text-sm text-muted">{a.time} Uhr · ca. {a.durationH} Std.</div></div>
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-line bg-surface-strong p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1"><MapPin size={12} /> Ort</div><div className="mt-1 font-semibold">{c.street}</div><div>{c.zip} {c.city}</div><div className="text-muted text-xs mt-1">Etage {c.floor || '–'} · Aufzug {c.elevator ? 'ja' : 'nein'}</div></div>
        <div className="rounded-xl border border-line bg-surface-strong p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-muted">Objekt</div><div className="mt-1 font-semibold">{propertyLabels[c.propertyType as keyof typeof propertyLabels]} · {c.sizeSqm} m²</div><div>{c.rooms} Zimmer · {c.bathrooms} Bad</div><div className="text-muted text-xs mt-1">Haustiere: {c.pets ? 'ja' : 'nein'}</div></div>
        <div className="rounded-xl border border-line bg-surface-strong p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-muted">Leistung</div><div className="mt-1 font-semibold">{cleaningLabels[c.cleaningType as keyof typeof cleaningLabels]}</div><div>{frequencyLabels[c.frequency as keyof typeof frequencyLabels]}</div><div className="text-muted text-xs mt-1">{c.extras.length ? c.extras.map(extraLabel).join(', ') : 'keine Extras'}</div></div>
      </div>
      {c.notes && <div className="mt-3 text-sm rounded-xl bg-amber-400/10 border border-amber-400/30 px-3 py-2">📝 {c.notes}</div>}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
        <div><label className="lbl">Festpreis (Spanne {a.estimate[0]}–{a.estimate[1]} €)</label><div className="relative"><input type="number" value={price} onChange={e => setPrice(+e.target.value)} className="field !w-[150px] pe-9 font-display font-bold" disabled={a.status === 'erledigt' || a.status === 'storniert'} /><span className="absolute end-4 top-1/2 -translate-y-1/2 text-muted">€</span></div></div>
        <div><label className="lbl">Team</label><select value={teamSel} onChange={e => setTeamSel(e.target.value)} className="field !w-[170px]">{team.map(t => <option key={t.name}>{t.name}</option>)}</select></div>
        <div className="flex gap-2 ms-auto flex-wrap">
          {a.status === 'anfrage' && <button onClick={() => store.updateAppointment(a.id, { price, team: teamSel, status: 'angebot' })} className="btn btn-primary btn-sm"><Send size={14} /> Angebot senden</button>}
          {a.status === 'angebot' && <button onClick={() => store.updateAppointment(a.id, { price, team: teamSel, status: 'bestaetigt' })} className="btn btn-primary btn-sm"><Check size={14} /> Als bestätigt markieren</button>}
          {a.status === 'bestaetigt' && <button onClick={() => store.updateAppointment(a.id, { status: 'erledigt' })} className="btn btn-dark btn-sm"><Check size={14} /> Erledigt</button>}
          {(a.status === 'anfrage' || a.status === 'angebot' || a.status === 'bestaetigt') && <button onClick={() => store.updateAppointment(a.id, { status: 'storniert' })} className="btn btn-ghost btn-sm"><Ban size={14} /> Stornieren</button>}
        </div>
      </div>
    </motion.div>
  )
}

function CalendarView() {
  const { appointments, blocked } = useStore(s => ({ appointments: s.appointments, blocked: s.blockedSlots }))
  const [start, setStart] = useState(() => { const d = fromISO(todayISO()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d) })
  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(start, i)), [start])
  const today = todayISO()
  return (
    <div>
      <H title="Kalender" sub="Woche im Überblick. Klicken Sie auf ein freies Feld, um es zu sperren (z. B. Urlaub), erneut klicken gibt es frei." />
      <div className="glass p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setStart(addDays(start, -7))} className="w-10 h-10 grid place-items-center rounded-full border border-line hover:border-cyan"><ChevronLeft size={18} className="rtl:rotate-180" /></button>
          <div className="font-display font-bold text-sm sm:text-base">{formatDateDE(days[0])} – {formatDateDE(days[5])}</div>
          <button onClick={() => setStart(addDays(start, 7))} className="w-10 h-10 grid place-items-center rounded-full border border-line hover:border-cyan"><ChevronRight size={18} className="rtl:rotate-180" /></button>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <div className="min-w-[640px] grid" style={{ gridTemplateColumns: '56px repeat(6, 1fr)' }}>
            <div />
            {days.map(d => <div key={d} className={`text-center text-xs font-bold py-2 ${d === today ? 'text-cyan-deep' : 'text-muted'}`}>{weekdaysShort[(fromISO(d).getDay() + 6) % 7]}<div className={`font-display text-lg ${d === today ? 'text-cyan-deep' : 'text-text'}`}>{d.slice(-2)}</div></div>)}
            {SLOT_TIMES.map(t => (
              <div key={t} className="contents">
                <div className="text-xs text-muted py-3 pe-2 text-end">{t}</div>
                {days.map(d => {
                  const appt = appointments.find(a => a.date === d && a.time === t && a.status !== 'storniert')
                  const isBlocked = blocked.includes(`${d}T${t}`)
                  const closed = !isBusinessDay(d) || d < today
                  return (
                    <div key={d + t} className="p-1">
                      {appt ? (
                        <div className={`rounded-xl p-2 text-[11px] leading-tight h-full min-h-[58px] ${appt.status === 'bestaetigt' ? 'bg-cyan text-white' : appt.status === 'erledigt' ? 'bg-muted/20 text-muted' : 'bg-amber-400/25 text-text'}`}>
                          <div className="font-bold truncate">{appt.customer.name}</div><div className="opacity-80 truncate">{appt.customer.city} · {appt.durationH} h</div><div className="opacity-80 truncate">{statusLabels[appt.status]}</div>
                        </div>
                      ) : (
                        <button disabled={closed} onClick={() => store.toggleBlock(d, t)} className={`w-full min-h-[58px] rounded-xl border text-[11px] font-semibold transition ${closed ? 'border-transparent bg-line/40 text-transparent' : isBlocked ? 'border-rose-400/40 bg-rose-400/15 text-rose-500' : 'border-dashed border-line text-muted hover:border-cyan hover:text-cyan-deep'}`}>{isBlocked ? 'Gesperrt' : closed ? '' : 'frei'}</button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded bg-cyan inline-block" /> bestätigt</span><span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded bg-amber-400/50 inline-block" /> Anfrage / Angebot</span><span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded bg-rose-400/40 inline-block" /> gesperrt</span><span>Sonntag geschlossen</span></div>
      </div>
    </div>
  )
}

function Customers() {
  const appts = useStore(s => s.appointments)
  const customers = useMemo(() => {
    const m = new Map<string, { name: string; city: string; email: string; phone: string; count: number; revenue: number; last: string }>()
    appts.forEach(a => { const k = a.customer.email || a.customer.name; const e = m.get(k) ?? { name: a.customer.name, city: a.customer.city, email: a.customer.email, phone: a.customer.phone, count: 0, revenue: 0, last: '' }; e.count++; if (a.status === 'erledigt' && a.price) e.revenue += a.price; if (a.date > e.last) e.last = a.date; m.set(k, e) })
    return [...m.values()].sort((a, b) => b.count - a.count)
  }, [appts])
  return (
    <div>
      <H title="Kunden" sub={`${customers.length} Kundenprofile · alle Angaben werden für Folgebuchungen gespeichert.`} />
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto scroll-thin"><table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-start text-[11px] uppercase tracking-wider text-muted border-b border-line">{['Kunde', 'Ort', 'Kontakt', 'Termine', 'Umsatz', 'Zuletzt'].map(h => <th key={h} className="text-start font-bold px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{customers.map(c => (
            <tr key={c.name} className="border-b border-line last:border-0 hover:bg-surface transition">
              <td className="px-4 py-3 font-semibold flex items-center gap-3"><span className="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-black shrink-0" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}>{c.name.split(' ').map(s => s[0]).slice(0, 2).join('')}</span>{c.name}</td>
              <td className="px-4 py-3 text-muted">{c.city}</td><td className="px-4 py-3 text-muted text-xs">{c.email}<br />{c.phone}</td><td className="px-4 py-3">{c.count}</td><td className="px-4 py-3 font-semibold">{euro(c.revenue)}</td><td className="px-4 py-3 text-muted">{c.last ? formatDateDE(c.last) : '–'}</td>
            </tr>))}</tbody>
        </table></div>
      </div>
    </div>
  )
}

function Team() {
  const appts = useStore(s => s.appointments)
  return (
    <div>
      <H title="Team" sub="Feste Teams pro Region – Kunden bekommen möglichst immer dieselben Gesichter." />
      <div className="grid md:grid-cols-3 gap-4">{team.map(t => (
        <div key={t.name} className="glass p-5">
          <div className="flex items-center justify-between"><div className="font-display font-bold text-lg">{t.name}</div><span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500"><Star size={14} fill="currentColor" /> {t.rating.toString().replace('.', ',')}</span></div>
          <div className="text-sm text-muted mt-1">Leitung: {t.lead}</div><div className="text-sm text-muted">{t.members} Mitarbeitende · {t.city}</div>
          <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Zugewiesene Termine</div>
          <div className="font-display text-3xl font-black mt-1">{appts.filter(a => a.team === t.name && a.status !== 'storniert').length}</div>
          <div className="mt-3 flex -space-x-2">{Array.from({ length: t.members }).map((_, i) => <span key={i} className="w-8 h-8 rounded-full border-2 border-bg grid place-items-center text-[10px] font-black text-white" style={{ background: ['#0aa3c7', '#1fc0e4', '#0e3b47', '#5fd3ec'][i % 4] }}>{String.fromCharCode(65 + i)}</span>)}</div>
        </div>))}</div>
    </div>
  )
}

function SettingsView() {
  const { theme, toggle } = useTheme()
  return (
    <div>
      <H title="Einstellungen" sub="Demo-Einstellungen – in der Live-Version mit Mitarbeiterverwaltung, Rechnungen und Integrationen." />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass p-5"><div className="font-display font-bold">Öffnungszeiten</div><p className="text-sm text-muted mt-1">Mo–Sa 08:00–18:00 Uhr · Zeitfenster à 2 Stunden</p><div className="mt-3 flex flex-wrap gap-2">{SLOT_TIMES.map(t => <span key={t} className="rounded-full bg-cyan/15 text-cyan-deep text-xs font-bold px-3 py-1.5">{t}</span>)}</div></div>
        <div className="glass p-5"><div className="font-display font-bold">Darstellung</div><p className="text-sm text-muted mt-1">Aktuelles Theme: {theme === 'dark' ? 'Dunkel' : 'Hell'}</p><button onClick={toggle} className="btn btn-ghost btn-sm mt-3">Theme wechseln</button></div>
        <div className="glass p-5"><div className="font-display font-bold">KI-Assistentin Clea</div><p className="text-sm text-muted mt-1">Läuft auf Groq (llama-3.3-70b). API-Schlüssel als <code className="text-xs bg-line px-1 rounded">GROQ_API_KEY</code> in Vercel hinterlegen. Ohne Schlüssel arbeitet Clea im Offline-Demo-Modus.</p></div>
        <div className="glass p-5"><div className="font-display font-bold">Demo zurücksetzen</div><p className="text-sm text-muted mt-1">Stellt Beispieldaten wieder her.</p><button onClick={() => { store.resetDemo(); location.href = '/dashboard' }} className="btn btn-ghost btn-sm mt-3">Zurücksetzen</button></div>
      </div>
    </div>
  )
}
