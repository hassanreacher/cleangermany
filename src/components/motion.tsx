import { motion, useInView, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion'
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

export const ease = [0.22, 1, 0.36, 1] as const

export function Reveal({ children, delay = 0, y = 32, className = '', once = true, style }: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean; style?: CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once, margin: '-10% 0px' }} transition={{ duration: 0.8, delay, ease }} className={className} style={style}>
      {children}
    </motion.div>
  )
}

const wordV: Variants = { hidden: { y: '110%', opacity: 0, rotate: 3 }, show: (i: number) => ({ y: 0, opacity: 1, rotate: 0, transition: { duration: 0.7, delay: i * 0.06, ease } }) }

/** Word-by-word masked text reveal for headlines. */
export function TextReveal({ text, className = '', as: Tag = 'h2', delay = 0 }: { text: string; className?: string; as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'; delay?: number }) {
  const words = text.split(' ')
  const MTag = motion[Tag] as typeof motion.h2
  return (
    <MTag className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <motion.span className="inline-block" variants={wordV} custom={i + delay}>{w}&nbsp;</motion.span>
        </span>
      ))}
    </MTag>
  )
}

/** Cursor-following magnetic wrapper for buttons. */
export function Magnetic({ children, strength = 0.35, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 18 }), sy = useSpring(y, { stiffness: 200, damping: 18 })
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const r = ref.current!.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength); y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  return <motion.div ref={ref} style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={() => { x.set(0); y.set(0) }} className={`inline-block ${className}`}>{children}</motion.div>
}

/** 3D tilt card. */
export function Tilt({ children, className = '', max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 20 }), sry = useSpring(ry, { stiffness: 180, damping: 20 })
  const glowX = useTransform(sry, v => `${50 + v * 4}%`), glowY = useTransform(srx, v => `${50 - v * 4}%`)
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const r = ref.current!.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * max * 2); rx.set(-py * max * 2)
  }
  return (
    <motion.div ref={ref} onPointerMove={onMove} onPointerLeave={() => { rx.set(0); ry.set(0) }} style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }} className={`relative ${className}`}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: useTransform([glowX, glowY], ([gx, gy]) => `radial-gradient(400px circle at ${gx} ${gy}, rgba(31,192,228,.18), transparent 60%)`) }} />
      {children}
    </motion.div>
  )
}

/** Animated number counter. */
export function Counter({ to, suffix = '', prefix = '', duration = 1.8, className = '' }: { to: number; suffix?: string; prefix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  useEffect(() => {
    if (!inView) return
    const el = ref.current!; const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000)); const e = 1 - Math.pow(1 - p, 3)
      el.textContent = prefix + Math.round(to * e).toLocaleString('de-DE') + suffix
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, to, duration, prefix, suffix])
  return <span ref={ref} className={className}>{prefix}0{suffix}</span>
}

export const stagger = (delay = 0.08): Variants => ({ hidden: {}, show: { transition: { staggerChildren: delay } } })
export const fadeUp: Variants = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }
