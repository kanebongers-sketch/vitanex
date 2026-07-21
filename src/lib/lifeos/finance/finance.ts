// ─── LifeOS — Finance: omzet, kosten, facturen ──────────────────────────────
// DÉ bron van waarheid voor het geld-domein (Fase 2 van het AI Work OS). PUUR:
// geen fetch, geen DB, geen React. Twee dingen wonen hier:
//
//   1. De validatie op de systeemgrens (user input). Spiegelt de check-constraints
//      uit migratie 150 — maar geeft een nette NL-melding i.p.v. een kaal '23514'.
//   2. De aggregatie `bouwOverzicht`: van losse transacties + facturen naar het
//      overzicht dat de Cockpit toont. EERLIJK — een lege maand geeft echte nullen,
//      nooit een verzonnen cijfer.
//
// Zelfde opzet als `crm.ts` en `taken.ts`. Geld rekenen we in HELE CENTEN (integers)
// en pas op het eind terug naar euro: `0.1 + 0.2 !== 0.3` in floats, en je winst
// mag niet een cent verschuiven omdat JavaScript rond een bit heen rekent.

// `@/`-alias mag hier (vitest kent 'm, zie vitest.config.ts): dezelfde datum-grens
// als de agenda en de taken, zodat "een geldige dag" overal hetzelfde betekent.
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

// ─── Soort & status ─────────────────────────────────────────────────────────

export const SOORTEN = ['omzet', 'kosten'] as const
export type Soort = (typeof SOORTEN)[number]

export const FACTUUR_STATUSSEN = ['open', 'betaald', 'verlopen'] as const
export type FactuurStatus = (typeof FACTUUR_STATUSSEN)[number]

export function isSoort(v: unknown): v is Soort {
  return typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)
}

export function isFactuurStatus(v: unknown): v is FactuurStatus {
  return typeof v === 'string' && (FACTUUR_STATUSSEN as readonly string[]).includes(v)
}

// ─── De records ─────────────────────────────────────────────────────────────

export interface Transactie {
  id: string
  soort: Soort
  /** Euro, altijd > 0. Het teken zit in `soort`, niet hier (zie migratie 150). */
  bedrag: number
  omschrijving: string
  categorie: string | null
  /** Dagsleutel (YYYY-MM-DD): de dag waarop het geld liep. */
  datum: string
  persoonId: string | null
  aangemaaktOp: string
}

export interface Factuur {
  id: string
  klant: string
  bedrag: number
  status: FactuurStatus
  factuurdatum: string
  vervaldatum: string | null
  persoonId: string | null
  aangemaaktOp: string
}

// ─── Grenzen (spiegelen migratie 150) ───────────────────────────────────────

/** numeric(12,2) met de check `bedrag <= 100000000`. Ook in centen (1e10) veilig. */
export const MAX_BEDRAG = 100_000_000
export const MAX_OMSCHRIJVING = 500
export const MAX_KLANT = 200
export const MAX_CATEGORIE = 100

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAAND = /^(\d{4})-(\d{2})$/

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

// ─── Cent-rekenen ───────────────────────────────────────────────────────────

/** Euro → hele centen. `Math.round` want floats missen soms een halve cent. */
export function naarCenten(euro: number): number {
  return Math.round(euro * 100)
}

/** Centen → euro, met precies 2 decimalen (nooit 12.340000000001). */
export function naarEuro(centen: number): number {
  return Math.round(centen) / 100
}

// ─── Validatie-bouwstenen ───────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function leesTekst(v: unknown, wat: string, max: number): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: `${wat} ontbreekt.` }
  const s = v.trim()
  if (s.length === 0) return { ok: false, fout: `${wat} mag niet leeg zijn.` }
  if (s.length > max) return { ok: false, fout: `${wat} mag maximaal ${max} tekens zijn.` }
  return { ok: true, waarde: s }
}

function leesOptioneleTekst(v: unknown, wat: string, max: number): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: `${wat} moet tekst zijn.` }
  const s = v.trim()
  if (s.length === 0) return { ok: true, waarde: null }
  if (s.length > max) return { ok: false, fout: `${wat} mag maximaal ${max} tekens zijn.` }
  return { ok: true, waarde: s }
}

/** Bedrag in euro: eindig, > 0, ≤ max. Rondt op de cent — dat is wat de DB bewaart. */
function leesBedrag(v: unknown): Validatie<number> {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return { ok: false, fout: 'Bedrag moet een getal in euro zijn.' }
  }
  if (v <= 0) return { ok: false, fout: 'Bedrag moet groter dan 0 zijn.' }
  if (v > MAX_BEDRAG) return { ok: false, fout: `Bedrag mag maximaal ${MAX_BEDRAG} euro zijn.` }
  const centen = naarCenten(v)
  // Een bedrag dat op 0 cent afrondt (bv. 0.004) is een invoerfout, geen 0-transactie.
  if (centen <= 0) return { ok: false, fout: 'Bedrag moet minstens één cent zijn.' }
  return { ok: true, waarde: naarEuro(centen) }
}

/** Verplichte dagsleutel (YYYY-MM-DD). `veld` staat in de melding. */
function leesDatum(v: unknown, veld: string): Validatie<string> {
  if (typeof v !== 'string' || leesDatumSleutel(v) === null) {
    return { ok: false, fout: `${veld} moet YYYY-MM-DD zijn.` }
  }
  return { ok: true, waarde: v }
}

/** Optionele dagsleutel: leeg/afwezig → null. */
function leesOptioneleDatum(v: unknown, veld: string): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  return leesDatum(v, veld)
}

/** Optionele CRM-koppeling: null, of een uuid. De FK bewaakt of hij écht bestaat. */
function leesPersoonId(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string' || !UUID.test(v)) {
    return { ok: false, fout: 'persoonId moet een geldig id zijn.' }
  }
  return { ok: true, waarde: v }
}

// ─── Transactie: nieuw & wijziging ──────────────────────────────────────────

export interface NieuweTransactie {
  soort: Soort
  bedrag: number
  omschrijving: string
  categorie: string | null
  datum: string
  persoonId: string | null
}

export interface TransactieWijziging {
  soort?: Soort
  bedrag?: number
  omschrijving?: string
  categorie?: string | null
  datum?: string
  persoonId?: string | null
}

export function leesNieuweTransactie(body: unknown): Validatie<NieuweTransactie> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  if (!isSoort(body.soort)) return { ok: false, fout: "Soort is 'omzet' of 'kosten'." }
  const bedrag = leesBedrag(body.bedrag)
  if (!bedrag.ok) return bedrag
  const omschrijving = leesTekst(body.omschrijving, 'Omschrijving', MAX_OMSCHRIJVING)
  if (!omschrijving.ok) return omschrijving
  const categorie = leesOptioneleTekst(body.categorie, 'Categorie', MAX_CATEGORIE)
  if (!categorie.ok) return categorie
  const datum = leesDatum(body.datum, 'Datum')
  if (!datum.ok) return datum
  const persoonId = leesPersoonId(body.persoonId)
  if (!persoonId.ok) return persoonId

  return {
    ok: true,
    waarde: {
      soort: body.soort,
      bedrag: bedrag.waarde,
      omschrijving: omschrijving.waarde,
      categorie: categorie.waarde,
      datum: datum.waarde,
      persoonId: persoonId.waarde,
    },
  }
}

export function leesTransactieWijziging(body: unknown): Validatie<TransactieWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: TransactieWijziging = {}
  if ('soort' in body) {
    if (!isSoort(body.soort)) return { ok: false, fout: "Soort is 'omzet' of 'kosten'." }
    wijziging.soort = body.soort
  }
  if ('bedrag' in body) {
    const bedrag = leesBedrag(body.bedrag)
    if (!bedrag.ok) return bedrag
    wijziging.bedrag = bedrag.waarde
  }
  if ('omschrijving' in body) {
    const o = leesTekst(body.omschrijving, 'Omschrijving', MAX_OMSCHRIJVING)
    if (!o.ok) return o
    wijziging.omschrijving = o.waarde
  }
  if ('categorie' in body) {
    const c = leesOptioneleTekst(body.categorie, 'Categorie', MAX_CATEGORIE)
    if (!c.ok) return c
    wijziging.categorie = c.waarde
  }
  if ('datum' in body) {
    const d = leesDatum(body.datum, 'Datum')
    if (!d.ok) return d
    wijziging.datum = d.waarde
  }
  if ('persoonId' in body) {
    const p = leesPersoonId(body.persoonId)
    if (!p.ok) return p
    wijziging.persoonId = p.waarde
  }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }
  return { ok: true, waarde: wijziging }
}

// ─── Factuur: nieuw & wijziging ─────────────────────────────────────────────

export interface NieuweFactuur {
  klant: string
  bedrag: number
  factuurdatum: string
  vervaldatum: string | null
  persoonId: string | null
}

export interface FactuurWijziging {
  klant?: string
  bedrag?: number
  status?: FactuurStatus
  factuurdatum?: string
  vervaldatum?: string | null
  persoonId?: string | null
}

/** Een vervaldatum vóór de factuurdatum is onmogelijk (spiegelt de DB-check). */
function vervaldatumKlopt(factuurdatum: string, vervaldatum: string | null): boolean {
  return vervaldatum === null || vervaldatum >= factuurdatum
}

export function leesNieuweFactuur(body: unknown): Validatie<NieuweFactuur> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const klant = leesTekst(body.klant, 'Klant', MAX_KLANT)
  if (!klant.ok) return klant
  const bedrag = leesBedrag(body.bedrag)
  if (!bedrag.ok) return bedrag
  const factuurdatum = leesDatum(body.factuurdatum, 'Factuurdatum')
  if (!factuurdatum.ok) return factuurdatum
  const vervaldatum = leesOptioneleDatum(body.vervaldatum, 'Vervaldatum')
  if (!vervaldatum.ok) return vervaldatum
  if (!vervaldatumKlopt(factuurdatum.waarde, vervaldatum.waarde)) {
    return { ok: false, fout: 'Vervaldatum mag niet vóór de factuurdatum liggen.' }
  }
  const persoonId = leesPersoonId(body.persoonId)
  if (!persoonId.ok) return persoonId

  // Status niet uit de body: een nieuwe factuur begint altijd 'open' (DB-default).
  // Betaald/verlopen zetten gebeurt via PATCH.
  return {
    ok: true,
    waarde: {
      klant: klant.waarde,
      bedrag: bedrag.waarde,
      factuurdatum: factuurdatum.waarde,
      vervaldatum: vervaldatum.waarde,
      persoonId: persoonId.waarde,
    },
  }
}

export function leesFactuurWijziging(body: unknown): Validatie<FactuurWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: FactuurWijziging = {}
  if ('klant' in body) {
    const k = leesTekst(body.klant, 'Klant', MAX_KLANT)
    if (!k.ok) return k
    wijziging.klant = k.waarde
  }
  if ('bedrag' in body) {
    const b = leesBedrag(body.bedrag)
    if (!b.ok) return b
    wijziging.bedrag = b.waarde
  }
  if ('status' in body) {
    if (!isFactuurStatus(body.status)) {
      return { ok: false, fout: "Status is 'open', 'betaald' of 'verlopen'." }
    }
    wijziging.status = body.status
  }
  if ('factuurdatum' in body) {
    const f = leesDatum(body.factuurdatum, 'Factuurdatum')
    if (!f.ok) return f
    wijziging.factuurdatum = f.waarde
  }
  if ('vervaldatum' in body) {
    const v = leesOptioneleDatum(body.vervaldatum, 'Vervaldatum')
    if (!v.ok) return v
    wijziging.vervaldatum = v.waarde
  }
  if ('persoonId' in body) {
    const p = leesPersoonId(body.persoonId)
    if (!p.ok) return p
    wijziging.persoonId = p.waarde
  }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }
  return { ok: true, waarde: wijziging }
}

// ─── Maand-helpers ──────────────────────────────────────────────────────────

/** Is dit een maandsleutel 'YYYY-MM' met een echte maand (01-12)? */
export function isMaand(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const m = MAAND.exec(v)
  if (!m) return false
  const maand = Number(m[2])
  return maand >= 1 && maand <= 12
}

/**
 * De half-open dag-grenzen van een maand: `[start, eindExclusief)`. Voor de
 * DB-query (`datum >= start and datum < eindExclusief`) — dekt schrikkeljaren en
 * maandlengtes zonder een tabel met dagen-per-maand.
 */
export function maandGrens(maand: string): { start: string; eindExclusief: string } {
  const jaar = Number(maand.slice(0, 4))
  const m = Number(maand.slice(5, 7))
  const start = `${maand}-01`
  const volgend = m === 12 ? `${jaar + 1}-01` : `${jaar}-${String(m + 1).padStart(2, '0')}`
  return { start, eindExclusief: `${volgend}-01` }
}

/** De `aantal` maanden die eindigen op `maand`, oplopend (oudste eerst). */
function vorigeMaanden(maand: string, aantal: number): string[] {
  const basis = Number(maand.slice(0, 4)) * 12 + (Number(maand.slice(5, 7)) - 1)
  const uit: string[] = []
  for (let k = aantal - 1; k >= 0; k--) {
    const idx = basis - k
    const jaar = Math.floor(idx / 12)
    const m = (idx % 12) + 1
    uit.push(`${jaar}-${String(m).padStart(2, '0')}`)
  }
  return uit
}

// ─── Het overzicht ──────────────────────────────────────────────────────────

export interface TrendMaand {
  maand: string
  omzet: number
  kosten: number
  winst: number
}

export interface Overzicht {
  maand: string
  omzet: number
  kosten: number
  winst: number
  openstaand: number
  verlopenAantal: number
  trend: TrendMaand[]
  aantalTransacties: number
}

const TREND_MAANDEN = 6

/** Een dagsleutel valt in deze maand als de eerste 7 tekens gelijk zijn ('YYYY-MM'). */
function inMaand(datum: string, maand: string): boolean {
  return datum.slice(0, 7) === maand
}

/** Omzet/kosten/winst (euro) van één maand, gerekend in centen. */
function maandTotaal(transacties: readonly Transactie[], maand: string): TrendMaand {
  let omzetC = 0
  let kostenC = 0
  for (const t of transacties) {
    if (!inMaand(t.datum, maand)) continue
    if (t.soort === 'omzet') omzetC += naarCenten(t.bedrag)
    else kostenC += naarCenten(t.bedrag)
  }
  return { maand, omzet: naarEuro(omzetC), kosten: naarEuro(kostenC), winst: naarEuro(omzetC - kostenC) }
}

/** Openstaand: alles wat nog niet binnen is — 'open' én 'verlopen', niet 'betaald'. */
function isOpenstaand(f: Factuur): boolean {
  return f.status !== 'betaald'
}

/** Verlopen: over de vervaldatum en nog 'open' (zoals de contract-spec voorschrijft). */
function isVerlopen(f: Factuur, vandaag: string): boolean {
  return f.status === 'open' && f.vervaldatum !== null && f.vervaldatum < vandaag
}

/**
 * Het finance-overzicht (PUUR). Krijgt álle transacties en facturen mee en leidt er
 * het maand-beeld + de 6-maands-trend uit af. EERLIJK: een maand zonder transacties
 * geeft `omzet: 0, kosten: 0, winst: 0` — echte nullen, geen verzonnen cijfer.
 *
 * `vandaag` (dagsleutel) is de peildatum voor "verlopen"; dagsleutels vergelijken
 * lexicografisch gelijk aan chronologisch, dus `<` is hier een echte datumtest.
 */
export function bouwOverzicht(
  transacties: readonly Transactie[],
  facturen: readonly Factuur[],
  maand: string,
  vandaag: string,
): Overzicht {
  const deze = maandTotaal(transacties, maand)
  const trend = vorigeMaanden(maand, TREND_MAANDEN).map((m) => maandTotaal(transacties, m))
  const openstaandC = facturen
    .filter(isOpenstaand)
    .reduce((som, f) => som + naarCenten(f.bedrag), 0)

  return {
    maand,
    omzet: deze.omzet,
    kosten: deze.kosten,
    winst: deze.winst,
    openstaand: naarEuro(openstaandC),
    verlopenAantal: facturen.filter((f) => isVerlopen(f, vandaag)).length,
    trend,
    aantalTransacties: transacties.filter((t) => inMaand(t.datum, maand)).length,
  }
}
