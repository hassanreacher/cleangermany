import type { Appointment, Profile } from './types'
import { addDays, todayISO } from './slots'

const mk = (over: Partial<Profile>): Profile => ({
  name: '', email: '', phone: '', street: '', zip: '', city: '', propertyType: 'wohnung', sizeSqm: 70, rooms: 3,
  bathrooms: 1, floor: '2', elevator: true, pets: false, floorTypes: ['parkett'], cleaningType: 'unterhalt', frequency: 'einmalig', timesPerPeriod: null, timeWindow: 'flexibel', dirt: 'normal', access: 'standard', desks: null, showers: 0, kitchenSize: 'klein', wasteBins: null, glassSqm: null, glassBothSides: false, entrances: null, floorsCount: null, basement: null, windows: null, hours: null, extras: [], notes: '', ...over,
})

const t = todayISO()

/** Realistic dummy bookings for the demo dashboard (German customers, cities, prices). */
export const demoAppointments: Appointment[] = [
  { id: 'a1', code: 'CL-24817', createdAt: addDays(t, -12), date: addDays(t, -9), time: '08:00', durationH: 3, status: 'erledigt', price: 129, estimate: [110, 140], team: 'Team Süd', source: 'web',
    customer: mk({ name: 'Anna Schneider', email: 'anna.schneider@example.de', phone: '+49 30 1234567', street: 'Kastanienallee 12', zip: '10435', city: 'Berlin', sizeSqm: 82, rooms: 3, cleaningType: 'grund' }) },
  { id: 'a2', code: 'CL-24820', createdAt: addDays(t, -10), date: addDays(t, -6), time: '10:00', durationH: 2, status: 'erledigt', price: 89, estimate: [80, 100], team: 'Team Süd', source: 'ki',
    customer: mk({ name: 'Lukas Weber', email: 'lukas.weber@example.de', phone: '+49 30 9876543', street: 'Hauptstraße 44', zip: '12159', city: 'Berlin', sizeSqm: 58, rooms: 2 }) },
  { id: 'a3', code: 'CL-24831', createdAt: addDays(t, -7), date: addDays(t, -3), time: '14:00', durationH: 4, status: 'erledigt', price: 219, estimate: [200, 250], team: 'Team Süd', source: 'telefon',
    customer: mk({ name: 'Praxis Dr. Hoffmann', email: 'info@praxis-hoffmann.de', phone: '+49 30 5551234', street: 'Schloßstraße 88', zip: '12163', city: 'Berlin', propertyType: 'praxis', sizeSqm: 140, rooms: 6, bathrooms: 2, desks: 6, floorTypes: ['pvc', 'fliesen'], cleaningType: 'unterhalt', frequency: 'woechentlich', timesPerPeriod: 3, timeWindow: 'abend' }) },
  { id: 'a4', code: 'CL-24838', createdAt: addDays(t, -4), date: addDays(t, 1), time: '08:00', durationH: 3, status: 'bestaetigt', price: 149, estimate: [130, 160], team: 'Team Süd', source: 'web',
    customer: mk({ name: 'Familie Müller', email: 'familie.mueller@example.de', phone: '+49 30 334455', street: 'Bahnhofstraße 21', zip: '12305', city: 'Berlin', propertyType: 'haus', sizeSqm: 130, rooms: 5, bathrooms: 2, pets: true, extras: [] }) },
  { id: 'a5', code: 'CL-24842', createdAt: addDays(t, -3), date: addDays(t, 2), time: '12:00', durationH: 2, status: 'bestaetigt', price: 79, estimate: [70, 90], team: 'Team Süd', source: 'ki',
    customer: mk({ name: 'Sophie Becker', email: 'sophie.becker@example.de', phone: '+49 30 7788990', street: 'Rheinstraße 5', zip: '12161', city: 'Berlin', sizeSqm: 45, rooms: 2, frequency: 'zweiwoechentlich', floorTypes: ['laminat'] }) },
  { id: 'a6', code: 'CL-24845', createdAt: addDays(t, -2), date: addDays(t, 3), time: '10:00', durationH: 5, status: 'angebot', price: 289, estimate: [260, 320], source: 'web',
    customer: mk({ name: 'Jonas Fischer', email: 'jonas.fischer@example.de', phone: '+49 30 445566', street: 'Kurfürstendamm 30', zip: '10719', city: 'Berlin', sizeSqm: 110, rooms: 4, cleaningType: 'grund', extras: [] }) },
  { id: 'a7', code: 'CL-24849', createdAt: addDays(t, -1), date: addDays(t, 4), time: '14:00', durationH: 3, status: 'anfrage', price: null, estimate: [120, 150], source: 'ki',
    customer: mk({ name: 'Mia Wagner', email: 'mia.wagner@example.de', phone: '+49 30 998877', street: 'Mariendorfer Damm 60', zip: '12109', city: 'Berlin', sizeSqm: 95, rooms: 3, floor: '4', elevator: false, pets: true, cleaningType: 'grund', notes: 'Bitte klingeln bei Wagner, Hund ist freundlich.' }) },
  { id: 'a8', code: 'CL-24851', createdAt: t, date: addDays(t, 5), time: '08:00', durationH: 6, status: 'anfrage', price: null, estimate: [280, 350], source: 'web',
    customer: mk({ name: 'Bürogemeinschaft Nordlicht GmbH', email: 'office@nordlicht.example', phone: '+49 30 223344', street: 'Alt-Moabit 120', zip: '10559', city: 'Berlin', propertyType: 'buero', sizeSqm: 240, rooms: 10, bathrooms: 3, desks: 24, floorTypes: ['teppich', 'fliesen'], cleaningType: 'unterhalt', frequency: 'woechentlich', timesPerPeriod: 2, timeWindow: 'frueh', notes: 'Zugang ab 07:30 über Hinterhof.' }) },
  { id: 'a9', code: 'CL-24853', createdAt: t, date: addDays(t, 7), time: '10:00', durationH: 2, status: 'bestaetigt', price: 95, estimate: [85, 105], team: 'Team Süd', source: 'web',
    customer: mk({ name: 'Elias Schulz', email: 'elias.schulz@example.de', phone: '+49 30 556677', street: 'Karl-Marx-Straße 14', zip: '12043', city: 'Berlin', sizeSqm: 64, rooms: 2, cleaningType: 'glas' }) },
  { id: 'a10', code: 'CL-24855', createdAt: addDays(t, -20), date: addDays(t, -15), time: '16:00', durationH: 3, status: 'storniert', price: 119, estimate: [110, 130], source: 'telefon',
    customer: mk({ name: 'Laura Koch', email: 'laura.koch@example.de', phone: '+49 30 112233', street: 'Bölschestraße 9', zip: '12587', city: 'Berlin', sizeSqm: 75, rooms: 3 }) },
]

export const revenueByMonth = [
  { m: 'Apr', umsatz: 6800, auftraege: 41 }, { m: 'Mai', umsatz: 7900, auftraege: 47 }, { m: 'Jun', umsatz: 9100, auftraege: 55 },
  { m: 'Jul', umsatz: 8600, auftraege: 52 }, { m: 'Aug', umsatz: 10400, auftraege: 63 }, { m: 'Sep', umsatz: 11250, auftraege: 68 },
]
export const serviceMix = [
  { name: 'Unterhalt', value: 46 }, { name: 'Grund', value: 22 }, { name: 'Büro', value: 17 }, { name: 'Umzug', value: 9 }, { name: 'Fenster', value: 6 },
]
export const team = [
  { name: 'Team Süd', lead: 'Katrin Lehmann', members: 3, city: 'Lichtenrade / Tempelhof / Steglitz', rating: 4.9 },
  { name: 'Team Mitte', lead: 'Mehmet Yilmaz', members: 4, city: 'Mitte / Kreuzberg / Prenzlauer Berg', rating: 4.8 },
  { name: 'Team West', lead: 'Julia Brandt', members: 3, city: 'Charlottenburg / Spandau', rating: 4.9 },
]

/** Service area – Berlin only. */
export const cities = ['Berlin']
export const districts = ['Lichtenrade', 'Tempelhof', 'Schöneberg', 'Steglitz', 'Zehlendorf', 'Neukölln', 'Kreuzberg', 'Mitte', 'Charlottenburg', 'Wilmersdorf', 'Prenzlauer Berg', 'Friedrichshain', 'Pankow', 'Spandau', 'Reinickendorf', 'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg']

/** Very small PLZ → Stadt lookup for the demo (prefix based). */
export function cityFromZip(zip: string): string | null {
  if (!/^\d{5}$/.test(zip)) return null
  const n = +zip
  return n >= 10115 && n <= 14199 ? 'Berlin' : null
}
