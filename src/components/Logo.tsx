/**
 * GLANZGESCHWISTER logo – the original artwork (background removed, transparent PNG in /public).
 * `size` is the cap height of the wordmark in px; the image keeps its aspect ratio.
 * In dark mode the logo sits on a white pill so the blue wordmark stays readable.
 */
const RATIO = 694 / 166 // width / height of logo.png (with tagline)
const MARK_PART = 0.66 // share of the height taken by wordmark + underline (tagline below is cropped when tagline=false)

export const logoColors = { cyan: '#35a9cc', blue: '#1d4fb3', tagline: '#2f6bb8' }

export function Logo({ className = '', tagline = true, light = false, size = 36 }: { className?: string; tagline?: boolean; light?: boolean; size?: number }) {
  // height of the full image; without the tagline we show only the top part (wordmark + underline)
  const fullH = tagline ? size * 1.9 : size * 1.25
  const width = fullH * RATIO
  const visibleH = tagline ? fullH : fullH * MARK_PART
  return (
    <span className={`logo-pill inline-flex items-center select-none ${light ? 'logo-light' : ''} ${className}`} role="img" aria-label="Glanzgeschwister – Präzise. Sicher. Zuverlässig." style={{ height: visibleH, width, overflow: 'hidden' }}>
      <img src="/logo.png" srcSet="/logo.png 1x, /logo-1600.png 2x" alt="" draggable={false} style={{ width, height: fullH, objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
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

