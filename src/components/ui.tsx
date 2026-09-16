import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass p-5 sm:p-6 ${className}`}>{children}</div>
}
export function Input({ label, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return <div>{label && <label className="lbl">{label}</label>}<input className="field" {...p} />{hint && <p className="text-xs text-muted mt-1.5">{hint}</p>}</div>
}
export function Select({ label, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return <div>{label && <label className="lbl">{label}</label>}<select className="field" {...p}>{children}</select></div>
}
export function Textarea({ label, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return <div>{label && <label className="lbl">{label}</label>}<textarea className="field min-h-[110px] resize-y" {...p} /></div>
}
export function Chip({ active, children, onClick, className = '' }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border transition min-h-[42px] ${active ? 'bg-ink text-white border-transparent dark:bg-cyan-deep' : 'bg-surface-strong border-line hover:border-cyan'} ${className}`}>
      {active && <Check size={14} />}{children}
    </motion.button>
  )
}
export function OptionCard({ active, title, desc, icon, onClick }: { active: boolean; title: string; desc?: string; icon?: ReactNode; onClick: () => void }) {
  return (
    <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} onClick={onClick} aria-pressed={active}
      className={`relative text-start rounded-2xl border p-4 transition w-full min-h-[92px] ${active ? 'border-cyan bg-cyan/10 shadow-[0_12px_30px_-12px_var(--glow)]' : 'border-line bg-surface-strong hover:border-cyan/60'}`}>
      {active && <span className="absolute top-3 end-3 grid place-items-center w-6 h-6 rounded-full bg-cyan text-white"><Check size={14} /></span>}
      {icon && <div className="text-cyan-deep mb-2">{icon}</div>}
      <div className="font-display font-bold">{title}</div>
      {desc && <div className="text-xs text-muted mt-1">{desc}</div>}
    </motion.button>
  )
}
export function Badge({ children, tone = 'cyan' }: { children: ReactNode; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'gray' }) {
  const t = { cyan: 'bg-cyan/15 text-cyan-deep', green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300', amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-300', red: 'bg-rose-500/15 text-rose-600 dark:text-rose-300', gray: 'bg-muted/15 text-muted' }[tone]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${t}`}>{children}</span>
}
export function Toggle({ value, onChange, labels = ['Nein', 'Ja'] }: { value: boolean | null; onChange: (v: boolean) => void; labels?: [string, string] }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface-strong p-1">
      {[false, true].map((v, i) => (
        <button key={i} type="button" onClick={() => onChange(v)} className={`px-5 py-2 rounded-full text-sm font-semibold transition min-h-[40px] ${value === v ? 'bg-ink text-white dark:bg-cyan-deep' : 'text-muted'}`}>{labels[i]}</button>
      ))}
    </div>
  )
}
