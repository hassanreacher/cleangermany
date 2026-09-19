/** Service area – Berlin only. */
export const cities = ['Berlin']
export const districts = ['Lichtenrade', 'Tempelhof', 'Schöneberg', 'Steglitz', 'Zehlendorf', 'Neukölln', 'Kreuzberg', 'Mitte', 'Charlottenburg', 'Wilmersdorf', 'Prenzlauer Berg', 'Friedrichshain', 'Pankow', 'Spandau', 'Reinickendorf', 'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg']

export function cityFromZip(zip: string): string | null {
  if (!/^\d{5}$/.test(zip)) return null
  const n = +zip
  return n >= 10115 && n <= 14199 ? 'Berlin' : null
}
