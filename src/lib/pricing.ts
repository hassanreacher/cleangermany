/**
 * Pricing engine – port of Cleaning_Pricing_Web_Package/pricing-engine.js, driven by the profile fields of this site.
 *
 * Recurring (unterhalt):  minutes = area/productivity·60 + desks·0.75 + WCs·6.5 + washbasins·2.5 + showers·5 + kitchen + bins·0.5
 *                         hours   = minutes/60 · dirt · floor · workTime · access
 *                         visit   = max(minimum, hours · rate · frequencyFactor)   monthly = visit · visits + add-ons
 * Stairwell:              entrances·15 + entrances·floors·4.5 + elevators·5 + basements·8 + corridor m²·0.12 + windows·2.5 (min 25)
 * Specials / glass / garden / outdoor: quantity · rate (· dirt), with minimums.
 * All values NET; VAT 19 % on top. Customer sees an estimate range (−5 % / +10 %, rounded to 5 €).
 */
import type { Profile, CleaningType, FloorType } from './types'
import { pricingConfig as cfg, type ServiceKey } from './pricingConfig'
import { business } from './config'

export interface Quote {
  kind: 'recurring' | 'stairs' | 'special' | 'glass' | 'garden'
  serviceLabel: string
  recurring: boolean
  /** net price per visit / execution */
  perVisitNet: number
  visitsPerMonth: number
  addOnsNet: number
  /** per visit · visits + add-ons (one-off: execution + add-ons) */
  monthlyNet: number
  /** first month with the new-customer discount (recurring only, otherwise = monthlyNet) */
  firstMonthNet: number
  vatRate: number
  monthlyGross: number
  hoursPerVisit: number
  rangeVisit: [number, number]
  rangeMonthly: [number, number]
  minimumApplied: boolean
  belowFloor: boolean
  outOfLimits: boolean
  /** true → show "Preis nach Besichtigung" instead of numbers */
  needsInspection: boolean
  lines: { label: string; value: string }[]
}

const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100
const roundTo = (v: number, step: number) => Math.round(v / step) * step
export const fmtEur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
/** "225 €" for a single value or "225–260 €" for a range. */
export const fmtRange = ([a, b]: [number, number]) => (a === b ? `${fmtEur(a)} €` : `${fmtEur(a)}–${fmtEur(b)} €`)
export const customerMessage = cfg.customerMessage

function range(v: number): [number, number] {
  const r = cfg.estimateRange
  const lo = Math.max(5, roundTo(v * r.low, r.roundTo)), hi = Math.max(lo, roundTo(v * r.high, r.roundTo))
  return [lo, hi]
}

/* ---------- mapping helpers ---------- */
export function serviceFor(p: Partial<Profile>): ServiceKey {
  switch (p.propertyType) {
    case 'praxis': return 'praxis'
    case 'kita': return 'kita'
    case 'schule': return 'school'
    case 'gewerbe': case 'halle': return 'retail'
    case 'wohnung': case 'haus': return 'home'
    default: return 'office'
  }
}
const floorKey: Record<FloorType, keyof typeof cfg.factors.floor> = { fliesen: 'tile_pvc', pvc: 'tile_pvc', linoleum: 'tile_pvc', laminat: 'laminate', parkett: 'laminate', teppich: 'carpet', stein: 'stone', gemischt: 'mixed' }
function floorFactor(p: Partial<Profile>) {
  const keys = Array.from(new Set((p.floorTypes ?? []).map(f => floorKey[f])))
  if (!keys.length) return cfg.factors.floor.mixed.factor
  if (keys.length > 1) return Math.max(cfg.factors.floor.mixed.factor, ...keys.map(k => cfg.factors.floor[k].factor))
  return cfg.factors.floor[keys[0]].factor
}
const dirtKey = { leicht: 'light', normal: 'normal', mittel: 'medium', stark: 'heavy' } as const
export function dirtFactor(p: Partial<Profile>) { return cfg.factors.dirt[dirtKey[p.dirt || 'normal']].factor }
function workTimeFactor(p: Partial<Profile>) {
  const k = p.timeWindow === 'abend' ? 'evening' : p.timeWindow === 'nacht' ? 'night' : p.timeWindow === 'wochenende' ? 'weekend' : 'day'
  return cfg.factors.workTime[k].factor
}
const accessKey = { einfach: 'easy', standard: 'standard', schwierig: 'difficult' } as const
function accessFactor(p: Partial<Profile>) { return cfg.factors.access[accessKey[p.access || 'standard']].factor }

/** cleanings per week derived from the profile (0 = one-off) */
export function perWeek(p: Partial<Profile>): number {
  switch (p.frequency) {
    case 'taeglich': return 5
    case 'woechentlich': return Math.max(1, p.timesPerPeriod ?? 1)
    case 'zweiwoechentlich': return 0.5
    case 'monatlich': return Math.max(1, p.timesPerPeriod ?? 1) / cfg.weeksPerMonth
    default: return 0
  }
}
function frequencyData(p: Partial<Profile>): { factor: number; visits: number; recurring: boolean } {
  const w = perWeek(p)
  if (!w) return { factor: cfg.frequencies['0.25'].factorPerVisit, visits: 1, recurring: false }
  const keys = Object.keys(cfg.frequencies).map(Number)
  const nearest = keys.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a))
  const f = cfg.frequencies[String(nearest) as keyof typeof cfg.frequencies]
  const visits = p.frequency === 'monatlich' ? Math.max(1, p.timesPerPeriod ?? 1) : money(w * cfg.weeksPerMonth)
  return { factor: f.factorPerVisit, visits, recurring: true }
}
/** Number of cleanings per month (1 for one-off). */
export function cleaningsPerMonth(p: Partial<Profile>): number { return Math.round(frequencyData(p).visits) }

/* ---------- add-ons (monthly, net) ---------- */
function addOnQuantity(unit: string, p: Partial<Profile>) {
  switch (unit) {
    case 'm2': return p.sizeSqm ?? 100
    case 'wc': return p.bathrooms ?? 1
    case 'chair': return p.desks ?? 4
    case 'seat': return 3
    case 'door_or_unit': return Math.max(4, (p.rooms ?? 2) * 2)
    default: return 1
  }
}
export function addOnsTotal(p: Partial<Profile>): { total: number; items: { id: string; label: string; qty: number; amount: number }[] } {
  const items = (p.extras ?? []).flatMap(id => {
    const a = (cfg.addOns as Record<string, { label: string; rate: number; unit: string }>)[id]
    if (!a) return []
    const qty = addOnQuantity(a.unit, p)
    return [{ id, label: a.label, qty, amount: money(qty * a.rate) }]
  })
  return { total: money(items.reduce((s, i) => s + i.amount, 0)), items }
}

/* ---------- the quote ---------- */
export function quote(p: Partial<Profile>): Quote {
  const area = p.sizeSqm ?? 100
  const outOfLimits = area < cfg.inputLimits.areaM2.min || area > cfg.inputLimits.areaM2.max
  const type: CleaningType = (p.cleaningType as CleaningType) || 'unterhalt'
  const dirt = dirtFactor(p)
  const addOns = addOnsTotal(p)
  const lines: Quote['lines'] = []
  let kind: Quote['kind'] = 'recurring', label = '', perVisit = 0, hours = 0, minApplied = false
  let freq = frequencyData(p)

  if (type === 'unterhalt' && p.propertyType === 'treppenhaus') {
    kind = 'stairs'; label = 'Treppenhausreinigung'
    const s = cfg.stairs
    const entrances = Math.max(1, p.entrances ?? 1), floors = p.floorsCount ?? (parseInt(p.floor || '') || 4)
    const raw = (entrances * s.entranceBase + entrances * floors * s.floorPerEntrance + (p.elevator ? s.elevator : 0) + (p.basement ? s.basement : 0) + area * s.corridorM2 + (p.windows ?? 0) * s.window) * dirt * freq.factor
    perVisit = Math.max(s.minimumPerVisit, raw); minApplied = raw < s.minimumPerVisit
    hours = perVisit / 30
    lines.push({ label: 'Eingänge · Etagen', value: `${entrances} · ${floors}` }, { label: 'Aufzug · Keller', value: `${p.elevator ? 'ja' : 'nein'} · ${p.basement ? 'ja' : 'nein'}` })
  } else if (type === 'unterhalt') {
    const key = serviceFor(p); const svc = cfg.services[key]; label = svc.label
    const wc = p.bathrooms ?? 1
    const minutes = area / svc.productivityM2PerHour * 60
      + (p.desks ?? 0) * cfg.minutesPerUnit.desk
      + wc * cfg.minutesPerUnit.wc + wc * cfg.minutesPerUnit.washbasin
      + (p.showers ?? 0) * cfg.minutesPerUnit.shower
      + cfg.kitchenMinutes[({ keine: 'none', klein: 'small', mittel: 'medium', gross: 'large' } as const)[p.kitchenSize || 'keine']].minutes
      + (p.wasteBins ?? p.desks ?? p.rooms ?? 0) * cfg.minutesPerUnit.wasteBin
    hours = minutes / 60 * dirt * floorFactor(p) * workTimeFactor(p) * accessFactor(p)
    const raw = hours * svc.salesRatePerHour * freq.factor
    perVisit = Math.max(svc.minimumPerVisit, raw); minApplied = raw < svc.minimumPerVisit
    lines.push({ label: 'Arbeitszeit pro Einsatz', value: `ca. ${hours.toFixed(1).replace('.', ',')} Std.` }, { label: 'Stundensatz', value: `${fmtEur(svc.salesRatePerHour)} € netto` })
  } else if (type === 'glas') {
    kind = 'glass'
    const svc = p.glassBothSides ? cfg.specialServices.glass_both_sides : cfg.specialServices.glass_inside; label = svc.label
    const glass = p.glassSqm ?? Math.max(5, Math.round(area * 0.25))
    const raw = glass * svc.rate * dirt
    perVisit = Math.max(svc.minimum, raw); minApplied = raw < svc.minimum
    hours = Math.max(1, glass / 40)
    lines.push({ label: 'Glasfläche', value: `${glass} m² · ${fmtEur(svc.rate)} €/m²` })
  } else if (type === 'garten') {
    kind = 'garden'; const svc = cfg.specialServices.garden_hour; label = svc.label
    const h = p.hours ?? Math.max(2, Math.round(area / 150))
    const raw = h * svc.rate
    perVisit = Math.max(svc.minimum, raw); minApplied = raw < svc.minimum; hours = h
    freq = { factor: 1, visits: 1, recurring: false }
    lines.push({ label: 'Arbeitsstunden', value: `${h} Std. · ${fmtEur(svc.rate)} €/Std.` })
  } else {
    kind = 'special'
    const svc = type === 'grund' ? cfg.specialServices.grundreinigung : type === 'intensiv' ? cfg.specialServices.intensive : type === 'bauend' ? cfg.specialServices.construction_final : type === 'baugrob' ? cfg.specialServices.construction_rough : cfg.specialServices.outdoor_pressure
    label = svc.label
    const raw = area * svc.rate * (type === 'aussen' ? 1 : dirt)
    perVisit = Math.max(svc.minimum, raw); minApplied = raw < svc.minimum
    hours = Math.max(2, area / 60)
    freq = { factor: 1, visits: 1, recurring: false }
    lines.push({ label: 'Fläche', value: `${area} m² · ${fmtEur(svc.rate)} €/m²` })
  }

  perVisit = money(perVisit)
  const recurring = freq.recurring
  const monthlyNet = money(perVisit * freq.visits + addOns.total)
  const firstMonthNet = money(recurring ? monthlyNet * (1 - cfg.firstMonthDiscount) : monthlyNet)
  const productiveHours = hours * freq.visits
  // safety floor is checked on the regular monthly price (the package checks the discounted first month, which flags nearly every recurring quote)
  const belowFloor = kind === 'recurring' && productiveHours > 0 && monthlyNet / productiveHours < cfg.safetyFloorPerProductiveHour
  if (addOns.total) lines.push({ label: 'Zusatzleistungen / Monat', value: `${fmtEur(addOns.total)} € netto` })

  return {
    kind, serviceLabel: label, recurring, perVisitNet: perVisit, visitsPerMonth: freq.visits, addOnsNet: addOns.total, monthlyNet, firstMonthNet,
    vatRate: cfg.vatRate, monthlyGross: money(monthlyNet * (1 + cfg.vatRate)), hoursPerVisit: money(hours),
    rangeVisit: range(perVisit), rangeMonthly: range(monthlyNet), minimumApplied: minApplied, belowFloor, outOfLimits,
    needsInspection: belowFloor || outOfLimits, lines,
  }
}

/* ---------- compatibility helpers used across the app ---------- */
/** Estimated NET price range per visit / execution. */
export function estimatePrice(p: Partial<Profile>): [number, number] { return quote(p).rangeVisit }
/** Estimated NET monthly range for recurring cleanings, null for one-off jobs. */
export function estimateMonthly(p: Partial<Profile>): [number, number] | null { const q = quote(p); return q.recurring ? q.rangeMonthly : null }
/** Range after the direct-contact discount (call / WhatsApp after sending the request). */
export function withDiscount([a, b]: [number, number]): [number, number] {
  const [d1, d2] = business.directDiscount
  return [Math.round(a * (1 - d2 / 100)), Math.round(b * (1 - d1 / 100))]
}
export function estimateDuration(p: Partial<Profile>): number { return Math.min(8, Math.max(1, Math.round(quote(p).hoursPerVisit))) }
/** Marketing text for the entry price. */
export function startingPriceText() { return `ab ${fmtEur(cfg.services.office.minimumPerVisit)} € pro Einsatz` }
/** kept for older call sites – hourly rate text */
export function sqmRateText() { return `${fmtEur(cfg.services.office.salesRatePerHour)} €/Std.` }
export const firstMonthDiscountPercent = Math.round(cfg.firstMonthDiscount * 100)
export const vatPercent = Math.round(cfg.vatRate * 100)
