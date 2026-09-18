export type PropertyType = 'wohnung' | 'haus' | 'buero' | 'praxis' | 'kita' | 'schule' | 'treppenhaus' | 'gewerbe' | 'halle'
export type FloorType = 'fliesen' | 'teppich' | 'pvc' | 'parkett' | 'laminat' | 'stein' | 'linoleum' | 'gemischt'
export type CleaningType = 'unterhalt' | 'grund' | 'umzug' | 'fenster' | 'buero'
/** Rhythm of the cleaning. `timesPerPeriod` holds the number of cleanings per week (woechentlich) or per month (monatlich). */
export type Frequency = 'einmalig' | 'taeglich' | 'woechentlich' | 'zweiwoechentlich' | 'monatlich'
export type TimeWindow = 'frueh' | 'vormittag' | 'nachmittag' | 'abend' | 'flexibel'

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
  elevator: null, pets: null, floorTypes: [], cleaningType: '', frequency: '', timesPerPeriod: null, timeWindow: '', extras: [], notes: '',
}
