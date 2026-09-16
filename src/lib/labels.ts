import type { CleaningType, Frequency, PropertyType, AppointmentStatus } from './types'

export const propertyLabels: Record<PropertyType, string> = {
  wohnung: 'Wohnung', haus: 'Haus', buero: 'Büro', praxis: 'Praxis',
}
export const cleaningLabels: Record<CleaningType, string> = {
  unterhalt: 'Unterhaltsreinigung', grund: 'Grundreinigung', umzug: 'Umzugsreinigung',
  fenster: 'Fensterreinigung', buero: 'Büroreinigung',
}
export const frequencyLabels: Record<Frequency, string> = {
  einmalig: 'Einmalig', woechentlich: 'Wöchentlich', zweiwoechentlich: 'Alle 2 Wochen', monatlich: 'Monatlich',
}
export const statusLabels: Record<AppointmentStatus, string> = {
  anfrage: 'Anfrage', angebot: 'Angebot gesendet', bestaetigt: 'Bestätigt', erledigt: 'Erledigt', storniert: 'Storniert',
}
export const extraOptions = [
  { id: 'fenster', label: 'Fenster innen & außen' },
  { id: 'backofen', label: 'Backofen' },
  { id: 'kuehlschrank', label: 'Kühlschrank' },
  { id: 'buegeln', label: 'Bügeln' },
  { id: 'balkon', label: 'Balkon / Terrasse' },
  { id: 'keller', label: 'Keller / Abstellraum' },
]
export const extraLabel = (id: string) => extraOptions.find(e => e.id === id)?.label ?? id

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
