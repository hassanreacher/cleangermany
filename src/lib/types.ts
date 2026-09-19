export type PropertyType = 'wohnung' | 'haus' | 'buero' | 'praxis' | 'kita' | 'schule' | 'treppenhaus' | 'gewerbe' | 'halle'
export type FloorType = 'fliesen' | 'teppich' | 'pvc' | 'parkett' | 'laminat' | 'stein' | 'linoleum' | 'gemischt'
/**
 * unterhalt = recurring maintenance cleaning (office, praxis, kita, school, retail, stairwell, home)
 * grund / intensiv / bauend / baugrob = one-off deep cleaning per m²
 * glas = glass cleaning per m² glass · garten = garden work per hour · aussen = outdoor high-pressure cleaning per m²
 */
export type CleaningType = 'unterhalt' | 'grund' | 'intensiv' | 'bauend' | 'baugrob' | 'glas' | 'garten' | 'aussen'
/** Rhythm of the cleaning. `timesPerPeriod` holds the number of cleanings per week (woechentlich) or per month (monatlich). */
export type Frequency = 'einmalig' | 'taeglich' | 'woechentlich' | 'zweiwoechentlich' | 'monatlich'
export type TimeWindow = 'frueh' | 'vormittag' | 'nachmittag' | 'abend' | 'nacht' | 'wochenende' | 'flexibel'
export type DirtLevel = 'leicht' | 'normal' | 'mittel' | 'stark'
export type Access = 'einfach' | 'standard' | 'schwierig'
export type KitchenSize = 'keine' | 'klein' | 'mittel' | 'gross'

export interface Profile {
  name: string
  email: string
  phone: string
  street: string
  zip: string
  city: string
  propertyType: PropertyType | ''
  sizeSqm: number | null
  rooms: number | null
  /** sanitary rooms / WCs */
  bathrooms: number | null
  floor: string
  elevator: boolean | null
  pets: boolean | null
  floorTypes: FloorType[]
  cleaningType: CleaningType | ''
  frequency: Frequency | ''
  /** cleanings per week (frequency = woechentlich) or per month (frequency = monatlich) */
  timesPerPeriod: number | null
  timeWindow: TimeWindow | ''
  dirt: DirtLevel | ''
  access: Access | ''
  /** workplaces / desks (commercial) */
  desks: number | null
  showers: number | null
  kitchenSize: KitchenSize | ''
  wasteBins: number | null
  /** glass cleaning */
  glassSqm: number | null
  glassBothSides: boolean
  /** stairwell cleaning */
  entrances: number | null
  floorsCount: number | null
  basement: boolean | null
  windows: number | null
  /** garden work */
  hours: number | null
  /** monthly add-on keys (see pricingConfig.addOns) */
  extras: string[]
  notes: string
}

export type AppointmentStatus = 'anfrage' | 'angebot' | 'bestaetigt' | 'erledigt' | 'storniert'

export interface Appointment {
  id: string
  code: string
  createdAt: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  durationH: number
  customer: Profile
  status: AppointmentStatus
  price: number | null
  /** estimated net price range per visit */
  estimate: [number, number]
  team?: string
  source: 'web' | 'ki' | 'telefon'
}

export interface User {
  email: string
  role: 'kunde' | 'inhaber'
}

export interface AppState {
  user: User | null
  profile: Profile
  appointments: Appointment[]
  blockedSlots: string[] // `${date}T${time}` blocked by the owner
}

export const emptyProfile: Profile = {
  name: '', email: '', phone: '', street: '', zip: '', city: '',
  propertyType: '', sizeSqm: null, rooms: null, bathrooms: null, floor: '',
  elevator: null, pets: null, floorTypes: [], cleaningType: '', frequency: '', timesPerPeriod: null, timeWindow: '',
  dirt: '', access: '', desks: null, showers: null, kitchenSize: '', wasteBins: null,
  glassSqm: null, glassBothSides: false, entrances: null, floorsCount: null, basement: null, windows: null, hours: null,
  extras: [], notes: '',
}
