import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { useLocation } from 'react-router-dom'

let lenis: Lenis | null = null
export const getLenis = () => lenis

export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
    let raf = 0
    const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis?.destroy(); lenis = null }
  }, [])
  useEffect(() => {
    if (hash) { const el = document.querySelector(hash); if (el) { setTimeout(() => (lenis ? lenis.scrollTo(el as HTMLElement, { offset: -90 }) : el.scrollIntoView()), 60); return } }
    lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0)
  }, [pathname, hash])
  return <>{children}</>
}
