import type { Profile } from './types'

/** Rough estimate range in EUR, the owner sets the final price in the dashboard. */
export function estimatePrice(p: Partial<Profile>): [number, number] {
  const sqm = p.sizeSqm ?? 70
  const base: Record<string, number> = { unterhalt: 1.1, grund: 2.2, umzug: 2.6, fenster: 0.9, buero: 1.0 }
  const rate = base[p.cleaningType || 'unterhalt'] ?? 1.1
  let price = Math.max(59, sqm * rate)
  if (p.propertyType === 'haus') price *= 1.12
  if (p.bathrooms && p.bathrooms > 1) price += (p.bathrooms - 1) * 18
  if (p.pets) price += 12
  if (p.elevator === false && p.floor && /[3-9]/.test(p.floor)) price += 10
  price += (p.extras?.length ?? 0) * 22
  const freqDiscount: Record<string, number> = { woechentlich: 0.85, zweiwoechentlich: 0.9, monatlich: 0.95 }
  price *= freqDiscount[p.frequency || ''] ?? 1
  const lo = Math.round(price / 5) * 5
  const hi = Math.round((price * 1.25) / 5) * 5
  return [lo, hi]
}

export function estimateDuration(p: Partial<Profile>): number {
  const sqm = p.sizeSqm ?? 70
  const factor = p.cleaningType === 'grund' || p.cleaningType === 'umzug' ? 0.06 : 0.035
  return Math.min(8, Math.max(2, Math.round(sqm * factor)))
}
