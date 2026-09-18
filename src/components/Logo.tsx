/**
 * GLANZGESCHWISTER wordmark – recreated as HTML + inline SVG (transparent, scalable, crisp at any size).
 * "GLANZ" light cyan, "GESCHWISTER" bold blue with a cyan tick accent over the I, cyan underline, tagline below.
 */
export const logoColors = { cyan: '#35a9cc', blue: '#1d4fb3', tagline: '#2f6bb8' }

export function Logo({ className = '', tagline = true, light = false, size = 36 }: { className?: string; tagline?: boolean; light?: boolean; size?: number }) {
  const blue = light ? '#fff' : 'var(--logo-ink)'
  const tag = light ? 'rgba(255,255,255,.85)' : 'var(--logo-tag)'
  const font = "'Poppins', 'Montserrat', ui-sans-serif, system-ui, sans-serif"
  return (
    <span className={`inline-flex flex-col items-center leading-none select-none ${className}`} role="img" aria-label="Glanzgeschwister – Präzise. Sicher. Zuverlässig.">
      <span className="inline-flex items-baseline" style={{ fontFamily: font, fontSize: size, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 300, color: logoColors.cyan }}>GLANZ</span>
        <span style={{ fontWeight: 700, color: blue }}>GESCHW</span>
        <span className="relative inline-block" style={{ fontWeight: 700, color: blue }}>
          I
          {/* cyan tick accent over the I */}
          <svg viewBox="0 0 10 12" aria-hidden className="absolute" style={{ width: size * 0.34, height: size * 0.4, left: '-4%', top: `-${size * 0.34}px` }}>
            <path d="M1.5 9.5 L8.5 1.5" stroke={logoColors.cyan} strokeWidth="3.2" strokeLinecap="butt" />
          </svg>
        </span>
        <span style={{ fontWeight: 700, color: blue }}>STER</span>
      </span>
      <span aria-hidden style={{ display: 'block', width: '100%', height: Math.max(2, size * 0.075), background: logoColors.cyan, marginTop: size * 0.14, borderRadius: 1 }} />
      {tagline && <span style={{ fontFamily: font, fontWeight: 400, fontSize: size * 0.3, letterSpacing: '0.01em', color: tag, marginTop: size * 0.2, whiteSpace: 'nowrap' }}>Präzise. Sicher. Zuverlässig.</span>}
    </span>
  )
}

/** Square mark for favicons / avatars: bold blue G with the cyan tick. */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#fff" />
      <text x="30" y="47" fontFamily="Poppins, Montserrat, Arial, sans-serif" fontWeight="700" fontSize="42" textAnchor="middle" fill={logoColors.blue}>G</text>
      <path d="M44 22 L54 10" stroke={logoColors.cyan} strokeWidth="5" />
      <rect x="10" y="52" width="44" height="3" fill={logoColors.cyan} />
    </svg>
  )
}
