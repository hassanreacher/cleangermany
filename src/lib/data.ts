import type { Appointment, Profile } from './types'
import { addDays, todayISO } from './slots'

const mk = (over: Partial<Profile>): Profile => ({
  name: '', email: '', phone: '', street: '', zip: '', city: '', propertyType: 'wohnung', sizeSqm: 70, rooms: 3,
  bathrooms: 1, floor: '2', elevator: true, pets: false, floorTypes: ['parkett'], cleaningType: 'unterhalt', frequency: 'einmalig', timesPerPeriod: null, timeWindow: 'flexibel', extras: [], notes: '', ...over,
})

const t = todayISO()

/** Realistic dummy bookings for the demo dashboard (German customers, cities, prices). */
export const demoAppointments: Appointment[] = [
  { id: 'a1', code: 'CL-24817', createdAt: addDays(t, -12), date: addDays(t, -9), time: '08:00', durationH: 3, status: 'erledigt', price: 129, estimate: [110, 140], team: 'Team Nord', source: 'web',
    customer: mk({ name: 'Anna Schneider', email: 'anna.schneider@example.de', phone: '+49 30 1234567', street: 'Kastanienallee 12', zip: '10435', city: 'Berlin', sizeSqm: 82, rooms: 3, cleaningType: 'grund' }) },
  { id: 'a2', code: 'CL-24820', createdAt: addDays(t, -10), date: addDays(t, -6), time: '10:00', durationH: 2, status: 'erledigt', price: 89, estimate: [80, 100], team: 'Team Nord', source: 'ki',
    customer: mk({ name: 'Lukas Weber', email: 'lukas.weber@example.de', phone: '+49 40 9876543', street: 'Eppendorfer Weg 44', zip: '20259', city: 'Hamburg', sizeSqm: 58, rooms: 2 }) },
  { id: 'a3', code: 'CL-24831', createdAt: addDays(t, -7), date: addDays(t, -3), time: '14:00', durationH: 4, status: 'erledigt', price: 219, estimate: [200, 250], team: 'Team Süd', source: 'telefon',
    customer: mk({ name: 'Praxis Dr. Hoffmann', email: 'info@praxis-hoffmann.de', phone: '+49 89 5551234', street: 'Leopoldstraße 88', zip: '80802', city: 'München', propertyType: 'praxis', sizeSqm: 140, rooms: 6, bathrooms: 2, floorTypes: ['pvc', 'fliesen'], cleaningType: 'buero', frequency: 'woechentlich', timesPerPeriod: 3, timeWindow: 'abend' }) },
  { id: 'a4', code: 'CL-24838', createdAt: addDays(t, -4), date: addDays(t, 1), time: '08:00', durationH: 3, status: 'bestaetigt', price: 149, estimate: [130, 160], team: 'Team Süd', source: 'web',
    customer: mk({ name: 'Familie Müller', email: 'familie.mueller@example.de', phone: '+49 221 334455', street: 'Aachener Straße 210', zip: '50931', city: 'Köln', propertyType: 'haus', sizeSqm: 130, rooms: 5, bathrooms: 2, pets: true, extras: ['fenster'] }) },
  { id: 'a5', code: 'CL-24842', createdAt: addDays(t, -3), date: addDays(t, 2), time: '12:00', durationH: 2, status: 'bestaetigt', price: 79, estimate: [70, 90], team: 'Team Nord', source: 'ki',
    customer: mk({ name: 'Sophie Becker', email: 'sophie.becker@example.de', phone: '+49 69 7788990', street: 'Bornheimer Landstraße 5', zip: '60316', city: 'Frankfurt am Main', sizeSqm: 45, rooms: 2, frequency: 'zweiwoechentlich', floorTypes: ['laminat'] }) },
  { id: 'a6', code: 'CL-24845', createdAt: addDays(t, -2), date: addDays(t, 3), time: '10:00', durationH: 5, status: 'angebot', price: 289, estimate: [260, 320], source: 'web',
    customer: mk({ name: 'Jonas Fischer', email: 'jonas.fischer@example.de', phone: '+49 711 445566', street: 'Königstraße 3', zip: '70173', city: 'Stuttgart', sizeSqm: 110, rooms: 4, cleaningType: 'umzug', extras: ['backofen', 'kuehlschrank', 'fenster'] }) },
  { id: 'a7', code: 'CL-24849', createdAt: addDays(t, -1), date: addDays(t, 4), time: '14:00', durationH: 3, status: 'anfrage', price: null, estimate: [120, 150], source: 'ki',
    customer: mk({ name: 'Mia Wagner', email: 'mia.wagner@example.de', phone: '+49 211 998877', street: 'Kaiserswerther Straße 60', zip: '40477', city: 'Düsseldorf', sizeSqm: 95, rooms: 3, floor: '4', elevator: false, pets: true, cleaningType: 'grund', notes: 'Bitte klingeln bei Wagner, Hund ist freundlich.' }) },
  { id: 'a8', code: 'CL-24851', createdAt: t, date: addDays(t, 5), time: '08:00', durationH: 6, status: 'anfrage', price: null, estimate: [280, 350], source: 'web',
    customer: mk({ name: 'Bürogemeinschaft Nordlicht GmbH', email: 'office@nordlicht.example', phone: '+49 421 223344', street: 'Am Wall 120', zip: '28195', city: 'Bremen', propertyType: 'buero', sizeSqm: 240, rooms: 10, bathrooms: 3, floorTypes: ['teppich', 'fliesen'], cleaningType: 'buero', frequency: 'woechentlich', timesPerPeriod: 2, timeWindow: 'frueh', notes: 'Zugang ab 07:30 über Hinterhof.' }) },
  { id: 'a9', code: 'CL-24853', createdAt: t, date: addDays(t, 7), time: '10:00', durationH: 2, status: 'bestaetigt', price: 95, estimate: [85, 105], team: 'Team Nord', source: 'web',
    customer: mk({ name: 'Elias Schulz', email: 'elias.schulz@example.de', phone: '+49 341 556677', street: 'Karl-Liebknecht-Straße 14', zip: '04107', city: 'Leipzig', sizeSqm: 64, rooms: 2, cleaningType: 'fenster' }) },
  { id: 'a10', code: 'CL-24855', createdAt: addDays(t, -20), date: addDays(t, -15), time: '16:00', durationH: 3, status: 'storniert', price: 119, estimate: [110, 130], source: 'telefon',
    customer: mk({ name: 'Laura Koch', email: 'laura.koch@example.de', phone: '+49 511 112233', street: 'Lister Meile 9', zip: '30161', city: 'Hannover', sizeSqm: 75, rooms: 3 }) },
]

export const revenueByMonth = [
  { m: 'Apr', umsatz: 6800, auftraege: 41 }, { m: 'Mai', umsatz: 7900, auftraege: 47 }, { m: 'Jun', umsatz: 9100, auftraege: 55 },
  { m: 'Jul', umsatz: 8600, auftraege: 52 }, { m: 'Aug', umsatz: 10400, auftraege: 63 }, { m: 'Sep', umsatz: 11250, auftraege: 68 },
]
export const serviceMix = [
  { name: 'Unterhalt', value: 46 }, { name: 'Grund', value: 22 }, { name: 'Büro', value: 17 }, { name: 'Umzug', value: 9 }, { name: 'Fenster', value: 6 },
]
export const team = [
  { name: 'Team Nord', lead: 'Katrin Lehmann', members: 3, city: 'Berlin / Hamburg', rating: 4.9 },
  { name: 'Team Süd', lead: 'Mehmet Yilmaz', members: 4, city: 'München / Stuttgart', rating: 4.8 },
  { name: 'Team West', lead: 'Julia Brandt', members: 3, city: 'Köln / Düsseldorf', rating: 4.9 },
]

export const cities = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster']

/** Very small PLZ → Stadt lookup for the demo (prefix based). */
const plzMap: [string, string][] = [
  ['10', 'Berlin'], ['12', 'Berlin'], ['13', 'Berlin'], ['14', 'Berlin'], ['20', 'Hamburg'], ['21', 'Hamburg'], ['22', 'Hamburg'],
  ['80', 'München'], ['81', 'München'], ['50', 'Köln'], ['51', 'Köln'], ['60', 'Frankfurt am Main'], ['70', 'Stuttgart'],
  ['40', 'Düsseldorf'], ['04', 'Leipzig'], ['44', 'Dortmund'], ['45', 'Essen'], ['28', 'Bremen'], ['01', 'Dresden'], ['30', 'Hannover'], ['90', 'Nürnberg'],
  ['47', 'Duisburg'], ['53', 'Bonn'], ['48', 'Münster'], ['33', 'Bielefeld'], ['42', 'Wuppertal'],
]
export function cityFromZip(zip: string): string | null {
  if (!/^\d{5}$/.test(zip)) return null
  const hit = plzMap.find(([p]) => zip.startsWith(p))
  return hit ? hit[1] : null
}
