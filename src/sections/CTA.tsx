import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Reveal, Magnetic } from '@/components/motion'
export function CTA() {
  return (
    <section className="section !pb-6">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-14 text-white text-center" style={{ background: 'linear-gradient(135deg, var(--ink-2), var(--ink))' }}>
            {[0, 1, 2].map(i => <motion.span key={i} className="absolute rounded-full border border-cyan/40" style={{ width: 300 + i * 220, height: 300 + i * 220, left: '50%', top: '50%', x: '-50%', y: '-50%' }} animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }} />)}
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-black">Bereit für <span className="text-cyan">Glanz</span>?</h2>
              <p className="mt-4 text-white/75 max-w-xl mx-auto">Angebot in 2 Minuten anfragen – und mit direktem Kontakt per WhatsApp oder Anruf 10–20 % sparen.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Magnetic><Link to="/termin" className="btn btn-primary">Angebot anfragen <ArrowRight size={18} className="rtl:rotate-180" /></Link></Magnetic>
                <Magnetic strength={0.2}><button onClick={() => (document.querySelector('[aria-label="Chat mit Clea öffnen"]') as HTMLButtonElement)?.click()} className="btn bg-white/10 border border-white/20 text-white hover:bg-white/20"><MessageCircle size={18} /> Mit Clea chatten</button></Magnetic>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
