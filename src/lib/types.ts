export type PropertyType = 'wohnung' | 'haus' | 'buero' | 'praxis'
export type CleaningType = 'unterhalt' | 'grund' | 'umzug' | 'fenster' | 'buero'
export type Frequency = 'einmalig' | 'woechentlich' | 'zweiwoechentlich' | 'monatlich'

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
  cleaningType: CleaningType | ''
  frequency: Frequency | ''
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
  elevator: null, pets: null, cleaningType: '', frequency: '', extras: [], notes: '',
}
