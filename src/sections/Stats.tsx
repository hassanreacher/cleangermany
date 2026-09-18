import { Counter, Reveal } from '@/components/motion'
const stats = [
  { v: 2400, s: '+', l: 'zufriedene Kund:innen' }, { v: 4.9, s: '', l: 'Ø Bewertung (1.240 Stimmen)', dec: true }, { v: 12, s: '', l: 'Berliner Bezirke' }, { v: 98, s: ' %', l: 'Weiterempfehlungsrate' },
]
export function Stats() {
  return (
    <section className="section !py-10">
      <div className="container-x grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 0.08}>
            <div className="glass p-6 text-center">
              <div className="font-display text-4xl sm:text-5xl font-black text-shine">{s.dec ? '4,9' : <Counter to={s.v} suffix={s.s} />}</div>
              <div className="mt-2 text-xs sm:text-sm text-muted font-medium">{s.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
