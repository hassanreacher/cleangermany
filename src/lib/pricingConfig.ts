/**
 * Pricing configuration – transcribed from Cleaning_Pricing_Web_Package/pricing-config.json (v1.0.0).
 * All prices are NET (EUR) – VAT 19 % is added on top. Edit values here; the engine in pricing.ts reads them.
 */
export const pricingConfig = {
  version: '1.0.0',
  currency: 'EUR',
  pricesAreNet: true,
  vatRate: 0.19,
  weeksPerMonth: 4.33,
  /** Discount on the first month for new recurring contracts */
  firstMonthDiscount: 0.25,
  /** Below this effective net price per productive hour the quote must be checked manually */
  safetyFloorPerProductiveHour: 24.5,
  estimateRange: { low: 0.95, high: 1.1, roundTo: 5 },
  /** Recurring maintenance cleaning: productivity (m²/h), sales rate (€/h net), minimum per visit (€ net) */
  services: {
    office: { label: 'Büroreinigung', productivityM2PerHour: 300, salesRatePerHour: 30, minimumPerVisit: 39 },
    praxis: { label: 'Praxisreinigung', productivityM2PerHour: 240, salesRatePerHour: 31.5, minimumPerVisit: 45 },
    kita: { label: 'Kitareinigung', productivityM2PerHour: 220, salesRatePerHour: 31, minimumPerVisit: 45 },
    school: { label: 'Schulreinigung', productivityM2PerHour: 280, salesRatePerHour: 30, minimumPerVisit: 55 },
    retail: { label: 'Gewerbe / Laden', productivityM2PerHour: 290, salesRatePerHour: 30, minimumPerVisit: 39 },
    /** site addition (not in the package): private households, calculated like a heavily furnished office */
    home: { label: 'Haushaltsreinigung', productivityM2PerHour: 200, salesRatePerHour: 30, minimumPerVisit: 39 },
  },
  /** key = cleanings per week */
  frequencies: {
    '0.25': { label: '1× monatlich', factorPerVisit: 1.15, monthlyVisits: 1.083 },
    '0.5': { label: 'alle 2 Wochen', factorPerVisit: 1.1, monthlyVisits: 2.165 },
    '1': { label: '1× wöchentlich', factorPerVisit: 1, monthlyVisits: 4.33 },
    '2': { label: '2× wöchentlich', factorPerVisit: 0.95, monthlyVisits: 8.66 },
    '3': { label: '3× wöchentlich', factorPerVisit: 0.9, monthlyVisits: 12.99 },
    '5': { label: '5× wöchentlich', factorPerVisit: 0.84, monthlyVisits: 21.65 },
    '7': { label: 'täglich', factorPerVisit: 0.82, monthlyVisits: 30.31 },
  },
  factors: {
    floor: { tile_pvc: { label: 'Fliesen / PVC', factor: 1 }, laminate: { label: 'Laminat', factor: 1.05 }, carpet: { label: 'Teppich', factor: 1.08 }, mixed: { label: 'Gemischt', factor: 1.08 }, stone: { label: 'Stein', factor: 1.12 } },
    dirt: { light: { label: 'Leicht', factor: 0.9 }, normal: { label: 'Normal', factor: 1 }, medium: { label: 'Mittel', factor: 1.2 }, heavy: { label: 'Stark', factor: 1.45 } },
    workTime: { day: { label: 'Tagsüber', factor: 1 }, evening: { label: 'Abends', factor: 1.05 }, night: { label: 'Nachts', factor: 1.18 }, weekend: { label: 'Wochenende', factor: 1.25 } },
    access: { easy: { label: 'Einfach', factor: 1 }, standard: { label: 'Standard', factor: 1.05 }, difficult: { label: 'Schwierig', factor: 1.18 } },
  },
  minutesPerUnit: { desk: 0.75, wc: 6.5, washbasin: 2.5, shower: 5, wasteBin: 0.5, dishwasherExterior: 1.5, refrigeratorExterior: 1.5 },
  kitchenMinutes: { none: { label: 'Keine', minutes: 0 }, small: { label: 'Klein', minutes: 8 }, medium: { label: 'Mittel', minutes: 12 }, large: { label: 'Groß', minutes: 18 } },
  /** Monthly add-ons (net); unit decides how the quantity is derived */
  addOns: {
    fridge_inside: { label: 'Kühlschrank innen', rate: 22, unit: 'execution' },
    dishwasher_inside: { label: 'Geschirrspüler innen', rate: 14, unit: 'execution' },
    oven_inside: { label: 'Backofen innen', rate: 28, unit: 'execution' },
    microwave_inside: { label: 'Mikrowelle innen', rate: 10, unit: 'execution' },
    cabinet_inside: { label: 'Schränke innen', rate: 5, unit: 'door_or_unit' },
    deep_wc: { label: 'WC-Tiefenreinigung', rate: 12, unit: 'wc' },
    disinfection: { label: 'Desinfektion', rate: 0.15, unit: 'm2' },
    carpet_extraction: { label: 'Teppich-Sprühextraktion', rate: 4.5, unit: 'm2' },
    office_chair_upholstery: { label: 'Bürostuhl-Polsterreinigung', rate: 12, unit: 'chair' },
    sofa_upholstery: { label: 'Sofa-Polsterreinigung', rate: 18, unit: 'seat' },
    high_pressure_clean: { label: 'Hochdruckreinigung', rate: 2.5, unit: 'm2' },
  },
  /** Stairwell cleaning (per visit, net) */
  stairs: { entranceBase: 15, floorPerEntrance: 4.5, elevator: 5, basement: 8, corridorM2: 0.12, window: 2.5, minimumPerVisit: 25 },
  /** One-off / special services (net) */
  specialServices: {
    glass_inside: { label: 'Glasreinigung innen', rate: 2.2, minimum: 69, unit: 'glass_m2' },
    glass_both_sides: { label: 'Glasreinigung beidseitig', rate: 3.6, minimum: 69, unit: 'glass_m2' },
    frames: { label: 'Rahmenreinigung', rate: 1.4, minimum: 0, unit: 'frame_m2' },
    grundreinigung: { label: 'Grundreinigung', rate: 3.2, minimum: 180, unit: 'm2' },
    intensive: { label: 'Intensivreinigung', rate: 2.4, minimum: 150, unit: 'm2' },
    construction_final: { label: 'Bauendreinigung', rate: 4, minimum: 250, unit: 'm2' },
    construction_rough: { label: 'Baugrobreinigung', rate: 2.5, minimum: 220, unit: 'm2' },
    garden_hour: { label: 'Gartenarbeit (Stunde)', rate: 34, minimum: 85, unit: 'hour' },
    lawn_mowing: { label: 'Rasenmähen', rate: 0.12, minimum: 85, unit: 'm2' },
    hedge_trimming: { label: 'Heckenschnitt', rate: 4, minimum: 85, unit: 'linear_m' },
    leaf_removal: { label: 'Laubentfernung', rate: 0.18, minimum: 85, unit: 'm2' },
    weed_removal: { label: 'Unkrautentfernung', rate: 0.8, minimum: 85, unit: 'm2' },
    outdoor_pressure: { label: 'Außenreinigung mit Hochdruck', rate: 2.5, minimum: 120, unit: 'm2' },
    solar_pv: { label: 'Solar-/PV-Reinigung', rate: 2.5, minimum: 150, unit: 'm2' },
    facade_low_access: { label: 'Fassadenreinigung (niedrig)', rate: 4, minimum: 250, unit: 'm2' },
    garage_machine: { label: 'Garagenreinigung (Maschine)', rate: 1, minimum: 250, unit: 'm2' },
  },
  inputLimits: { areaM2: { min: 20, max: 5000 }, count: { min: 0, max: 1000 }, travelSurcharge: { min: 0, max: 500 } },
  customerMessage: 'Geschätzter Preis. Der endgültige Festpreis wird nach einer kostenlosen Objektbesichtigung festgelegt.',
} as const

export type ServiceKey = keyof typeof pricingConfig.services
export type AddOnKey = keyof typeof pricingConfig.addOns
export type SpecialKey = keyof typeof pricingConfig.specialServices
