// ─── Club, voedingsdagboek: Open Food Facts (PUUR) ──────────────────────────
// Geporteerd uit MentaForce (api/voeding/zoek en barcode). Open Food Facts is
// gratis en heeft geen sleutel nodig (open database, ODbL). We vragen het via
// onze eigen server op, zodat de telefoon van het lid niet zelf met een derde
// praat (AVG). Open Food Facts vraagt om een eigen User-Agent per app.
// Alleen kcal en macro's per 100 gram; geen productfoto's (die zouden het
// IP-adres van het lid bij een derde laten zien).

import type { Product } from './model'

export const OFF_BASIS = 'https://world.openfoodfacts.org'
export const OFF_USER_AGENT = 'AIYourGym/1.0 (https://aiyourgym.com)'
export const OFF_VELDEN = 'code,product_name,product_name_nl,product_name_en,brands,quantity,serving_quantity,nutriments'
export const MAX_RESULTATEN = 20

const BARCODE = /^[0-9]{6,14}$/

export function isBarcode(v: unknown): v is string {
  return typeof v === 'string' && BARCODE.test(v)
}

/** Een zoekterm: 2 tot 80 tekens, zonder stuurtekens. null = ongeldig. */
export function schoneZoekterm(v: unknown): string | null {
  if (typeof v !== 'string') return null
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return t.length >= 2 ? t : null
}

export function zoekUrl(term: string, taal: 'nl' | 'en'): string {
  const vraag = new URLSearchParams({ search_terms: term, json: '1', fields: OFF_VELDEN, page_size: String(MAX_RESULTATEN), lc: taal, search_simple: '1', action: 'process' })
  return `${OFF_BASIS}/cgi/search.pl?${vraag}`
}

export function barcodeUrl(code: string): string {
  return `${OFF_BASIS}/api/v2/product/${code}.json?fields=${OFF_VELDEN}`
}

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null
}

const een = (n: number): number => Math.round(n * 10) / 10

/** Voedingswaarden per 100 gram uit `nutriments`, of null als er geen kcal is. */
export function per100UitOff(nutriments: unknown): Product['per100'] | null {
  const n = obj(nutriments)
  if (!n) return null
  // Energie in kcal; anders uit kJ (1 kcal = 4,184 kJ).
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy-kj_100g']) !== null ? (num(n['energy-kj_100g']) as number) / 4.184 : null)
  if (kcal === null || kcal > 1000) return null
  const g = (sleutel: string): number => Math.min(100, num(n[sleutel]) ?? 0)
  const vezels = num(n['fiber_100g'])
  return { kcal: Math.round(kcal), eiwitG: een(g('proteins_100g')), koolhydratenG: een(g('carbohydrates_100g')), vetG: een(g('fat_100g')), vezelsG: vezels === null ? null : een(Math.min(100, vezels)) }
}

/** Een product uit Open Food Facts, of null als het onbruikbaar is (geen naam, geen barcode of geen kcal). */
export function productUitOff(ruw: unknown, taal: 'nl' | 'en' = 'nl'): Product | null {
  const p = obj(ruw)
  if (!p) return null
  const code = typeof p.code === 'string' ? p.code.trim() : ''
  if (!isBarcode(code)) return null
  const voorkeur = taal === 'en' ? [p.product_name_en, p.product_name, p.product_name_nl] : [p.product_name_nl, p.product_name, p.product_name_en]
  const naam = voorkeur.find((x): x is string => typeof x === 'string' && x.trim() !== '')?.trim().slice(0, 120)
  if (!naam) return null
  const per100 = per100UitOff(p.nutriments)
  if (!per100) return null
  const merk = typeof p.brands === 'string' && p.brands.trim() ? p.brands.split(',')[0].trim().slice(0, 80) : null
  const portie = num(p.serving_quantity)
  return {
    sleutel: `off:${code}`,
    naam,
    merk,
    per100,
    portieGram: portie !== null && portie > 0 && portie <= 2000 ? Math.round(portie) : null,
    hoeveelheid: typeof p.quantity === 'string' && p.quantity.trim() ? p.quantity.trim().slice(0, 40) : null,
  }
}

/** Het antwoord van de zoekvraag naar producten (kapotte en dubbele weg). */
export function productenUitZoek(ruw: unknown, taal: 'nl' | 'en' = 'nl'): Product[] {
  const r = obj(ruw)
  const lijst = r && Array.isArray(r.products) ? r.products : []
  const gezien = new Set<string>()
  const uit: Product[] = []
  for (const item of lijst) {
    const p = productUitOff(item, taal)
    if (!p || !p.sleutel || gezien.has(p.sleutel)) continue
    gezien.add(p.sleutel)
    uit.push(p)
    if (uit.length >= MAX_RESULTATEN) break
  }
  return uit
}

/** Het antwoord van de barcodevraag (v2: status 1 en product). */
export function productUitBarcode(ruw: unknown, taal: 'nl' | 'en' = 'nl'): Product | null {
  const r = obj(ruw)
  if (!r || r.status !== 1) return null
  return productUitOff(r.product, taal)
}
