import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, UserRound, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui'
import { store } from '@/lib/store'
import { Logo } from '@/components/Logo'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const go = (mail: string) => { store.login(mail); nav(/inhaber|admin|owner/i.test(mail) ? '/dashboard' : '/konto') }
  return (
    <section className="min-h-[100svh] flex items-center pt-28 pb-16">
      <div className="container-x max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-7 sm:p-9">
          <Logo size={30} />
          <h1 className="mt-6 text-2xl font-black">Anmelden</h1>
          <p className="text-sm text-muted mt-1">Demo-Login: Jede E-Mail funktioniert. Mit „inhaber@…“ gelangen Sie ins Dashboard.</p>
          <form onSubmit={e => { e.preventDefault(); if (email) go(email) }} className="mt-6 space-y-4">
            <Input label="E-Mail" type="email" placeholder="name@beispiel.de" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Passwort" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
            <button className="btn btn-primary w-full"><LogIn size={18} /> Anmelden</button>
          </form>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button onClick={() => go('anna.schneider@example.de')} className="btn btn-ghost btn-sm"><UserRound size={16} /> Demo-Kunde</button>
            <button onClick={() => go('inhaber@clean-shine.de')} className="btn btn-ghost btn-sm"><KeyRound size={16} /> Demo-Inhaber</button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
