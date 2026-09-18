import type { CleaningType, Frequency, PropertyType, AppointmentStatus, FloorType, TimeWindow, Profile } from './types'

export const propertyLabels: Record<PropertyType, string> = {
  buero: 'Büro', praxis: 'Praxis', kita: 'Kita', schule: 'Schule', treppenhaus: 'Treppenhaus',
  gewerbe: 'Gewerbeobjekt', halle: 'Halle / Lager', wohnung: 'Wohnung', haus: 'Haus',
}
/** Commercial objects (B2B) – shown first in the forms. */
export const commercialTypes: PropertyType[] = ['buero', 'praxis', 'kita', 'schule', 'treppenhaus', 'gewerbe', 'halle']
export const isCommercial = (t: PropertyType | '') => !!t && t !== 'wohnung' && t !== 'haus'

export const floorLabels: Record<FloorType, string> = {
  fliesen: 'Fliesen', teppich: 'Teppich', pvc: 'PVC / Vinyl', parkett: 'Parkett', laminat: 'Laminat', stein: 'Stein', linoleum: 'Linoleum', gemischt: 'Gemischt',
}
export const cleaningLabels: Record<CleaningType, string> = {
  unterhalt: 'Unterhaltsreinigung', grund: 'Grundreinigung', umzug: 'Umzugsreinigung',
  fenster: 'Fensterreinigung', buero: 'Büroreinigung',
}
export const frequencyLabels: Record<Frequency, string> = {
  taeglich: 'Täglich (Mo–Fr)', woechentlich: 'Wöchentlich', zweiwoechentlich: 'Alle 2 Wochen', monatlich: 'Monatlich', einmalig: 'Einmalig',
}
export const timeWindowLabels: Record<TimeWindow, string> = {
  frueh: 'Früh (06–08 Uhr)', vormittag: 'Vormittags (08–12 Uhr)', nachmittag: 'Nachmittags (12–17 Uhr)', abend: 'Abends (17–21 Uhr)', flexibel: 'Flexibel',
}
export const statusLabels: Record<AppointmentStatus, string> = {
  anfrage: 'Anfrage', angebot: 'Angebot gesendet', bestaetigt: 'Bestätigt', erledigt: 'Erledigt', storniert: 'Storniert',
}
export const extraOptions = [
  { id: 'fenster', label: 'Fenster innen & außen' },
  { id: 'sanitaer', label: 'Sanitär-Intensiv' },
  { id: 'kueche', label: 'Teeküche / Küche' },
  { id: 'backofen', label: 'Backofen' },
  { id: 'kuehlschrank', label: 'Kühlschrank' },
  { id: 'buegeln', label: 'Bügeln' },
  { id: 'balkon', label: 'Balkon / Terrasse' },
  { id: 'keller', label: 'Keller / Abstellraum' },
  { id: 'material', label: 'Verbrauchsmaterial (Seife, Papier)' },
]
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
