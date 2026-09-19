/**
 * Local draft of the request form (kept in localStorage so the wizard and Clea share the same data).
 * Everything persistent (orders, users, reviews) lives in Supabase – see orders.ts / auth.tsx.
 */
import { useRef, useSyncExternalStore } from 'react'
import { emptyProfile, type Profile } from './types'

const KEY = 'gg-request-draft-v2'

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptyProfile, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...emptyProfile }
}

let state: Profile = typeof window !== 'undefined' ? load() : { ...emptyProfile }
const listeners = new Set<() => void>()
function emit() { listeners.forEach(l => l()); try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ } }

export const store = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  updateProfile(patch: Partial<Profile>) { state = { ...state, ...patch }; emit() },
  /** keep contact data, clear the object details (after a request was sent) */
  resetRequest() { state = { ...emptyProfile, name: state.name, email: state.email, phone: state.phone }; emit() },
  clear() { state = { ...emptyProfile }; emit() },
}

function shallowEqual(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  const ka = Object.keys(a as object), kb = Object.keys(b as object)
  return ka.length === kb.length && ka.every(k => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

/** Select from the draft. Object-returning selectors are shallow-compared so re-renders stay stable. */
export function useStore<T = Profile>(selector: (s: Profile) => T = s => s as unknown as T): T {
  const cache = useRef<{ input: Profile; out: T } | null>(null)
  const get = () => {
    const out = selector(state)
    if (cache.current && (cache.current.input === state || shallowEqual(cache.current.out, out))) return cache.current.out
    cache.current = { input: state, out }
    return out
  }
  return useSyncExternalStore(store.subscribe, get, get)
}

/** Which fields are still missing for a request, in the order the assistant asks for them. */
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
    if (f === 'pets' && p.propertyType && p.propertyType !== 'wohnung' && p.propertyType !== 'haus') return false
    return v === '' || v === null || v === undefined
  })
}
