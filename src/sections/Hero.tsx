import { Link } from 'react-router-dom'
import { startingPriceText } from '@/lib/pricing'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, MessageCircle, Star, CalendarCheck, ShieldCheck, Sparkles, ChevronDown } from 'lucide-react'
import { Magnetic, TextReveal, ease } from '@/components/motion'
import { useStore } from '@/lib/store'
import { nextAvailable } from '@/lib/slots'
import { formatDateDE, weekdaysLong } from '@/lib/labels'

export function Hero() {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 600], [0, -80])
  const y2 = useTransform(scrollY, [0, 600], [0, -160])
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 }), sy = useSpring(my, { stiffness: 60, damping: 20 })
  const { appointments, blockedSlots } = useStore(s => ({ appointments: s.appointments, blockedSlots: s.blockedSlots }))
  const next = nextAvailable(appointments, blockedSlots, 1)[0]

  return (
    <section className="relative min-h-[100svh] flex items-center pt-28 pb-16 overflow-hidden" onPointerMove={e => { if (e.pointerType !== 'mouse') return; mx.set((e.clientX / window.innerWidth - 0.5) * 30); my.set((e.clientY / window.innerHeight - 0.5) * 30) }}>
      <div className="container-x grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-8 items-center">
        <div className="relative z-10">
          <motion.span initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }} className="eyebrow">Gewerbe- & Objektreinigung · Berlin</motion.span>
          <TextReveal as="h1" text="Sauberkeit, die man spürt." className="mt-5 text-[44px] leading-[1.02] sm:text-6xl lg:text-[76px] font-black" />
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease }} className="mt-6 max-w-xl text-lg text-muted leading-relaxed">
            Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbe oder Zuhause – wir bringen alles zum Glänzen. Unterhaltsreinigung <b className="text-text">{startingPriceText()}</b>, Angebot in <b className="text-text">2 Minuten</b> online oder im Chat mit <b className="text-text">Clea</b>. Direkt melden = <b className="text-text">10–20 % Rabatt</b>.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6, ease }} className="mt-8 flex flex-wrap items-center gap-3">
            <Magnetic><Link to="/termin" className="btn btn-primary">Angebot anfragen <ArrowRight size={18} className="rtl:rotate-180" /></Link></Magnetic>
            <Magnetic strength={0.2}><a href="#clea" onClick={e => { e.preventDefault(); (document.querySelector('[aria-label="Chat mit Clea öffnen"]') as HTMLButtonElement)?.click() }} className="btn btn-ghost"><MessageCircle size={18} /> Mit Clea chatten</a></Magnetic>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="flex text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</span><b className="text-text">4,9</b> · 1.240 Bewertungen</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-cyan-deep" /> Voll versichert</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles size={16} className="text-cyan-deep" /> Zufriedenheitsgarantie</span>
          </motion.div>
        </div>

        {/* floating visual */}
        <div className="relative h-[440px] sm:h-[520px] lg:h-[600px]">
          <motion.div style={{ x: sx, y: sy }} className="absolute inset-0">
            <motion.div style={{ y: y1 }} initial={{ opacity: 0, scale: 0.9, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: -4 }} transition={{ duration: 1, delay: 0.3, ease }}
              className="absolute left-[4%] top-[8%] w-[78%] sm:w-[72%] aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl" >
              <RoomIllustration />
            </motion.div>
            <motion.div style={{ y: y2 }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7, ease }}
              className="absolute end-0 top-[14%] glass p-4 w-[240px]">
              <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider"><CalendarCheck size={14} className="text-cyan-deep" /> Nächster freier Termin</div>
              {next ? <div className="mt-2 font-display font-bold text-lg leading-tight">{weekdaysLong[new Date(next.date + 'T00:00').getDay()].slice(0, 2)}, {formatDateDE(next.date)}<br /><span className="text-cyan-deep">{next.times[0]} Uhr</span></div> : <div className="mt-2 text-sm">Auf Anfrage</div>}
              <Link to="/termin" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-deep">Jetzt sichern <ArrowRight size={12} className="rtl:rotate-180" /></Link>
            </motion.div>
            <motion.div style={{ y: y1 }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.9, ease }}
              className="absolute end-[4%] bottom-[8%] glass p-4 w-[250px]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><Sparkles size={20} /></div>
                <div className="text-sm"><b className="font-display">Clea</b> <span className="text-muted">· KI-Assistentin</span><div className="text-muted text-xs mt-0.5">„Hallo! Wann darf ich Ihnen einen Termin sichern?“</div></div>
              </div>
              <div className="mt-3 flex gap-1 typing"><span /><span /><span /></div>
            </motion.div>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="absolute start-0 bottom-[16%] glass px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /> 3 Teams heute verfügbar
            </motion.div>
          </motion.div>
        </div>
      </div>
      <motion.a href="#leistungen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted flex flex-col items-center gap-1 text-[11px] font-bold tracking-widest uppercase">
        Scrollen <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}><ChevronDown size={18} /></motion.span>
      </motion.a>
    </section>
  )
}

/** Stylised living room that gets "cleaned" by an animated shine sweep. */
function RoomIllustration() {
  return (
    <div className="relative w-full h-full" style={{ background: 'linear-gradient(160deg, #0e3b47, #0b2b33)' }}>
      <svg viewBox="0 0 400 500" className="w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9f5fb" /><stop offset="1" stopColor="#b9eef9" /></linearGradient>
          <linearGradient id="floor" x1="0" x2="1"><stop offset="0" stopColor="#e9f9fd" /><stop offset="1" stopColor="#cbf0f8" /></linearGradient>
          <linearGradient id="sweep" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        </defs>
        <rect width="400" height="340" fill="url(#wall)" />
        <rect y="340" width="400" height="160" fill="url(#floor)" />
        {/* window */}
        <rect x="230" y="60" width="130" height="150" rx="10" fill="#fff" opacity=".9" />
        <rect x="238" y="68" width="114" height="134" rx="6" fill="#8fdcef" />
        <path d="M295 68 v134 M238 135 h114" stroke="#fff" strokeWidth="4" />
        {/* plant */}
        <rect x="40" y="250" width="44" height="52" rx="8" fill="#0aa3c7" />
        <path d="M62 250 c-30 -30 -30 -70 0 -80 c30 10 30 50 0 80 M62 250 c-40 -10 -45 -45 -30 -55 c20 5 30 30 30 55 M62 250 c40 -10 45 -45 30 -55 c-20 5 -30 30 -30 55" fill="#1fc0e4" />
        {/* sofa */}
        <rect x="110" y="250" width="200" height="90" rx="18" fill="#0e3b47" />
        <rect x="120" y="230" width="60" height="50" rx="12" fill="#1fc0e4" />
        <rect x="185" y="230" width="60" height="50" rx="12" fill="#b9eef9" />
        <rect x="250" y="230" width="50" height="50" rx="12" fill="#1fc0e4" />
        <rect x="100" y="300" width="220" height="24" rx="12" fill="#0b2b33" />
        {/* rug */}
        <ellipse cx="200" cy="400" rx="140" ry="40" fill="#b9eef9" opacity=".8" />
        <ellipse cx="200" cy="400" rx="110" ry="28" fill="none" stroke="#fff" strokeWidth="3" />
        {/* sweep */}
        <motion.rect width="140" height="500" fill="url(#sweep)" initial={{ x: -160 }} animate={{ x: [-160, 460] }} transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }} style={{ mixBlendMode: 'overlay' }} />
        {/* sparkles */}
        {[[70, 90], [340, 260], [150, 180], [300, 420], [60, 400]].map(([x, y], i) => (
          <motion.path key={i} d={`M${x} ${y - 10} l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z`} fill="#fff" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }} style={{ transformOrigin: `${x}px ${y}px` }} />
        ))}
      </svg>
    </div>
  )
}
