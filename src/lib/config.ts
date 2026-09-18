/**
 * Central business configuration – edit here, used everywhere (footer, map, WhatsApp, AI prompt, Impressum).
 * TODO: replace the phone / WhatsApp number with the real one (WhatsApp: international format, digits only).
 */
export const business = {
  brand: 'CLEAN – Let it shine',
  company: 'Glanzgeschwister',
  owner: 'Julia Bethke',
  ownerTitle: 'Inhaberin',
  street: 'Nuthestr. 49 c',
  zip: '12307',
  city: 'Berlin',
  district: 'Berlin-Lichtenrade',
  phoneDisplay: '0800 123 45 67',
  phoneTel: '+498001234567',
  /** WhatsApp number in international format without "+" or spaces, e.g. 4917612345678 */
  whatsapp: '4917612345678',
  email: 'hallo@clean-shine.de',
  hours: 'Mo–Sa 08–18 Uhr',
  /** Approximate price per m² and cleaning (EUR) */
  pricePerSqm: [1.3, 1.45] as [number, number],
  /** Discount when the customer sends the request AND contacts the owner directly (call / WhatsApp) */
  directDiscount: [10, 20] as [number, number],
  mapsQuery: 'Nuthestraße 49c, 12307 Berlin',
}

export const fullAddress = `${business.street}, ${business.zip} ${business.city}`
export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(business.mapsQuery)}&z=15&output=embed`
export const mapsRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.mapsQuery)}`

export function whatsappUrl(text?: string) {
  const base = `https://wa.me/${business.whatsapp}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
