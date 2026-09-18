import { useEffect, useLayoutEffect, useRef } from 'react'
import { business, fullAddress, whatsappUrl } from '@/lib/config'
import { WhatsAppIcon } from './WhatsAppButton'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { Instagram, Facebook, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { getLenis } from './SmoothScroll'
import { useTheme } from './theme'

export const menuLinks = [
  { to: '/', label: 'Start' },
  { to: '/leistungen', label: 'Leistungen' },
  { to: '/#ablauf', label: 'So funktioniert’s' },
  { to: '/#preis', label: 'Preisrechner' },
  { to: '/termin', label: 'Angebot anfragen' },
]

/**
 * "Perfect PC" style full-screen menu: circular clip-path reveal from the toggle position,
 * GSAP-staggered 3D links with index numbers, contact/socials footer, scroll lock (Lenis + body),
 * Esc to close, RTL-aware (logical positioning + mirrored transforms), light/dark aware.
 */
export function FullscreenMenu({ open, onClose, origin }: { open: boolean; onClose: () => void; origin: { x: number; y: number } }) {
  const overlay = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const footRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const { pathname } = useLocation()
  const { dir } = useTheme()
  const first = useRef(true)

  useLayoutEffect(() => {
    const el = overlay.current!
    el.style.setProperty('--mx', `${origin.x}px`)
    el.style.setProperty('--my', `${origin.y}px`)
    const R = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y)) + 40
    const links = Array.from(linksRef.current!.querySelectorAll('.menu-link'))
    const rot = dir === 'rtl' ? 25 : -25
    const x = dir === 'rtl' ? 60 : -60
    tl.current?.kill()
    tl.current = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .set(el, { visibility: 'visible' })
      .fromTo(el, { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }, { clipPath: `circle(${R}px at ${origin.x}px ${origin.y}px)`, duration: 0.9, ease: 'power4.inOut' })
      .fromTo(links, { opacity: 0, y: 40, x, rotateY: rot, rotateX: 12, transformPerspective: 1000 }, { opacity: 1, y: 0, x: 0, rotateY: 0, rotateX: 0, duration: 0.8, stagger: 0.07 }, '-=0.45')
      .fromTo(footRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.5')
    if (first.current) { first.current = false; return }
  }, [origin.x, origin.y, dir])

  useEffect(() => {
    const t = tl.current; if (!t) return
    if (open) { t.timeScale(1).play(0); document.body.classList.add('menu-open'); getLenis()?.stop() }
    else { t.timeScale(1.6).reverse(); document.body.classList.remove('menu-open'); getLenis()?.start() }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // close on route change
  useEffect(() => { if (open) onClose() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [pathname])

  return (
    <div ref={overlay} className={`menu-overlay ${open ? 'is-open' : ''}`} aria-hidden={!open} role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="menu-bg" />
      <div className="menu-inner">
        <div className="flex items-center justify-between h-12">
          <span className="font-display font-black tracking-[0.3em] text-sm text-white/70">GLANZGESCHWISTER · MENÜ</span>
        </div>
        <nav ref={linksRef} className="menu-links">
          {menuLinks.map((l, i) => (
            <Link key={l.to} to={l.to} className="menu-link" onClick={onClose} tabIndex={open ? 0 : -1}>
              <span className="idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="txt">{l.label}</span>
            </Link>
          ))}
        </nav>
        <div ref={footRef} className="menu-footer">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={`tel:${business.phoneTel}`} className="inline-flex items-center gap-2"><Phone size={16} /> {business.phoneDisplay}</a>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2"><WhatsAppIcon size={16} /> WhatsApp</a>
            <a href={`mailto:${business.email}`} className="inline-flex items-center gap-2"><Mail size={16} /> {business.email}</a>
            <span className="inline-flex items-center gap-2"><MapPin size={16} /> {fullAddress} · {business.hours}</span>
          </div>
          <div className="menu-socials">
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
          </div>
        </div>
      </div>
    </div>
  )
}
