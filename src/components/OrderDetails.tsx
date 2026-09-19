import { MapPin, Building2, Repeat, Layers, Phone, Mail, CalendarCheck, StickyNote, UserRound } from 'lucide-react'
import type { OrderRow } from '@/lib/supabase'
import { cleaningLabels, propertyLabels, floorLabels, frequencyLabels, timeWindowLabels, dirtLabels, accessLabels, kitchenLabels, extraLabel, formatDateDE } from '@/lib/labels'
import type { CleaningType, PropertyType, FloorType, Frequency, TimeWindow, DirtLevel, Access, KitchenSize } from '@/lib/types'

export function rhythmText(o: OrderRow) {
  if (!o.frequency) return 'einmalig'
  if (o.frequency === 'woechentlich' && o.times_per_period) return `${o.times_per_period}× pro Woche`
  if (o.frequency === 'monatlich' && o.times_per_period) return `${o.times_per_period}× pro Monat`
  return frequencyLabels[o.frequency as Frequency] ?? o.frequency
}
const yesNo = (v: unknown) => (v === true ? 'ja' : v === false ? 'nein' : '–')

/** Structured, read-only view of everything the customer entered. */
export function OrderDetails({ o, showContact = true, compact = false }: { o: OrderRow; showContact?: boolean; compact?: boolean }) {
  const d = o.details as Record<string, any>
  const commercial = !['wohnung', 'haus'].includes(o.property_type)
  const box = 'rounded-xl border border-line bg-surface-strong p-3 text-sm'
  const h = 'text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1 mb-1'
  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      <div className={box}>
        <div className={h}><Building2 size={12} /> Objekt</div>
        <div className="font-semibold">{propertyLabels[o.property_type as PropertyType] ?? o.property_type} · {o.size_sqm ?? '–'} m²</div>
        {o.property_type === 'treppenhaus'
          ? <div className="text-muted">{d.entrances ?? 1} Aufgang/-gänge · {d.floorsCount ?? '–'} Etagen · Fenster {d.windows ?? 0} · Keller {yesNo(d.basement)}</div>
          : <div className="text-muted">{d.rooms ? `${d.rooms} ${commercial ? 'Räume' : 'Zimmer'} · ` : ''}{d.bathrooms ?? '–'} {commercial ? 'WCs' : 'Bäder'}{d.desks ? ` · ${d.desks} Arbeitsplätze` : ''}{d.showers ? ` · ${d.showers} Duschen` : ''}{d.kitchenSize && d.kitchenSize !== 'keine' ? ` · Küche ${kitchenLabels[d.kitchenSize as KitchenSize]?.toLowerCase()}` : ''}{d.wasteBins ? ` · ${d.wasteBins} Mülleimer` : ''}</div>}
        <div className="text-muted text-xs mt-1">Etage {o.floor || '–'} · Aufzug {yesNo(d.elevator)}{!commercial ? ` · Haustiere ${yesNo(d.pets)}` : ''}</div>
      </div>
      <div className={box}>
        <div className={h}><Repeat size={12} /> Leistung</div>
        <div className="font-semibold">{cleaningLabels[o.cleaning_type as CleaningType] ?? o.cleaning_type}</div>
        <div className="text-muted">{rhythmText(o)}{o.time_window ? ` · ${timeWindowLabels[o.time_window as TimeWindow] ?? o.time_window}` : ''}</div>
        {o.cleaning_type === 'glas' && <div className="text-muted text-xs mt-1">Glas {d.glassBothSides ? 'beidseitig' : 'innen'}{d.glassSqm ? ` · ${d.glassSqm} m²` : ''}</div>}
        {o.cleaning_type === 'garten' && d.hours && <div className="text-muted text-xs mt-1">ca. {d.hours} Std.</div>}
        {Array.isArray(d.extras) && d.extras.length > 0 && <div className="text-muted text-xs mt-1">Zusatz: {d.extras.map((e: string) => extraLabel(e)).join(', ')}</div>}
      </div>
      <div className={box}>
        <div className={h}><Layers size={12} /> Böden · Zustand · Zugang</div>
        <div className="font-semibold">{Array.isArray(d.floorTypes) && d.floorTypes.length ? d.floorTypes.map((f: string) => floorLabels[f as FloorType] ?? f).join(', ') : '–'}</div>
        <div className="text-muted">{d.dirt ? dirtLabels[d.dirt as DirtLevel] : '–'} · Zugang {d.access ? accessLabels[d.access as Access].toLowerCase() : '–'}</div>
      </div>
      <div className={box}>
        <div className={h}><MapPin size={12} /> Adresse</div>
        <div className="font-semibold">{o.street || '–'}</div>
        <div className="text-muted">{o.zip} {o.city}</div>
      </div>
      <div className={box}>
        <div className={h}><CalendarCheck size={12} /> Wunschtermin</div>
        <div className="font-semibold">{o.preferred_date ? formatDateDE(o.preferred_date, { weekday: true }) : 'nach Absprache'}</div>
        <div className="text-muted">{o.preferred_time ? `${o.preferred_time} Uhr` : ''} · eingegangen {formatDateDE(o.created_at.slice(0, 10))}{o.source === 'ki' ? ' via Clea' : ''}</div>
      </div>
      {showContact && (
        <div className={box}>
          <div className={h}><UserRound size={12} /> Kontakt</div>
          <div className="font-semibold">{o.customer_name}</div>
          <div className="text-muted flex flex-col gap-0.5"><a href={`tel:${o.customer_phone}`} className="inline-flex items-center gap-1 hover:text-cyan-deep"><Phone size={12} /> {o.customer_phone}</a><a href={`mailto:${o.customer_email}`} className="inline-flex items-center gap-1 hover:text-cyan-deep"><Mail size={12} /> {o.customer_email}</a></div>
        </div>
      )}
      {o.notes && <div className={`${box} sm:col-span-2 lg:col-span-3 bg-amber-400/10 border-amber-400/30`}><div className={h}><StickyNote size={12} /> Hinweise des Kunden</div>{o.notes}</div>}
    </div>
  )
}
