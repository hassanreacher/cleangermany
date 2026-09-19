/**
 * Central business configuration – edit here, used everywhere (footer, map, WhatsApp, AI prompt, Impressum).
 */
export const business = {
  brand: 'Glanzgeschwister',
  claim: 'Präzise. Sicher. Zuverlässig.',
  company: 'Glanzgeschwister',
  owner: 'Julia Bethke',
  ownerTitle: 'Inhaberin',
  street: 'Nuthestr. 49 c',
  zip: '12307',
  city: 'Berlin',
  district: 'Berlin-Lichtenrade',
  phoneDisplay: '+49 176 20465997',
  phoneTel: '+4917620465997',
  /** WhatsApp number in international format without "+" or spaces */
  whatsapp: '4917620465997',
  email: 'Glanzgeschwister@gmx.de',
  hours: 'Mo–Sa 08–18 Uhr',
  /** Service area: Berlin only (PLZ 10115–14199) */
  serviceArea: { name: 'Berlin', zipMin: 10115, zipMax: 14199 },
  /** Discount when the customer sends the request AND contacts the owner directly (call / WhatsApp) */
  directDiscount: 25,
  mapsQuery: 'Nuthestraße 49c, 12307 Berlin',
  /** Feature flags */
  features: { accounts: true },
}

export function inServiceArea(zip: string) {
  if (!/^\d{5}$/.test(zip)) return null
  const n = +zip
  return n >= business.serviceArea.zipMin && n <= business.serviceArea.zipMax
}

export const fullAddress = `${business.street}, ${business.zip} ${business.city}`
export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(business.mapsQuery)}&z=15&output=embed`
export const mapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.mapsQuery)}`

export function whatsappUrl(text?: string) {
  const base = `https://wa.me/${business.whatsapp}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
