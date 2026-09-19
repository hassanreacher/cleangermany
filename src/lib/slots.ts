export const OPENING = { start: 8, end: 18 } // Mo–Sa 08:00–18:00
export const SLOT_TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00']

export const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const fromISO = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
export const todayISO = () => toISO(new Date())
export const addDays = (iso: string, n: number) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d) }

export function isBusinessDay(iso: string) { const d = fromISO(iso).getDay(); return d !== 0 }

/** Free time windows on a date, given the occupied keys `${date}T${time}` loaded from the database. */
export function freeSlots(iso: string, booked: Set<string>): string[] {
  if (!isBusinessDay(iso)) return []
  const today = todayISO()
  if (iso < today) return []
  const now = new Date()
  return SLOT_TIMES.filter(t => {
    if (iso === today && parseInt(t) <= now.getHours() + 1) return false
    return !booked.has(`${iso}T${t}`)
  })
}

export function nextAvailable(booked: Set<string>, count = 6, from = todayISO()) {
  const out: { date: string; times: string[] }[] = []
  let iso = from
  for (let i = 0; i < 60 && out.length < count; i++) {
    const times = freeSlots(iso, booked)
    if (times.length) out.push({ date: iso, times })
    iso = addDays(iso, 1)
  }
  return out
}
