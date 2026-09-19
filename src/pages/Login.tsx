import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogIn, UserPlus, KeyRound, MailCheck, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui'
import { Logo } from '@/components/Logo'
import { NotConfigured, PageLoader } from '@/components/Loading'
import { useAuth, homeForRole } from '@/lib/auth'
import { store } from '@/lib/store'
import { errorText } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'reset' | 'newpw'

export default function Login() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { user, role, loading, configured, signIn, signUp, resetPassword, updatePassword } = useAuth()
  const [mode, setMode] = useState<Mode>(params.get('reset') ? 'newpw' : params.get('mode') === 'signup' ? 'signup' : 'login')
  const draft = store.get() // name / e-mail / phone from the request form are kept after sending
  const [email, setEmail] = useState(params.get('email') ?? draft.email ?? '')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [name, setName] = useState(draft.name ?? '')
  const [phone, setPhone] = useState(draft.phone ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(params.get('confirmed') ? 'E-Mail bestätigt – Sie können sich jetzt anmelden.' : '')

  // already logged in → go to the role home (except when setting a new password)
  useEffect(() => { if (!loading && user && role && mode !== 'newpw') nav(homeForRole(role), { replace: true }) }, [user, role, loading, mode, nav])

  if (!configured) return <section className="pt-36 pb-20"><div className="container-x"><NotConfigured /></div></section>
  if (loading) return <PageLoader label="Anmeldung wird geprüft …" />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'login') { await signIn(email, pw) }
      else if (mode === 'signup') {
        if (pw.length < 8) throw new Error('Das Passwort muss mindestens 8 Zeichen haben.')
        if (pw !== pw2) throw new Error('Die Passwörter stimmen nicht überein.')
        const r = await signUp(email, pw, name, phone)
        if (r.needsConfirmation) { setInfo(`Fast fertig! Wir haben Ihnen eine Bestätigungs-Mail an ${email.trim()} geschickt – bitte den Link darin anklicken und dann anmelden. Ihre Anfrage wird automatisch Ihrem Konto zugeordnet.`); setMode('login') }
      } else if (mode === 'reset') { await resetPassword(email); setInfo('Wir haben Ihnen einen Link zum Zurücksetzen des Passworts geschickt.'); setMode('login') }
      else if (mode === 'newpw') {
        if (pw.length < 8) throw new Error('Das Passwort muss mindestens 8 Zeichen haben.')
        if (pw !== pw2) throw new Error('Die Passwörter stimmen nicht überein.')
        await updatePassword(pw); setInfo('Passwort gespeichert.'); nav(homeForRole(role), { replace: true })
      }
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  const titles: Record<Mode, [string, string]> = {
    login: ['Anmelden', 'Ihre Anfragen, Termine und Bewertungen an einem Ort.'],
    signup: ['Konto erstellen', params.get('from') === 'anfrage' ? 'Ihre Angaben sind schon eingetragen – nur noch ein Passwort wählen. Danach sehen Sie den Status Ihrer Anfrage jederzeit im Konto.' : 'Kostenlos – Sie sehen den Status Ihrer Anfragen und können Bewertungen abgeben.'],
    reset: ['Passwort vergessen', 'Wir senden Ihnen einen Link zum Zurücksetzen.'],
    newpw: ['Neues Passwort', 'Bitte ein neues Passwort wählen.'],
  }

  return (
    <section className="min-h-[100svh] flex items-center pt-28 pb-16">
      <div className="container-x max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-7 sm:p-9">
          <Logo size={26} />
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <h1 className="mt-6 text-2xl font-black">{titles[mode][0]}</h1>
              <p className="text-sm text-muted mt-1">{titles[mode][1]}</p>
            </motion.div>
          </AnimatePresence>

          {info && <div className="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm flex items-start gap-2"><MailCheck size={16} className="shrink-0 mt-0.5 text-emerald-500" />{info}</div>}
          {error && <div className="mt-5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm">{error}</div>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && <>
              <Input label="Name / Firma" placeholder="Anna Schneider · Muster GmbH" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
              <Input label="Telefon" type="tel" placeholder="+49 30 1234567" value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" />
            </>}
            {mode !== 'newpw' && <Input label="E-Mail" type="email" placeholder="name@beispiel.de" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />}
            {mode !== 'reset' && <Input label={mode === 'newpw' ? 'Neues Passwort' : 'Passwort'} type="password" placeholder="mindestens 8 Zeichen" value={pw} onChange={e => setPw(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
            {(mode === 'signup' || mode === 'newpw') && <Input label="Passwort wiederholen" type="password" placeholder="••••••••" value={pw2} onChange={e => setPw2(e.target.value)} required autoComplete="new-password" />}
            <button disabled={busy} className="btn btn-primary w-full">
              {busy ? <span className="typing"><span /><span /><span /></span> : mode === 'login' ? <><LogIn size={18} /> Anmelden</> : mode === 'signup' ? <><UserPlus size={18} /> Konto erstellen</> : <><KeyRound size={18} /> {mode === 'reset' ? 'Link senden' : 'Passwort speichern'}</>}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
            {mode === 'login' && <>
              <button onClick={() => { setMode('signup'); setError('') }} className="font-bold text-cyan-deep">Noch kein Konto? Registrieren</button>
              <button onClick={() => { setMode('reset'); setError('') }} className="text-muted hover:text-text">Passwort vergessen?</button>
            </>}
            {mode !== 'login' && <button onClick={() => { setMode('login'); setError('') }} className="inline-flex items-center gap-1 text-muted hover:text-text"><ArrowLeft size={14} /> Zurück zur Anmeldung</button>}
          </div>
          <p className="mt-6 text-[11px] text-muted">Mit der Registrierung akzeptieren Sie unsere <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>. Anfragen können Sie auch ohne Konto stellen.</p>
        </motion.div>
      </div>
    </section>
  )
}
