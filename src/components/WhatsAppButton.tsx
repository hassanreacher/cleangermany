import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { business, whatsappUrl } from '@/lib/config'
import { useStore } from '@/lib/store'
import { requestSummary } from '@/lib/summary'

/** Official WhatsApp glyph (white on transparent). */
export function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden fill="currentColor">
      <path d="M16.04 3C9.4 3 4 8.36 4 14.96c0 2.3.66 4.52 1.9 6.44L4 29l7.8-1.98a12.2 12.2 0 0 0 4.24.76c6.64 0 12.04-5.36 12.04-11.96S22.68 3 16.04 3zm0 21.84c-1.34 0-2.66-.34-3.82-1l-.28-.16-4.62 1.18 1.24-4.42-.18-.3a9.72 9.72 0 0 1-1.54-5.18c0-5.4 4.4-9.8 9.82-9.8s9.8 4.4 9.8 9.8-4.4 9.88-9.82 9.88zm5.4-7.34c-.3-.14-1.76-.86-2.02-.96-.28-.1-.48-.14-.68.14-.2.3-.78.96-.96 1.16-.18.2-.34.22-.64.08-.3-.16-1.26-.46-2.4-1.48-.88-.78-1.48-1.76-1.66-2.06-.18-.3-.02-.46.14-.6.14-.14.3-.36.44-.52.16-.18.2-.3.3-.5.1-.2.06-.38-.02-.52-.08-.14-.68-1.62-.92-2.22-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.36-.28.3-1.04 1.02-1.04 2.48s1.06 2.88 1.22 3.08c.14.2 2.1 3.2 5.08 4.48.7.3 1.26.48 1.7.62.7.22 1.36.2 1.86.12.58-.08 1.76-.72 2-1.42.26-.7.26-1.28.18-1.42-.08-.12-.28-.2-.58-.34z" />
    </svg>
  )
}

/**
 * Floating WhatsApp launcher (bottom-start, opposite of the Clea chat bubble).
 * The prefilled message contains the customer's request summary when available.
 */
export function WhatsAppButton() {
  const profile = useStore()
  const { pathname } = useLocation()
  const [tip, setTip] = useState(false)
  useEffect(() => { const a = setTimeout(() => setTip(true), 4000); const b = setTimeout(() => setTip(false), 14000); return () => { clearTimeout(a); clearTimeout(b) } }, [])
  if (pathname.startsWith('/dashboard')) return null
  const href = whatsappUrl(requestSummary(profile))
  return (
    <div className="fixed z-[950] start-4 sm:start-6 flex items-center gap-3" style={{ bottom: 'calc(16px + var(--safe-bottom))' }}>
      <motion.a href={href} target="_blank" rel="noopener noreferrer" aria-label="Per WhatsApp schreiben"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 1.2 }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full grid place-items-center text-white shadow-[0_18px_40px_-10px_rgba(37,211,102,.6)]" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
        <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#25d366', animationDuration: '2.4s' }} />
        <WhatsAppIcon size={30} />
        <span className="absolute -top-1 -end-1 rounded-full bg-amber-400 text-ink text-[10px] font-black px-1.5 py-0.5 leading-none shadow">-{business.directDiscount}%</span>
      </motion.a>
      <AnimatePresence>
        {tip && (
          <motion.div initial={{ opacity: 0, x: -10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-strong rounded-2xl px-4 py-3 text-sm max-w-[220px] shadow-lg hidden sm:block">
            <b className="font-display">Direkt schreiben & sparen</b><br />
            <span className="text-muted">Anfrage senden + WhatsApp/Anruf = {business.directDiscount} % Rabatt.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
