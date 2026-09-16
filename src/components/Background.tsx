import { useEffect, useRef } from 'react'
import { useTheme } from './theme'

/**
 * Transparent, animated soap-bubble background rendered on a fixed canvas behind the whole site.
 * Bubbles drift upward, wobble, react softly to the pointer and pop when clicked. Also paints
 * slow-moving aurora blobs. Respects prefers-reduced-motion.
 */
export function Background() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2)
    const mouse = { x: -9999, y: -9999 }
    const dark = theme === 'dark'

    type B = { x: number; y: number; r: number; vy: number; vx: number; wob: number; ph: number; a: number; pop: number }
    let bubbles: B[] = []
    const mk = (fresh = false): B => ({
      x: Math.random() * w, y: fresh ? h + Math.random() * 80 : Math.random() * h,
      r: 6 + Math.random() ** 2 * 46, vy: 0.15 + Math.random() * 0.45, vx: (Math.random() - 0.5) * 0.2,
      wob: 0.4 + Math.random() * 1.2, ph: Math.random() * Math.PI * 2, a: 0.25 + Math.random() * 0.5, pop: 0,
    })
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(Math.min(46, (w * h) / 32000))
      bubbles = Array.from({ length: n }, () => mk())
    }
    resize()
    window.addEventListener('resize', resize)
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }
    const onClick = (e: PointerEvent) => {
      for (const b of bubbles) if (Math.hypot(b.x - e.clientX, b.y - e.clientY) < b.r + 4 && !b.pop) b.pop = 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onClick, { passive: true })

    const blobs = [
      { x: 0.15, y: 0.2, r: 0.45, c: dark ? 'rgba(31,192,228,0.16)' : 'rgba(31,192,228,0.22)', s: 0.00025, o: 0 },
      { x: 0.85, y: 0.35, r: 0.4, c: dark ? 'rgba(185,238,249,0.08)' : 'rgba(185,238,249,0.55)', s: 0.00018, o: 2 },
      { x: 0.5, y: 0.9, r: 0.5, c: dark ? 'rgba(10,163,199,0.12)' : 'rgba(14,59,71,0.06)', s: 0.00021, o: 4 },
    ]

    let raf = 0, t0 = performance.now()
    const draw = (now: number) => {
      const t = now - t0
      ctx.clearRect(0, 0, w, h)
      // aurora blobs
      for (const bl of blobs) {
        const bx = (bl.x + Math.sin(t * bl.s + bl.o) * 0.08) * w
        const by = (bl.y + Math.cos(t * bl.s * 1.3 + bl.o) * 0.08) * h
        const br = bl.r * Math.max(w, h) * 0.6
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br)
        g.addColorStop(0, bl.c); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      }
      // bubbles
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i]
        if (!reduce) {
          b.ph += 0.01 * b.wob
          b.y -= b.vy; b.x += b.vx + Math.sin(b.ph) * 0.25
          const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy)
          if (d < 140) { b.x += (dx / d) * 1.6; b.y += (dy / d) * 1.6 }
          if (b.pop) { b.pop += 0.12; if (b.pop > 2) { bubbles[i] = mk(true); continue } }
          if (b.y < -b.r * 2 || b.x < -100 || b.x > w + 100) bubbles[i] = mk(true)
        }
        const r = b.pop ? b.r * (1 + (b.pop - 1) * 0.6) : b.r
        const alpha = b.pop ? Math.max(0, b.a * (2 - b.pop)) : b.a
        const g = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.35, r * 0.1, b.x, b.y, r)
        g.addColorStop(0, `rgba(255,255,255,${0.55 * alpha})`)
        g.addColorStop(0.6, `rgba(185,238,249,${0.10 * alpha})`)
        g.addColorStop(1, `rgba(31,192,228,${0.28 * alpha})`)
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
        ctx.lineWidth = 1.2; ctx.strokeStyle = `rgba(31,192,228,${0.5 * alpha})`; ctx.stroke()
        // rim highlight
        ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.78, -2.4, -1.2); ctx.strokeStyle = `rgba(255,255,255,${0.85 * alpha})`; ctx.lineWidth = Math.max(1, r * 0.08); ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    if (reduce) draw(t0); else raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerleave', onLeave); window.removeEventListener('pointerdown', onClick) }
  }, [theme])

  return (
    <>
      <div aria-hidden className="fixed inset-0 -z-20" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 60%, var(--bg) 100%)' }} />
      <canvas ref={ref} aria-hidden className="fixed inset-0 -z-10 pointer-events-none" />
    </>
  )
}
