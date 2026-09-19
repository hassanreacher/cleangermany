import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Mail, Phone, MapPin, ShieldCheck, Leaf, BadgeEuro, Clock } from 'lucide-react'
import { business, fullAddress, whatsappUrl } from '@/lib/config'
import { WhatsAppIcon } from './WhatsAppButton'

export function Footer() {
  return (
    <footer className="relative mt-10" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <div className="container-x">
        <div className="glass p-6 sm:p-10 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={26} />
            <p className="text-sm text-muted mt-4 max-w-xs">Professionelle Reinigung für Büro, Praxis, Kita, Schule, Treppenhaus, Gewerbe und Zuhause – versichert, zuverlässig, mit Festpreis.</p>
            <div className="flex flex-wrap gap-3 mt-5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"><ShieldCheck size={14} className="text-cyan-deep" /> Versichert</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"><Leaf size={14} className="text-cyan-deep" /> Öko-Mittel</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"><BadgeEuro size={14} className="text-cyan-deep" /> Festpreis</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3">Leistungen</h4>
            <ul className="space-y-2 text-sm text-muted">
              {['Büro & Praxis', 'Kita & Schule', 'Treppenhaus', 'Gewerbe, Halle & Lager', 'Unterhaltsreinigung', 'Grundreinigung', 'Fensterreinigung'].map(l => <li key={l}><Link to="/leistungen" className="hover:text-cyan-deep transition">{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3">Unternehmen</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/#ablauf" className="hover:text-cyan-deep transition">So funktioniert’s</Link></li>
              <li><Link to="/#faq" className="hover:text-cyan-deep transition">FAQ</Link></li>
              <li><Link to="/#standort" className="hover:text-cyan-deep transition">Standort</Link></li>
              <li><Link to="/termin" className="hover:text-cyan-deep transition">Angebot anfragen</Link></li>
              <li><Link to="/konto" className="hover:text-cyan-deep transition">Mein Konto</Link></li>
              <li><Link to="/team" className="hover:text-cyan-deep transition">Team-Login</Link></li>
              <li><Link to="/impressum" className="hover:text-cyan-deep transition">Impressum</Link></li>
              <li><Link to="/datenschutz" className="hover:text-cyan-deep transition">Datenschutz</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3">Kontakt</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="font-semibold text-text">{business.company} · Inh. {business.owner}</li>
              <li className="flex items-start gap-2"><MapPin size={15} className="text-cyan-deep mt-0.5 shrink-0" /> <Link to="/#standort" className="hover:text-cyan-deep transition">{fullAddress}</Link></li>
              <li className="flex items-center gap-2"><Phone size={15} className="text-cyan-deep" /> <a href={`tel:${business.phoneTel}`} className="hover:text-cyan-deep transition">{business.phoneDisplay}</a></li>
              <li className="flex items-center gap-2"><span className="text-[#25d366]"><WhatsAppIcon size={15} /></span> <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-deep transition">WhatsApp schreiben</a></li>
              <li className="flex items-center gap-2"><Mail size={15} className="text-cyan-deep" /> <a href={`mailto:${business.email}`} className="hover:text-cyan-deep transition">{business.email}</a></li>
              <li className="flex items-center gap-2"><Clock size={15} className="text-cyan-deep" /> {business.hours}</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-muted">
          <span>© {new Date().getFullYear()} {business.company} · Inh. {business.owner}. Alle Rechte vorbehalten.</span>
          <span>Anfragen werden verschlüsselt übertragen und sicher gespeichert.</span>
        </div>
      </div>
    </footer>
  )
}
