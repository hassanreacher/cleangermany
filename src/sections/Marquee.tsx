import { Sparkles } from 'lucide-react'
import { districts } from '@/lib/data'
const items = districts.slice(0, 14)
export function Marquee() {
  const track = (
    <div className="marquee-track items-center font-display font-bold text-2xl sm:text-3xl text-muted/70">
      {items.map(c => <span key={c} className="inline-flex items-center gap-6 whitespace-nowrap">{c} <Sparkles size={18} className="text-cyan" /></span>)}
    </div>
  )
  return <div className="marquee py-6 border-y border-line" aria-hidden>{track}{track}</div>
}
