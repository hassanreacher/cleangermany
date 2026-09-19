import type { Profile } from './types'
import { cleaningLabels, extraLabel, floorLabels, frequencyText, propertyLabels, timeWindowLabels, dirtLabels, accessLabels } from './labels'
import { quote, fmtRange, firstMonthDiscountPercent } from './pricing'
import { business } from './config'

/** Plain-text summary of the request – used for the WhatsApp prefill and the AI context. */
export function requestSummary(p: Partial<Profile>, code?: string): string {
  const lines: string[] = [`Hallo ${business.company}! Ich habe eine Reinigungsanfrage${code ? ` (Nr. ${code})` : ''}:`]
  if (p.propertyType) lines.push(`• Objekt: ${propertyLabels[p.propertyType]}${p.sizeSqm ? ` · ${p.sizeSqm} m²` : ''}`)
  else if (p.sizeSqm) lines.push(`• Fläche: ${p.sizeSqm} m²`)
  if (p.floorTypes?.length) lines.push(`• Böden: ${p.floorTypes.map(f => floorLabels[f]).join(', ')}`)
  if (p.rooms || p.bathrooms || p.desks) lines.push(`• Räume: ${p.rooms ?? '–'} · WCs: ${p.bathrooms ?? '–'}${p.desks ? ` · Arbeitsplätze: ${p.desks}` : ''}`)
  if (p.dirt || p.access) lines.push(`• Zustand: ${p.dirt ? dirtLabels[p.dirt] : '–'} · Zugang: ${p.access ? accessLabels[p.access] : '–'}`)
  if (p.cleaningType) lines.push(`• Leistung: ${cleaningLabels[p.cleaningType]}`)
  if (p.frequency) lines.push(`• Rhythmus: ${frequencyText(p)}${p.timeWindow ? ` · ${timeWindowLabels[p.timeWindow]}` : ''}`)
  if (p.extras?.length) lines.push(`• Extras: ${p.extras.map(extraLabel).join(', ')}`)
  if (p.street || p.city) lines.push(`• Adresse: ${[p.street, [p.zip, p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}`)
  if (p.sizeSqm) {
    const q = quote(p)
    lines.push(q.needsInspection ? '• Preis: nach kostenloser Besichtigung' : `• Geschätzt: ${fmtRange(q.rangeVisit)} netto pro Einsatz${q.recurring ? ` (ca. ${fmtRange(q.rangeMonthly)} netto/Monat, 1. Monat −${firstMonthDiscountPercent} %)` : ''}`)
  }
  if (p.name) lines.push(`• Name: ${p.name}`)
  if (lines.length === 1) return `Hallo ${business.company}! Ich interessiere mich für eine Reinigung und hätte gern ein Angebot.`
  lines.push(`Ich melde mich direkt für den ${business.directDiscount[0]}–${business.directDiscount[1]} % Direkt-Rabatt. Danke!`)
  return lines.join('\n')
}
