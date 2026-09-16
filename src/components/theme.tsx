import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'
const Ctx = createContext<{ theme: Theme; toggle: () => void; dir: 'ltr' | 'rtl'; toggleDir: () => void }>({ theme: 'light', toggle: () => {}, dir: 'ltr', toggleDir: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const s = localStorage.getItem('clean-theme'); if (s === 'dark' || s === 'light') return s } catch { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [dir, setDir] = useState<'ltr' | 'rtl'>(() => { try { return (localStorage.getItem('clean-dir') as 'rtl') || 'ltr' } catch { return 'ltr' } })
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('clean-theme', theme) } catch { /* ignore */ } }, [theme])
  useEffect(() => { document.documentElement.dir = dir; try { localStorage.setItem('clean-dir', dir) } catch { /* ignore */ } }, [dir])
  return <Ctx.Provider value={{ theme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')), dir, toggleDir: () => setDir(d => (d === 'rtl' ? 'ltr' : 'rtl')) }}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
