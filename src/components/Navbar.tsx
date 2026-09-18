import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Moon, Sun, Languages, LogIn, LayoutDashboard, UserRound } from 'lucide-react'
import { Logo } from './Logo'
import { FullscreenMenu } from './FullscreenMenu'
import { useTheme } from './theme'
import { useStore } from '@/lib/store'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const { theme, toggle, dir, toggleDir } = useTheme()
  const user = useStore(s => s.user)
  const { scrollY } = useScroll()
  const last = useRef(0)

  useMotionValueEvent(scrollY, 'change', y => {
    setScrolled(y > 24)
    setHidden(y > 400 && y > last.current && !open)
    last.current = y
  })

  const measure = useCallback(() => {
    const r = btn.current?.getBoundingClientRect()
    if (r) setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }, [])
  useEffect(() => { measure(); window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure) }, [measure])

  const toggleMenu = () => { measure(); setOpen(o => !o) }
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -100 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="fixed top-0 inset-x-0" style={{ paddingTop: 'var(--safe-top)', zIndex: open ? 1001 : 900 }}
      >
        <div className={`container-x transition-all duration-500 ${scrolled ? 'pt-2' : 'pt-4'}`}>
          <div className={`flex items-center justify-between gap-3 rounded-full px-3 sm:px-4 transition-all duration-500 ${scrolled && !open ? 'glass py-2' : 'py-2'}`}>
            <Link to="/" className={`shrink-0 flex items-center transition-opacity duration-300 ${open ? 'opacity-0 pointer-events-none' : ''}`} aria-label="CLEAN Startseite">
              <Logo tagline={false} size={26} />
            </Link>
            <nav className={`hidden lg:flex items-center gap-1 text-[14px] font-semibold transition-opacity duration-300 ${open ? 'opacity-0 pointer-events-none' : ''}`}>
              {[['/', 'Start'], ['/leistungen', 'Leistungen'], ['/#preis', 'Preisrechner'], ['/termin', 'Angebot']].map(([to, label]) => (
                <NavLink key={to} to={to} className={({ isActive }) => `px-3.5 py-2 rounded-full transition hover:bg-surface ${isActive && !to.includes('#') ? 'text-cyan-deep' : ''}`}>{label}</NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`contents ${open ? '[&>*]:opacity-0 [&>*]:pointer-events-none' : ''}`}>
              <button onClick={toggleDir} className="hidden sm:grid w-10 h-10 place-items-center rounded-full border border-line bg-surface hover:border-cyan transition" aria-label="Schreibrichtung umschalten (RTL/LTR)" title={dir === 'rtl' ? 'LTR' : 'RTL'}><Languages size={17} /></button>
              <button onClick={toggle} className="grid w-10 h-10 place-items-center rounded-full border border-line bg-surface hover:border-cyan transition" aria-label="Theme umschalten">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
              {user ? (
                <Link to={user.role === 'inhaber' ? '/dashboard' : '/konto'} className="btn btn-dark btn-sm hidden sm:inline-flex">{user.role === 'inhaber' ? <LayoutDashboard size={16} /> : <UserRound size={16} />}{user.role === 'inhaber' ? 'Dashboard' : 'Mein Konto'}</Link>
              ) : (
                <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex"><LogIn size={16} /> Anmelden</Link>
              )}
              <Link to="/termin" className="btn btn-primary btn-sm hidden md:inline-flex">Angebot anfragen</Link>
              </div>
              <button ref={btn} onClick={toggleMenu} className={`menu-toggle ${open ? 'is-open' : ''}`} aria-label={open ? 'Menü schließen' : 'Menü öffnen'} aria-expanded={open} style={{ color: open ? '#fff' : 'var(--text)' }}>
                <span className="bar" /><span className="bar" /><span className="bar" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      <FullscreenMenu open={open} onClose={close} origin={origin} />
    </>
  )
}
