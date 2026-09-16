import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { Mail, Phone, MapPin, ShieldCheck, Leaf, BadgeEuro } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative mt-10" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <div className="container-x">
        <div className="glass p-6 sm:p-10 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={34} />
            <p className="text-sm text-muted mt-4 max-w-xs">Professionelle Reinigung für Wohnung, Haus, Büro und Praxis – bundesweit, versichert und mit Festpreis.</p>
            <div className="flex flex-wrap gap-3 mt-5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"><ShieldCheck size={14} className="text-cyan-deep" /> Versichert</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"><Leaf size={14} className="text-cyan-deep" /> Öko-Mittel</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5"><BadgeEuro size={14} className="text-cyan-deep" /> Festpreis</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3">Leistungen</h4>
            <ul className="space-y-2 text-sm text-muted">
              {['Unterhaltsreinigung', 'Grundreinigung', 'Umzugsreinigung', 'Fensterreinigung', 'Büro & Praxis'].map(l => <li key={l}><Link to="/leistungen" className="hover:text-cyan-deep transition">{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3">Unternehmen</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/#ablauf" className="hover:text-cyan-deep transition">So funktioniert’s</Link></li>
              <li><Link to="/#faq" className="hover:text-cyan-deep transition">FAQ</Link></li>
              <li><Link to="/termin" className="hover:text-cyan-deep transition">Termin buchen</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-deep transition">Inhaber-Dashboard</Link></li>
              <li><Link to="/impressum" className="hover:text-cyan-deep transition">Impressum</Link></li>
              <li><Link to="/datenschutz" className="hover:text-cyan-deep transition">Datenschutz</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-3">Kontakt</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="flex items-center gap-2"><Phone size={15} className="text-cyan-deep" /> 0800 123 45 67</li>
              <li className="flex items-center gap-2"><Mail size={15} className="text-cyan-deep" /> hallo@clean-shine.de</li>
              <li className="flex items-center gap-2"><MapPin size={15} className="text-cyan-deep" /> Bundesweit · Mo–Sa 08–18 Uhr</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-muted">
          <span>© {new Date().getFullYear()} CLEAN – Let it shine. Alle Rechte vorbehalten.</span>
          <span>Demo-Website · Daten werden nur lokal im Browser gespeichert</span>
        </div>
      </div>
    </footer>
  )
}
