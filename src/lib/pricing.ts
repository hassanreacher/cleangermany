import type { Profile } from './types'
import { business } from './config'

/** Multiplier on the base m² rate for intensive one-off cleanings. */
const intensity: Record<string, number> = { unterhalt: 1, buero: 1, fenster: 1, grund: 1.7, umzug: 1.9 }

/** Approximate price range per cleaning in EUR – based on 1,30–1,45 € / m². The owner confirms the final price. */
export function estimatePrice(p: Partial<Profile>): [number, number] {
  const sqm = p.sizeSqm ?? 100
  const [lo, hi] = business.pricePerSqm
  const k = intensity[p.cleaningType || 'unterhalt'] ?? 1
  const extras = (p.extras?.length ?? 0) * 15
  const min = Math.max(49, Math.round(sqm * lo * k + extras))
  const max = Math.max(min + 5, Math.round(sqm * hi * k + extras))
  return [min, max]
}

/** Number of cleanings per month derived from frequency + timesPerPeriod. */
export function cleaningsPerMonth(p: Partial<Profile>): number {
  switch (p.frequency) {
    case 'taeglich': return 21
    case 'woechentlich': return Math.round((p.timesPerPeriod ?? 1) * 4.33)
    case 'zweiwoechentlich': return 2
    case 'monatlich': return p.timesPerPeriod ?? 1
    default: return 1
  }
}

/** Monthly range (only meaningful for recurring cleanings). */
export function estimateMonthly(p: Partial<Profile>): [number, number] | null {
  if (!p.frequency || p.frequency === 'einmalig') return null
  const [a, b] = estimatePrice(p)
  const n = cleaningsPerMonth(p)
  return [Math.round(a * n / 5) * 5, Math.round(b * n / 5) * 5]
}

/** Range after the direct-contact discount (call / WhatsApp after sending the request). */
export function withDiscount([a, b]: [number, number]): [number, number] {
  const [d1, d2] = business.directDiscount
  return [Math.round(a * (1 - d2 / 100)), Math.round(b * (1 - d1 / 100))]
}

export function estimateDuration(p: Partial<Profile>): number {
  const sqm = p.sizeSqm ?? 100
  const factor = p.cleaningType === 'grund' || p.cleaningType === 'umzug' ? 0.05 : 0.025
  return Math.min(8, Math.max(1, Math.round(sqm * factor)))
}
