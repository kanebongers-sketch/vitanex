// ─── Club, voedingsdagboek: het model (PUUR) ────────────────────────────────
// Geporteerd uit MentaForce (besluit Kane 29-10-2026), niet geimporteerd. Een
// lid houdt in de ledenapp per dag bij wat het eet, per maaltijd, met kcal,
// eiwit, koolhydraten en vet. Producten komen uit Open Food Facts (zoeken of
// barcode), uit de eigen producten van het lid of worden met de hand ingevuld.
// Tabellen: migratie 466 (club_voeding_*).

export const MAALTIJDEN = ['ontbijt', 'lunch', 'diner', 'tussendoor'] as const
export type Maaltijd = (typeof MAALTIJDEN)[number]

// 'spraak' bestaat niet meer (besluit Kane 29-10-2026: inspreken eruit). De check in
// migratie 466 laat de waarde nog toe; een oude rij met die bron leest als 'handmatig'.
export const BRONNEN = ['zoeken', 'barcode', 'eigen', 'handmatig', 'foto', 'schatting'] as const
export type Bron = (typeof BRONNEN)[number]

/** Voedingswaarden per 100 gram. */
export interface Per100 {
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
  vezelsG: number | null
}

/** Een product om te loggen: uit Open Food Facts, een eigen product of een favoriet. */
export interface Product {
  /** "off:<barcode>" of "eigen:<uuid>"; null bij een product zonder vaste herkomst. */
  sleutel: string | null
  naam: string
  merk: string | null
  per100: Per100
  /** Een gangbare portie in gram, als die bekend is. */
  portieGram: number | null
  /** De verpakking zoals Open Food Facts hem noemt ("500 g"), alleen om te tonen. */
  hoeveelheid: string | null
}

export interface Macros {
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
}

export interface DagboekRegel extends Macros {
  id: string
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
  aangemaaktOp: string
}

export interface EigenProduct {
  id: string
  naam: string
  merk: string | null
  barcode: string | null
  per100: Per100
  portieGram: number | null
}

export interface Favoriet {
  id: string
  product: Product
}

/** De keuzes van het lid. gestartOp null = het dagboek is nog niet gestart. */
export interface DagboekInstellingen {
  gestartOp: string | null
  trainerZien: boolean
  trainerZienOp: string | null
  /** Eigen doelen; alleen gebruikt zonder voedingsplan van de coach. */
  eigenDoelen: Macros | null
  /** Wanneer het lid toestemming gaf voor de AI-schatting (foto naar Anthropic); null = niet (of ingetrokken). */
  aiToestemmingOp: string | null
}

export const GEEN_INSTELLINGEN: DagboekInstellingen = { gestartOp: null, trainerZien: false, trainerZienOp: null, eigenDoelen: null, aiToestemmingOp: null }

export const LOG_KOLOMMEN = 'id, datum, maaltijd, naam, merk, gram, maat, aantal, kcal, eiwit_g, koolhydraten_g, vet_g, vezels_g, bron, product_sleutel, per_100g, aangemaakt_op'
export const PRODUCT_KOLOMMEN = 'id, naam, merk, barcode, kcal_100g, eiwit_100g, koolhydraten_100g, vet_100g, vezels_100g, portie_gram'
export const FAVORIET_KOLOMMEN = 'id, product_sleutel, naam, merk, per_100g, portie_gram'
export const INSTELLING_KOLOMMEN = 'gestart_op, trainer_zien, trainer_zien_op, kcal, eiwit_g, koolhydraten_g, vet_g, ai_toestemming_op'

const DATUM = /^\d{4}-\d{2}-\d{2}$/
const SLEUTEL = /^(off:[0-9]{6,14}|eigen:[0-9a-f-]{36})$/i

export function isMaaltijd(v: unknown): v is Maaltijd {
  return typeof v === 'string' && (MAALTIJDEN as readonly string[]).includes(v)
}

export function isBron(v: unknown): v is Bron {
  return typeof v === 'string' && (BRONNEN as readonly string[]).includes(v)
}

export function isDatum(v: unknown): v is string {
  if (typeof v !== 'string' || !DATUM.test(v)) return false
  const d = new Date(`${v}T12:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

export function isProductSleutel(v: unknown): v is string {
  return typeof v === 'string' && SLEUTEL.test(v)
}

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function getal(v: unknown): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

/** Per 100 gram uit de database (jsonb) of uit JSON, of null. */
export function per100Uit(v: unknown): Per100 | null {
  const r = obj(v)
  if (!r) return null
  const kcal = getal(r.kcal)
  if (kcal === null || kcal < 0) return null
  const plus = (x: unknown) => Math.max(0, getal(x) ?? 0)
  const vezels = getal(r.vezelsG)
  return { kcal, eiwitG: plus(r.eiwitG), koolhydratenG: plus(r.koolhydratenG), vetG: plus(r.vetG), vezelsG: vezels !== null && vezels >= 0 ? vezels : null }
}

/** Systeemgrens: een rij uit club_voeding_logs, of null. */
export function regelUitRij(rij: unknown): DagboekRegel | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || !isDatum(r.datum) || !isMaaltijd(r.maaltijd) || typeof r.naam !== 'string') return null
  const kcal = getal(r.kcal)
  if (kcal === null) return null
  return {
    id: r.id,
    datum: r.datum,
    maaltijd: r.maaltijd,
    naam: r.naam,
    merk: tekstOfNull(r.merk),
    gram: getal(r.gram),
    maat: tekstOfNull(r.maat),
    aantal: getal(r.aantal),
    kcal,
    eiwitG: getal(r.eiwit_g) ?? 0,
    koolhydratenG: getal(r.koolhydraten_g) ?? 0,
    vetG: getal(r.vet_g) ?? 0,
    vezelsG: getal(r.vezels_g),
    bron: isBron(r.bron) ? r.bron : 'handmatig',
    productSleutel: isProductSleutel(r.product_sleutel) ? r.product_sleutel : null,
    per100: per100Uit(r.per_100g),
    aangemaaktOp: typeof r.aangemaakt_op === 'string' ? r.aangemaakt_op : '',
  }
}

export function eigenProductUitRij(rij: unknown): EigenProduct | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string') return null
  const per100 = per100Uit({ kcal: r.kcal_100g, eiwitG: r.eiwit_100g, koolhydratenG: r.koolhydraten_100g, vetG: r.vet_100g, vezelsG: r.vezels_100g })
  if (!per100) return null
  return { id: r.id, naam: r.naam, merk: tekstOfNull(r.merk), barcode: tekstOfNull(r.barcode), per100, portieGram: getal(r.portie_gram) }
}

export function favorietUitRij(rij: unknown): Favoriet | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || !isProductSleutel(r.product_sleutel) || typeof r.naam !== 'string') return null
  const per100 = per100Uit(r.per_100g)
  if (!per100) return null
  return { id: r.id, product: { sleutel: r.product_sleutel, naam: r.naam, merk: tekstOfNull(r.merk), per100, portieGram: getal(r.portie_gram), hoeveelheid: null } }
}

export function instellingenUitRij(rij: unknown): DagboekInstellingen {
  const r = obj(rij)
  if (!r) return GEEN_INSTELLINGEN
  const kcal = getal(r.kcal)
  const eigenDoelen = kcal !== null ? { kcal, eiwitG: getal(r.eiwit_g) ?? 0, koolhydratenG: getal(r.koolhydraten_g) ?? 0, vetG: getal(r.vet_g) ?? 0 } : null
  return {
    gestartOp: tekstOfNull(r.gestart_op),
    trainerZien: r.trainer_zien === true,
    trainerZienOp: tekstOfNull(r.trainer_zien_op),
    eigenDoelen,
    aiToestemmingOp: tekstOfNull(r.ai_toestemming_op),
  }
}

/** Een eigen product als product om te loggen. */
export function productVanEigen(p: EigenProduct): Product {
  return { sleutel: `eigen:${p.id}`, naam: p.naam, merk: p.merk, per100: p.per100, portieGram: p.portieGram, hoeveelheid: null }
}

/** Per 100 gram naar de jsonb van de database. */
export function per100NaarJson(p: Per100): Record<string, number | null> {
  return { kcal: p.kcal, eiwitG: p.eiwitG, koolhydratenG: p.koolhydratenG, vetG: p.vetG, vezelsG: p.vezelsG }
}
