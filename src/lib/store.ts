import { useRef, useSyncExternalStore } from 'react'
import { emptyProfile, type Appointment, type AppState, type Profile, type User } from './types'
import { demoAppointments } from './data'
import { estimateDuration, estimatePrice } from './pricing'

const KEY = 'clean-demo-state-v1'

/** Older saved profiles used other cleaning-type / extra keys – map them onto the current pricing model. */
const legacyType: Record<string, Profile['cleaningType']> = { buero: 'unterhalt', umzug: 'grund', fenster: 'glas' }
const legacyExtras: Record<string, string> = { backofen: 'oven_inside', kuehlschrank: 'fridge_inside', sanitaer: 'deep_wc', fenster: '' , kueche: '', buegeln: '', balkon: '', keller: '', material: '' }
function migrateProfile(p: Partial<Profile> | undefined): Profile {
  const m = { ...emptyProfile, ...(p ?? {}) } as Profile
  if (m.cleaningType && (m.cleaningType as string) in legacyType) m.cleaningType = legacyType[m.cleaningType as string]
  m.extras = (m.extras ?? []).map(e => (e in legacyExtras ? legacyExtras[e] : e)).filter(Boolean)
  return m
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const st = { blockedSlots: [], ...JSON.parse(raw) } as AppState
      // migrate profiles saved before the commercial fields existed
      st.profile = migrateProfile(st.profile)
      st.appointments = (st.appointments ?? []).map(a => ({ ...a, customer: migrateProfile(a.customer) }))
      return st
    }
  } catch { /* ignore */ }
  return { user: null, profile: { ...emptyProfile }, appointments: demoAppointments, blockedSlots: [] }
}

let state: AppState = typeof window !== 'undefined' ? load() : { user: null, profile: { ...emptyProfile }, appointments: [], blockedSlots: [] }
const listeners = new Set<() => void>()
function emit() { listeners.forEach(l => l()); try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ } }
function set(patch: Partial<AppState>) { state = { ...state, ...patch }; emit() }

export const store = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  login(email: string) {
    const role: User['role'] = /inhaber|admin|owner/i.test(email) ? 'inhaber' : 'kunde'
    set({ user: { email, role }, profile: { ...state.profile, email: state.profile.email || email } })
  },
  logout() { set({ user: null }) },
  updateProfile(patch: Partial<Profile>) { set({ profile: { ...state.profile, ...patch } }) },
  resetDemo() { localStorage.removeItem(KEY); state = load(); emit() },
  book(date: string, time: string, source: Appointment['source'] = 'web'): Appointment {
    const p = state.profile
    const appt: Appointment = {
      id: 'u' + Date.now().toString(36), code: 'CL-' + (24860 + state.appointments.length),
      createdAt: new Date().toISOString().slice(0, 10), date, time, durationH: estimateDuration(p),
      customer: { ...p }, status: 'anfrage', price: null, estimate: estimatePrice(p), source,
    }
    set({ appointments: [appt, ...state.appointments] })
    return appt
  },
  updateAppointment(id: string, patch: Partial<Appointment>) {
    set({ appointments: state.appointments.map(a => (a.id === id ? { ...a, ...patch } : a)) })
  },
  toggleBlock(date: string, time: string) {
    const k = `${date}T${time}`
    set({ blockedSlots: state.blockedSlots.includes(k) ? state.blockedSlots.filter(b => b !== k) : [...state.blockedSlots, k] })
  },
}

function shallowEqual(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  const ka = Object.keys(a as object), kb = Object.keys(b as object)
  return ka.length === kb.length && ka.every(k => Object.is((a as any)[k], (b as any)[k]))
}

/** Select from the store. Object-returning selectors are shallow-compared so re-renders stay stable. */
export function useStore<T = AppState>(selector: (s: AppState) => T = s => s as unknown as T): T {
  const cache = useRef<{ input: AppState; out: T } | null>(null)
  const get = () => {
    const out = selector(state)
    if (cache.current && (cache.current.input === state || shallowEqual(cache.current.out, out))) return cache.current.out
    cache.current = { input: state, out }
    return out
  }
  return useSyncExternalStore(store.subscribe, get, get)
}

/** Which profile fields are still missing for a booking, in the order the assistant asks for them. */
export const requiredFields: (keyof Profile)[] = ['name', 'propertyType', 'sizeSqm', 'cleaningType', 'frequency', 'timesPerPeriod', 'floorTypes', 'dirt', 'rooms', 'bathrooms', 'access', 'timeWindow', 'street', 'zip', 'city', 'floor', 'elevator', 'pets', 'extras', 'phone', 'email']
const oneOff = new Set(['grund', 'intensiv', 'bauend', 'baugrob', 'garten', 'aussen'])
export function missingFields(p: Profile): (keyof Profile)[] {
  return requiredFields.filter(f => {
    const v = p[f]
    if (f === 'extras' || f === 'notes') return false // optional
    if (f === 'floorTypes') return p.cleaningType === 'garten' || p.cleaningType === 'aussen' ? false : !p.floorTypes?.length
    if (f === 'frequency') return oneOff.has(p.cleaningType) ? false : !p.frequency
    if (f === 'timesPerPeriod') return (p.frequency === 'woechentlich' || p.frequency === 'monatlich') && !p.timesPerPeriod
    if (f === 'rooms') return p.propertyType === 'treppenhaus' || (p.propertyType && p.propertyType !== 'wohnung' && p.propertyType !== 'haus') ? false : !p.rooms
    if (f === 'bathrooms') return p.propertyType === 'treppenhaus' || p.cleaningType === 'garten' || p.cleaningType === 'aussen' || p.cleaningType === 'glas' ? false : !p.bathrooms
    if (f === 'access') return p.cleaningType && p.cleaningType !== 'unterhalt' ? false : !p.access
    // private households: pets matter, for commercial objects we skip the question
    if (f === 'pets' && p.propertyType && p.propertyType !== 'wohnung' && p.propertyType !== 'haus') return false
    return v === '' || v === null || v === undefined
  })
}
