import type { CleaningType, Frequency, PropertyType, AppointmentStatus, FloorType, TimeWindow, Profile, DirtLevel, Access, KitchenSize } from './types'
import { pricingConfig, type AddOnKey } from './pricingConfig'

export const propertyLabels: Record<PropertyType, string> = {
  buero: 'Büro', praxis: 'Praxis', kita: 'Kita', schule: 'Schule', treppenhaus: 'Treppenhaus',
  gewerbe: 'Gewerbe / Laden', halle: 'Halle / Lager', wohnung: 'Wohnung', haus: 'Haus',
}
/** Commercial objects (B2B) – shown first in the forms. */
export const commercialTypes: PropertyType[] = ['buero', 'praxis', 'kita', 'schule', 'treppenhaus', 'gewerbe', 'halle']
export const isCommercial = (t: PropertyType | '') => !!t && t !== 'wohnung' && t !== 'haus'

export const floorLabels: Record<FloorType, string> = {
  fliesen: 'Fliesen', teppich: 'Teppich', pvc: 'PVC / Vinyl', parkett: 'Parkett', laminat: 'Laminat', stein: 'Stein', linoleum: 'Linoleum', gemischt: 'Gemischt',
}
export const cleaningLabels: Record<CleaningType, string> = {
  unterhalt: 'Unterhaltsreinigung', grund: 'Grundreinigung', intensiv: 'Intensivreinigung', bauend: 'Bauendreinigung', baugrob: 'Baugrobreinigung',
  glas: 'Glasreinigung', garten: 'Gartenarbeit', aussen: 'Außenreinigung (Hochdruck)',
}
export const cleaningDesc: Record<CleaningType, string> = {
  unterhalt: 'Regelmäßig: Büro, Praxis, Kita, Schule, Laden, Treppenhaus oder Zuhause – Stundensatz ab 30 € netto',
  grund: 'Einmalig, intensiv bis in die Ecken – 3,20 €/m², mind. 180 €',
  intensiv: 'Gründlicher als die Unterhaltsreinigung – 2,40 €/m², mind. 150 €',
  bauend: 'Bezugsfertig nach dem Bau – 4,00 €/m², mind. 250 €',
  baugrob: 'Grobreinigung während/nach dem Bau – 2,50 €/m², mind. 220 €',
  glas: 'Innen 2,20 €/m² Glas · beidseitig 3,60 €/m² – mind. 69 €',
  garten: 'Rasen, Hecke, Laub, Unkraut – 34 €/Std., mind. 85 €',
  aussen: 'Wege, Terrassen, Fassade, Garage, Solar – ab 2,50 €/m², mind. 120 €',
}
/** Which services are one-off by nature (frequency is not asked). */
export const oneOffTypes: CleaningType[] = ['grund', 'intensiv', 'bauend', 'baugrob', 'garten', 'aussen']

export const frequencyLabels: Record<Frequency, string> = {
  taeglich: 'Täglich (Mo–Fr)', woechentlich: 'Wöchentlich', zweiwoechentlich: 'Alle 2 Wochen', monatlich: 'Monatlich', einmalig: 'Einmalig',
}
export const timeWindowLabels: Record<TimeWindow, string> = {
  frueh: 'Früh (06–08 Uhr)', vormittag: 'Vormittags (08–12 Uhr)', nachmittag: 'Nachmittags (12–17 Uhr)', abend: 'Abends (17–22 Uhr)', nacht: 'Nachts (22–06 Uhr)', wochenende: 'Wochenende', flexibel: 'Flexibel',
}
export const dirtLabels: Record<DirtLevel, string> = { leicht: 'Leicht', normal: 'Normal', mittel: 'Mittel', stark: 'Stark' }
export const dirtDesc: Record<DirtLevel, string> = { leicht: 'Gepflegt, wenig Nutzung (−10 %)', normal: 'Übliche Nutzung', mittel: 'Viel Publikumsverkehr (+20 %)', stark: 'Lange nicht gereinigt (+45 %)' }
export const accessLabels: Record<Access, string> = { einfach: 'Einfach', standard: 'Standard', schwierig: 'Schwierig' }
export const accessDesc: Record<Access, string> = { einfach: 'Ebenerdig, Schlüssel vorhanden', standard: 'Etage, Aufzug oder Anmeldung (+5 %)', schwierig: 'Viele Etagen ohne Aufzug, Sicherheitsbereich (+18 %)' }
export const kitchenLabels: Record<KitchenSize, string> = { keine: 'Keine', klein: 'Klein (Teeküche)', mittel: 'Mittel', gross: 'Groß (Kantine)' }

export const statusLabels: Record<AppointmentStatus, string> = {
  anfrage: 'Anfrage', angebot: 'Angebot gesendet', bestaetigt: 'Bestätigt', erledigt: 'Erledigt', storniert: 'Storniert',
}

const unitLabels: Record<string, string> = { execution: 'pro Ausführung', door_or_unit: 'pro Tür', wc: 'pro WC', m2: 'pro m²', chair: 'pro Stuhl', seat: 'pro Sitz' }
/** Monthly add-ons derived from the pricing config (net prices). */
export const extraOptions = (Object.keys(pricingConfig.addOns) as AddOnKey[]).map(id => {
  const a = pricingConfig.addOns[id]
  return { id, label: a.label, rate: a.rate, unit: a.unit, unitLabel: unitLabels[a.unit] ?? a.unit, priceText: `${a.rate.toLocaleString('de-DE', { minimumFractionDigits: a.rate % 1 ? 2 : 0 })} € ${unitLabels[a.unit] ?? ''}`.trim() }
})
export const extraLabel = (id: string) => extraOptions.find(e => e.id === id)?.label ?? id

/** Human readable rhythm, e.g. "3× pro Woche" */
export function frequencyText(p: Partial<Profile>) {
  const f = p.frequency
  if (!f) return ''
  if (f === 'woechentlich' && p.timesPerPeriod) return `${p.timesPerPeriod}× pro Woche`
  if (f === 'monatlich' && p.timesPerPeriod) return `${p.timesPerPeriod}× pro Monat`
  return frequencyLabels[f]
}

export const weekdaysShort = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const weekdaysLong = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
export const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export function formatDateDE(iso: string, opts: { weekday?: boolean } = {}) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const base = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
  return opts.weekday ? `${weekdaysLong[dt.getDay()]}, ${base}` : base
}
export const euro = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const euro2 = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
