import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarCheck, MapPin, Sparkles, LogOut, Check, X, MessageCircle, UserRound } from 'lucide-react'
import { store, useStore, missingFields } from '@/lib/store'
import { Badge } from '@/components/ui'
import { Reveal } from '@/components/motion'
import { cleaningLabels, formatDateDE, propertyLabels, statusLabels, frequencyLabels, euro } from '@/lib/labels'
import type { AppointmentStatus } from '@/lib/types'

const tone: Record<AppointmentStatus, 'cyan' | 'green' | 'amber' | 'red' | 'gray'> = { anfrage: 'amber', angebot: 'cyan', bestaetigt: 'green', erledigt: 'gray', storniert: 'red' }

export default function Konto() {
  const { user, profile, appointments } = useStore(s => ({ user: s.user, profile: s.profile, appointments: s.appointments }))
  const mine = appointments.filter(a => (profile.email && a.customer.email === profile.email) || a.source === 'ki' && a.customer.name === profile.name || a.id.startsWith('u'))
  const missing = missingFields(profile)
  const pct = Math.round(((16 - missing.length) / 16) * 100)

  if (!user && !profile.name) {
    return (
      <section className="pt-36 pb-20"><div className="container-x max-w-md text-center"><div className="glass p-8">
        <UserRound className="mx-auto text-cyan-deep" size={36} /><h1 className="mt-4 text-2xl font-black">Mein Konto</h1>
        <p className="text-muted text-sm mt-2">Melden Sie sich an, um Ihre Termine und Ihr Profil zu sehen.</p>
        <Link to="/login" className="btn btn-primary mt-6">Anmelden</Link>
      </div></div></section>
    )
  }

  return (
    <section className="pt-32 pb-20 min-h-[100svh]">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><span className="eyebrow">Mein Konto</span><h1 className="mt-2 text-3xl sm:text-4xl font-black">Hallo {profile.name ? profile.name.split(' ')[0] : 'und willkommen'} 👋</h1></div>
          <div className="flex gap-2">
            <Link to="/termin" className="btn btn-primary btn-sm"><CalendarCheck size={16} /> Neuer Termin</Link>
            {user && <button onClick={() => store.logout()} className="btn btn-ghost btn-sm"><LogOut size={16} /> Abmelden</button>}
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg">Meine Termine</h2>
            {mine.length === 0 && <div className="glass p-8 text-center text-muted text-sm">Noch keine Termine. <Link to="/termin" className="text-cyan-deep font-bold">Jetzt buchen</Link> oder <button onClick={() => (document.querySelector('[aria-label="Chat mit Clea öffnen"]') as HTMLButtonElement)?.click()} className="text-cyan-deep font-bold">Clea fragen</button>.</div>}
            {mine.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.05}>
                <div className="glass p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap"><Badge tone={tone[a.status]}>{statusLabels[a.status]}</Badge><span className="text-xs text-muted">{a.code} · via {a.source === 'ki' ? 'Clea' : a.source === 'web' ? 'Website' : 'Telefon'}</span></div>
                      <div className="mt-2 font-display font-bold text-lg">{formatDateDE(a.date, { weekday: true })} · {a.time} Uhr</div>
                      <div className="text-sm text-muted flex items-center gap-1.5 mt-1"><MapPin size={14} /> {a.customer.street}, {a.customer.zip} {a.customer.city}</div>
                      <div className="text-sm text-muted flex items-center gap-1.5 mt-1"><Sparkles size={14} /> {cleaningLabels[a.customer.cleaningType as keyof typeof cleaningLabels]} · {a.customer.sizeSqm} m² · ca. {a.durationH} Std.</div>
                    </div>
                    <div className="text-end">
                      <div className="text-xs text-muted">{a.price ? 'Festpreis' : 'Preisspanne'}</div>
                      <div className="font-display font-black text-2xl">{a.price ? euro(a.price) : `${a.estimate[0]}–${a.estimate[1]} €`}</div>
                    </div>
                  </div>
                  {a.status === 'angebot' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl border border-cyan/40 bg-cyan/10 p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span>Der Inhaber hat Ihren Festpreis von <b>{euro(a.price!)}</b> bestätigt. Termin annehmen?</span>
                      <div className="flex gap-2"><button onClick={() => store.updateAppointment(a.id, { status: 'bestaetigt' })} className="btn btn-primary btn-sm"><Check size={14} /> Annehmen</button><button onClick={() => store.updateAppointment(a.id, { status: 'storniert' })} className="btn btn-ghost btn-sm"><X size={14} /> Ablehnen</button></div>
                    </motion.div>
                  )}
                  {(a.status === 'anfrage' || a.status === 'bestaetigt') && <div className="mt-3 flex gap-2"><button onClick={() => store.updateAppointment(a.id, { status: 'storniert' })} className="text-xs font-semibold text-muted hover:text-rose-500">Termin stornieren</button></div>}
                </div>
              </Reveal>
            ))}
          </div>

          <div className="space-y-4">
            <div className="glass p-5">
              <div className="flex items-center justify-between"><h2 className="font-display font-bold">Mein Profil</h2><span className="text-xs font-bold text-cyan-deep">{pct} %</span></div>
              <div className="mt-2 h-2 rounded-full bg-line overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-cyan to-cyan-deep" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} /></div>
              <dl className="mt-4 space-y-2 text-sm">
                {[['Name', profile.name], ['E-Mail', profile.email], ['Telefon', profile.phone], ['Adresse', profile.street ? `${profile.street}, ${profile.zip} ${profile.city}` : ''], ['Objekt', profile.propertyType ? `${propertyLabels[profile.propertyType]} · ${profile.sizeSqm ?? '?'} m² · ${profile.rooms ?? '?'} Zi.` : ''], ['Leistung', profile.cleaningType ? `${cleaningLabels[profile.cleaningType]} · ${profile.frequency ? frequencyLabels[profile.frequency] : ''}` : '']].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-line pb-2"><dt className="text-muted">{k}</dt><dd className={`text-end ${v ? '' : 'text-muted italic'}`}>{v || 'fehlt'}</dd></div>
                ))}
              </dl>
              {missing.length > 0 && <p className="mt-3 text-xs text-muted">Clea fragt fehlende Angaben automatisch beim nächsten Termin ab.</p>}
              <div className="mt-4 flex gap-2"><Link to="/termin" className="btn btn-ghost btn-sm flex-1">Bearbeiten</Link><button onClick={() => (document.querySelector('[aria-label="Chat mit Clea öffnen"]') as HTMLButtonElement)?.click()} className="btn btn-dark btn-sm flex-1"><MessageCircle size={14} /> Clea</button></div>
            </div>
            <div className="glass p-5 text-sm">
              <h3 className="font-display font-bold">Demo zurücksetzen</h3>
              <p className="text-muted text-xs mt-1">Löscht Profil und Buchungen aus dem Browser und lädt die Beispieldaten neu.</p>
              <button onClick={() => { store.resetDemo(); location.href = '/' }} className="btn btn-ghost btn-sm mt-3">Zurücksetzen</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
