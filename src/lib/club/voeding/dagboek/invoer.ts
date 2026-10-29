// ─── Club, voedingsdagboek: invoer controleren (PUUR) ───────────────────────
// Systeemgrens: alles wat de ledenapp stuurt. Grenzen gelijk aan de checks in
// migratie 466. Met waarden per 100 gram rekent de server de macro's zelf uit
// (schaalNaarPortie), zodat getal en portie altijd bij elkaar passen.

import { schaalNaarPortie } from './berekeningen'
import { isMaatId } from './huishoudmaten'
import { isBarcode } from './off'
import { isBron, isDatum, isMaaltijd, isProductSleutel, type Bron, type Macros, type Maaltijd, type Per100 } from './model'

export type Gelezen<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const MAX_NAAM = 120
export const MAX_MERK = 80
export const MAX_GRAM = 5000

export interface LogInvoer extends Macros {
  datum: string
  maaltijd: Maaltijd
  naam: string
  merk: string | null
  gram: number | null
  maat: string | null
  aantal: number | null
  vezelsG: number | null
  bron: Bron
  productSleutel: string | null
  per100: Per100 | null
}

export interface ProductInvoer {
  naam: string
  merk: string | null
  barcode: string | null
  per100: Per100
  portieGram: number | null
}

export interface FavorietInvoer {
  productSleutel: string
  naam: string
  merk: string | null
  per100: Per100
  portieGram: number | null
}

export type InstellingInvoer =
  | { soort: 'start'; trainerZien: boolean }
  | { soort: 'trainer'; trainerZien: boolean }
  | { soort: 'doelen'; doelen: Macros | null }
  /** Toestemming voor de AI-schatting geven (aan) of intrekken (uit). */
  | { soort: 'ai'; aan: boolean }

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function getal(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function binnen(v: unknown, min: number, max: number): number | null {
  const n = getal(v)
  return n !== null && n >= min && n <= max ? n : null
}

function tekst(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length > 0 ? t.slice(0, max) : null
}

const een = (n: number): number => Math.round(n * 10) / 10

/** Waarden per 100 gram met de grenzen van de database. */
export function leesPer100(v: unknown): Per100 | null {
  const r = obj(v)
  if (!r) return null
  const kcal = binnen(r.kcal, 0, 1000)
  const eiwit = binnen(r.eiwitG ?? 0, 0, 100)
  const kh = binnen(r.koolhydratenG ?? 0, 0, 100)
  const vet = binnen(r.vetG ?? 0, 0, 100)
  if (kcal === null || eiwit === null || kh === null || vet === null) return null
  const vezels = r.vezelsG === null || r.vezelsG === undefined || r.vezelsG === '' ? null : binnen(r.vezelsG, 0, 100)
  return { kcal: een(kcal), eiwitG: een(eiwit), koolhydratenG: een(kh), vetG: een(vet), vezelsG: vezels === null ? null : een(vezels) }
}

/** Een regel voor het dagboek. */
export function leesLog(body: unknown): Gelezen<LogInvoer> {
  const r = obj(body)
  if (!r) return { ok: false, fout: 'Ongeldige invoer.' }
  if (!isDatum(r.datum)) return { ok: false, fout: 'Kies een geldige dag.' }
  if (!isMaaltijd(r.maaltijd)) return { ok: false, fout: 'Kies een maaltijd.' }
  const naam = tekst(r.naam, MAX_NAAM)
  if (!naam) return { ok: false, fout: 'Vul in wat je at.' }
  const bron: Bron = isBron(r.bron) ? r.bron : 'handmatig'
  const gram = r.gram === null || r.gram === undefined || r.gram === '' ? null : binnen(r.gram, 0.1, MAX_GRAM)
  if (r.gram !== null && r.gram !== undefined && r.gram !== '' && gram === null) return { ok: false, fout: `Vul een portie in van 1 tot ${MAX_GRAM} gram.` }
  const maat = isMaatId(r.maat) ? r.maat : null
  const aantal = maat ? binnen(r.aantal ?? 1, 0.25, 100) : null
  const per100 = r.per100 === undefined || r.per100 === null ? null : leesPer100(r.per100)
  if (r.per100 !== undefined && r.per100 !== null && !per100) return { ok: false, fout: 'De voedingswaarden kloppen niet.' }
  const productSleutel = isProductSleutel(r.productSleutel) ? r.productSleutel : null

  let macros: Macros & { vezelsG: number | null }
  if (per100) {
    if (gram === null) return { ok: false, fout: 'Vul in hoeveel gram je at.' }
    macros = schaalNaarPortie(per100, gram)
  } else {
    const kcal = binnen(r.kcal, 0, 10000)
    const eiwit = binnen(r.eiwitG ?? 0, 0, 1000)
    const kh = binnen(r.koolhydratenG ?? 0, 0, 2000)
    const vet = binnen(r.vetG ?? 0, 0, 1000)
    if (kcal === null || eiwit === null || kh === null || vet === null) return { ok: false, fout: 'Vul kcal en macro\'s in met geldige getallen.' }
    const vezels = r.vezelsG === null || r.vezelsG === undefined || r.vezelsG === '' ? null : binnen(r.vezelsG, 0, 500)
    macros = { kcal: Math.round(kcal), eiwitG: een(eiwit), koolhydratenG: een(kh), vetG: een(vet), vezelsG: vezels === null ? null : een(vezels) }
  }
  return {
    ok: true,
    waarde: { datum: r.datum, maaltijd: r.maaltijd, naam, merk: tekst(r.merk, MAX_MERK), gram: gram === null ? null : een(gram), maat, aantal, bron, productSleutel, per100, ...macros },
  }
}

/** Een eigen product van het lid. */
export function leesProduct(body: unknown): Gelezen<ProductInvoer> {
  const r = obj(body)
  if (!r) return { ok: false, fout: 'Ongeldige invoer.' }
  const naam = tekst(r.naam, MAX_NAAM)
  if (!naam) return { ok: false, fout: 'Geef het product een naam.' }
  const per100 = leesPer100(r.per100)
  if (!per100) return { ok: false, fout: 'Vul de voedingswaarden per 100 gram in.' }
  const barcode = r.barcode === null || r.barcode === undefined || r.barcode === '' ? null : isBarcode(r.barcode) ? r.barcode : undefined
  if (barcode === undefined) return { ok: false, fout: 'Een barcode bestaat uit 6 tot 14 cijfers.' }
  const portie = r.portieGram === null || r.portieGram === undefined || r.portieGram === '' ? null : binnen(r.portieGram, 1, MAX_GRAM)
  return { ok: true, waarde: { naam, merk: tekst(r.merk, MAX_MERK), barcode, per100, portieGram: portie === null ? null : een(portie) } }
}

/** Een favoriet: een product met een vaste sleutel. */
export function leesFavoriet(body: unknown): Gelezen<FavorietInvoer> {
  const r = obj(body)
  if (!r || !isProductSleutel(r.productSleutel)) return { ok: false, fout: 'Dit product kan geen favoriet worden.' }
  const naam = tekst(r.naam, MAX_NAAM)
  const per100 = leesPer100(r.per100)
  if (!naam || !per100) return { ok: false, fout: 'Ongeldige invoer.' }
  const portie = r.portieGram === null || r.portieGram === undefined ? null : binnen(r.portieGram, 1, MAX_GRAM)
  return { ok: true, waarde: { productSleutel: r.productSleutel, naam, merk: tekst(r.merk, MAX_MERK), per100, portieGram: portie } }
}

/** Eigen doelen: kcal 800 tot 6000 en macro's in gram; null = weghalen. */
export function leesDoelen(v: unknown): Gelezen<Macros | null> {
  if (v === null) return { ok: true, waarde: null }
  const r = obj(v)
  if (!r) return { ok: false, fout: 'Ongeldige doelen.' }
  const kcal = binnen(r.kcal, 800, 6000)
  const eiwit = binnen(r.eiwitG, 0, 500)
  const kh = binnen(r.koolhydratenG, 0, 1000)
  const vet = binnen(r.vetG, 0, 400)
  if (kcal === null) return { ok: false, fout: 'Kies een dagdoel van 800 tot 6000 kcal.' }
  if (eiwit === null || kh === null || vet === null) return { ok: false, fout: 'Vul eiwit, koolhydraten en vet in gram in.' }
  return { ok: true, waarde: { kcal: Math.round(kcal), eiwitG: Math.round(eiwit), koolhydratenG: Math.round(kh), vetG: Math.round(vet) } }
}

/** Wat het lid aan de instellingen verandert. */
export function leesInstelling(body: unknown): Gelezen<InstellingInvoer> {
  const r = obj(body)
  if (!r) return { ok: false, fout: 'Ongeldige invoer.' }
  if (r.soort === 'start' || r.soort === 'trainer') {
    if (typeof r.trainerZien !== 'boolean') return { ok: false, fout: 'Ongeldige keuze.' }
    return { ok: true, waarde: { soort: r.soort, trainerZien: r.trainerZien } }
  }
  if (r.soort === 'ai') {
    if (typeof r.aan !== 'boolean') return { ok: false, fout: 'Ongeldige keuze.' }
    return { ok: true, waarde: { soort: 'ai', aan: r.aan } }
  }
  if (r.soort === 'doelen') {
    const d = leesDoelen(r.doelen ?? null)
    return d.ok ? { ok: true, waarde: { soort: 'doelen', doelen: d.waarde } } : d
  }
  return { ok: false, fout: 'Ongeldige invoer.' }
}
