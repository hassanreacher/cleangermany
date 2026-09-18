import { motion } from 'framer-motion'
import { MapPin, Navigation, Phone, Clock, BadgePercent, Sparkles } from 'lucide-react'
import { Reveal, TextReveal, Magnetic } from '@/components/motion'
import { WhatsAppIcon } from '@/components/WhatsAppButton'
import { business, fullAddress, mapsEmbedUrl, mapsRouteUrl, whatsappUrl } from '@/lib/config'

/** "Cool map" section – embedded map with a glass overlay card, animated pin, route / call / WhatsApp actions. */
export function Location() {
  return (
    <section id="standort" className="section">
      <div className="container-x">
        <div className="max-w-2xl">
          <Reveal><span className="eyebrow">Standort</span></Reveal>
          <TextReveal text="Hier glänzen wir zuhause." className="mt-4 text-4xl sm:text-5xl font-black" />
          <Reveal delay={0.15}><p className="mt-4 text-muted text-lg">{business.company} · {business.ownerTitle} {business.owner} – aus {business.district} für ganz Berlin – alle Bezirke.</p></Reveal>
        </div>

        <Reveal delay={0.1} className="mt-10">
          <div className="relative rounded-[32px] overflow-hidden border border-line shadow-[0_40px_80px_-30px_var(--glow)] min-h-[520px] lg:min-h-[560px]" style={{ background: 'var(--ink)' }}>
            {/* map */}
            <iframe title={`Karte – ${fullAddress}`} src={mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen
              className="absolute inset-0 w-full h-full border-0 map-frame" />
            {/* tint + vignette (pointer-events none so the map stays usable) */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(11,43,51,.92) 0%, rgba(11,43,51,.55) 38%, rgba(11,43,51,0) 65%)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 120px rgba(11,43,51,.6)' }} />

            {/* pulsing pin (decorative, near the map centre on the visible half) */}
            <div className="absolute pointer-events-none hidden lg:block" style={{ left: '68%', top: '50%' }}>
              {[0, 1, 2].map(i => <motion.span key={i} className="absolute rounded-full border-2 border-cyan" style={{ width: 24, height: 24, left: -12, top: -12 }} animate={{ scale: [1, 5], opacity: [0.8, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.85, ease: 'easeOut' }} />)}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="absolute -translate-x-1/2 -translate-y-full text-cyan drop-shadow-[0_10px_20px_rgba(31,192,228,.7)]"><MapPin size={52} fill="var(--cyan)" stroke="#fff" strokeWidth={1.5} /></motion.div>
            </div>

            {/* overlay card */}
            <div className="relative z-10 p-5 sm:p-8 lg:p-12 max-w-xl text-white">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="rounded-[26px] p-6 sm:p-8 border border-white/15 backdrop-blur-xl" style={{ background: 'rgba(11,43,51,.55)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))' }}><Sparkles size={22} /></div>
                  <div>
                    <div className="font-display font-black text-2xl leading-tight">{business.company}</div>
                    <div className="text-sm text-white/70">{business.ownerTitle} {business.owner}</div>
                  </div>
                </div>
                <address className="not-italic mt-6 space-y-3 text-sm">
                  <div className="flex items-start gap-3"><MapPin size={18} className="text-cyan shrink-0 mt-0.5" /><div><div className="font-semibold">{business.street}</div><div className="text-white/75">{business.zip} {business.city} · {business.district}</div></div></div>
                  <div className="flex items-center gap-3"><Clock size={18} className="text-cyan shrink-0" /><span>{business.hours}</span></div>
                  <div className="flex items-center gap-3"><Phone size={18} className="text-cyan shrink-0" /><a href={`tel:${business.phoneTel}`} className="hover:text-cyan transition">{business.phoneDisplay}</a></div>
                </address>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Magnetic strength={0.2}><a href={mapsRouteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm"><Navigation size={16} /> Route planen</a></Magnetic>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-white" style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}><WhatsAppIcon size={16} /> WhatsApp</a>
                  <a href={`tel:${business.phoneTel}`} className="btn btn-sm bg-white/10 border border-white/20 text-white hover:bg-white/20"><Phone size={16} /> Anrufen</a>
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-400/15 border border-amber-300/30 px-3.5 py-3 text-xs text-amber-100">
                  <BadgePercent size={16} className="shrink-0 mt-0.5 text-amber-300" />
                  <span><b>{business.directDiscount[0]}–{business.directDiscount[1]} % Direkt-Rabatt:</b> Anfrage online senden und danach direkt anrufen oder per WhatsApp schreiben.</span>
                </div>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
