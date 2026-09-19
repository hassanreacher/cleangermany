import { motion } from 'framer-motion'
import { Database, WifiOff } from 'lucide-react'
import { Logo } from './Logo'

/** Full-area loader with the pulsing logo and a shimmering progress bar. */
export function Loader({ label = 'Daten werden geladen …', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 py-16 ${className}`} role="status" aria-live="polite">
      <motion.div animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        <Logo tagline={false} size={30} />
      </motion.div>
      <div className="relative w-56 h-1.5 rounded-full overflow-hidden bg-line">
        <motion.span className="absolute inset-y-0 w-1/3 rounded-full" style={{ background: 'linear-gradient(90deg, var(--cyan), var(--cyan-deep))' }} animate={{ x: ['-100%', '400%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted"><span className="typing"><span /><span /><span /></span>{label}</div>
    </div>
  )
}

/** Whole page loader (used while the session is resolved or a role page loads). */
export function PageLoader({ label }: { label?: string }) {
  return <section className="min-h-[70vh] pt-28 grid place-items-center"><Loader label={label} /></section>
}

/** Shimmering placeholder block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden />
}

/** Card-shaped skeleton list. */
export function SkeletonCards({ n = 3, h = 'h-28' }: { n?: number; h?: string }) {
  return <div className="space-y-3">{Array.from({ length: n }).map((_, i) => <Skeleton key={i} className={`${h} w-full`} />)}</div>
}

/** Shown when Supabase env variables are missing. */
export function NotConfigured() {
  return (
    <div className="glass p-6 sm:p-8 text-center max-w-lg mx-auto">
      <Database className="mx-auto text-cyan-deep" size={34} />
      <h2 className="mt-4 text-xl font-black">Datenbank noch nicht verbunden</h2>
      <p className="mt-2 text-sm text-muted">Bitte <code className="text-xs">VITE_SUPABASE_URL</code> und <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> in den Umgebungsvariablen setzen und das SQL aus <code className="text-xs">supabase/schema.sql</code> ausführen.</p>
    </div>
  )
}

/** Error box with retry. */
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm flex items-start gap-3">
      <WifiOff size={18} className="shrink-0 text-rose-500 mt-0.5" />
      <div className="flex-1"><b>Da ist etwas schiefgelaufen.</b><div className="text-muted mt-0.5">{message}</div></div>
      {onRetry && <button onClick={onRetry} className="btn btn-ghost btn-sm">Erneut versuchen</button>}
    </div>
  )
}
