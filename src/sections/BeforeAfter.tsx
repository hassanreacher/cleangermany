import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MoveHorizontal } from 'lucide-react'
import { Reveal, TextReveal } from '@/components/motion'

/** Interactive "wipe it clean" comparison – drag the handle to reveal the cleaned room. */
export function BeforeAfter() {
  const [pos, setPos] = useState(42)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef(false)
  const update = (clientX: number) => { const r = ref.current!.getBoundingClientRect(); setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100))) }

  return (
    <section className="section">
      <div className="container-x grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
        <div>
          <Reveal><span className="eyebrow">Vorher / Nachher</span></Reveal>
          <TextReveal text="Wischen Sie selbst." className="mt-4 text-4xl sm:text-5xl font-black" />
          <Reveal delay={0.15}><p className="mt-4 text-muted text-lg">Ziehen Sie den Griff und sehen Sie, was unser Team in drei Stunden aus einer Küche macht. Kein Filter, nur Fleiß – und die richtigen Mittel.</p></Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-6 space-y-3 text-sm">
              {['Fettfreie Oberflächen & streifenfreies Glas', 'Fugen, Armaturen und Backofen inklusive', 'Umweltfreundliche, geruchsneutrale Reinigungsmittel'].map(t => <li key={t} className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-cyan/15 text-cyan-deep grid place-items-center text-xs font-black">✓</span>{t}</li>)}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <div ref={ref} className="relative aspect-[4/3] rounded-[28px] overflow-hidden select-none shadow-2xl touch-pan-y cursor-ew-resize"
            onPointerDown={e => { drag.current = true; update(e.clientX); (e.target as Element).setPointerCapture?.(e.pointerId) }}
            onPointerMove={e => { if (drag.current) update(e.clientX) }} onPointerUp={() => (drag.current = false)} onPointerCancel={() => (drag.current = false)}>
            <Kitchen dirty={false} />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}><Kitchen dirty /></div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.1)]" style={{ left: `${pos}%` }}>
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white text-ink grid place-items-center shadow-xl"><MoveHorizontal size={20} /></motion.div>
            </div>
            <span className="absolute top-4 left-4 rounded-full bg-black/50 text-white text-xs font-bold px-3 py-1.5 backdrop-blur">Vorher</span>
            <span className="absolute top-4 right-4 rounded-full bg-white/80 text-ink text-xs font-bold px-3 py-1.5 backdrop-blur">Nachher ✨</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Kitchen({ dirty }: { dirty: boolean }) {
  return (
    <svg viewBox="0 0 800 600" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="grime"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="3" seed="4" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 0 .45 .8" /></feComponentTransfer></filter>
        <linearGradient id="kw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={dirty ? '#c9c3b6' : '#f3fbfd'} /><stop offset="1" stopColor={dirty ? '#aaa397' : '#dff5fa'} /></linearGradient>
        <linearGradient id="kf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={dirty ? '#8a8378' : '#e7f6fa'} /><stop offset="1" stopColor={dirty ? '#6f6a61' : '#c7ecf5'} /></linearGradient>
      </defs>
      <rect width="800" height="380" fill="url(#kw)" />
      <rect y="380" width="800" height="220" fill="url(#kf)" />
      {/* tiles */}
      <g stroke={dirty ? '#7d776c' : '#fff'} strokeWidth="2" opacity=".7">{[...Array(9)].map((_, i) => <line key={i} x1={i * 100} y1="120" x2={i * 100} y2="280" />)}{[0, 1, 2, 3].map(i => <line key={'h' + i} x1="0" y1={120 + i * 40} x2="800" y2={120 + i * 40} />)}</g>
      {/* cabinets */}
      <rect x="0" y="280" width="800" height="20" fill={dirty ? '#5b574f' : '#0e3b47'} />
      <rect x="0" y="300" width="800" height="90" fill={dirty ? '#6b665d' : '#0b2b33'} />
      {[40, 200, 360, 520, 680].map(x => <rect key={x} x={x} y="315" width="120" height="60" rx="6" fill={dirty ? '#7a7469' : '#1fc0e4'} opacity={dirty ? 1 : 0.9} />)}
      <rect x="0" y="20" width="800" height="90" fill={dirty ? '#6b665d' : '#0b2b33'} />
      {/* sink & tap */}
      <rect x="300" y="286" width="200" height="12" rx="4" fill={dirty ? '#8e887c' : '#cfeff7'} />
      <path d="M400 286 v-50 q0 -22 22 -22 h20" fill="none" stroke={dirty ? '#9a9489' : '#e8f7fb'} strokeWidth="8" strokeLinecap="round" />
      {/* oven */}
      <rect x="560" y="300" width="160" height="90" fill={dirty ? '#57534c' : '#0e3b47'} /><rect x="580" y="320" width="120" height="50" rx="4" fill={dirty ? '#3c3a36' : '#123f4d'} stroke={dirty ? '#7c766c' : '#1fc0e4'} strokeWidth="3" />
      {/* stains */}
      {dirty && (
        <g>
          <rect width="800" height="600" filter="url(#grime)" opacity=".55" />
          {[[120, 200, 40], [260, 150, 28], [640, 180, 50], [450, 470, 70], [150, 520, 45], [700, 500, 40], [520, 250, 22]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} fill="#5a4a34" opacity=".35" />)}
          <path d="M100 330 q30 20 60 0 t60 0" stroke="#4a3a24" strokeWidth="6" fill="none" opacity=".4" />
        </g>
      )}
      {!dirty && [[130, 160], [620, 130], [420, 450], [720, 520]].map(([x, y], i) => (
        <motion.path key={i} d={`M${x} ${y - 14} l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z`} fill="#fff" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6 }} style={{ transformOrigin: `${x}px ${y}px` }} />
      ))}
    </svg>
  )
}
