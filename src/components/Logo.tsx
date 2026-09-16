/** CLEAN – Let it shine. Re-created as HTML + inline SVG broom so it is crisp, transparent and font-metric safe. */
export function Logo({ className = '', tagline = true, light = false, size = 36 }: { className?: string; tagline?: boolean; light?: boolean; size?: number }) {
  const ink = light ? '#fff' : 'var(--text)'
  return (
    <span className={`inline-flex flex-col items-start leading-none select-none ${className}`} role="img" aria-label="CLEAN – Let it shine">
      <span className="inline-flex items-center" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: size, letterSpacing: '0.06em', color: ink, lineHeight: 1 }}>
        <span>CLEA</span>
        <span className="inline-grid place-items-center" style={{ background: '#b9eef9', color: '#0e3b47', width: size * 1.02, height: size * 1.02, borderRadius: size * 0.08, marginInlineStart: size * 0.08 }}>N</span>
        <Broom style={{ height: size * 0.8, width: 'auto', marginInlineStart: size * 0.12 }} />
      </span>
      {tagline && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: size * 0.3, letterSpacing: '0.42em', color: light ? 'rgba(255,255,255,.8)' : 'var(--muted)', marginTop: size * 0.22, marginInlineStart: size * 0.1 }}>Let it shine</span>}
    </span>
  )
}

export function Broom({ style, className = '' }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={style} aria-hidden>
      <defs><linearGradient id="broomG" x1="0" x2="1"><stop offset="0" stopColor="#22c3e6" /><stop offset="1" stopColor="#0aa3c7" /></linearGradient></defs>
      {/* handle */}
      <rect x="38" y="30" width="80" height="9" rx="4.5" fill="url(#broomG)" />
      <rect x="86" y="27" width="34" height="15" rx="7.5" fill="url(#broomG)" />
      {/* head */}
      <rect x="4" y="10" width="34" height="50" rx="4" fill="#22c3e6" />
      <path d="M11 14v42M18 14v42M25 14v42M32 14v42" stroke="#fff" strokeWidth="2" opacity=".6" />
      {/* bristles */}
      <path d="M8 60c-3 6-5 12-5 18M15 60c-1 6-2 12-2 18M22 60c0 6 0 12 0 18M29 60c1 6 2 12 2 18M36 60c3 6 5 12 5 18" stroke="#22c3e6" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M2 78h40" stroke="#22c3e6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#b9eef9" />
      <text x="32" y="46" fontFamily="Montserrat, Arial Black, sans-serif" fontWeight="900" fontSize="40" textAnchor="middle" fill="#0e3b47">N</text>
    </svg>
  )
}
