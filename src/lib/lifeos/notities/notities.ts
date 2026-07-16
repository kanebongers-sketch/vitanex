// ─── LifeOS — notities: brain dump & journal ────────────────────────────────
// Vervangt Apple Notes / Google Keep (brain dump) en je journal-app (journal).
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in de database (migratie 050). Dat is geen duplicatie
// maar diepteverdediging met verschillende doelen: de database garandeert dat
// er nooit twee journals op één dag staan, deze laag geeft je een nette
// Nederlandse foutmelding in plaats van "23505".
//
// Eén type voor beide soorten — zie de onderbouwing bovenin migratie 050.

import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

export const MAX_TEKST_LENGTE = 10_000

/**
 * Wat voor tekst dit is.
 *
 *   brain_dump — één tik, idee uit je hoofd. Onbeperkt veel per dag.
 *   journal    — de reflectie van die dag. Maximaal één per dag (DB-index).
 */
export type Soort = 'brain_dump' | 'journal'

export const SOORTEN: readonly Soort[] = Object.freeze(['brain_dump', 'journal'])

/** Een notitie, zoals hij uit de database komt én over de draad gaat. */
export interface Notitie {
  id: string
  tekst: string
  soort: Soort
  /** Dagsleutel (YYYY-MM-DD). Nooit null: een idee zonder dag ben je kwijt. */
  datum: string
  aangemaaktOp: string
  bijgewerktOp: string
}

export interface NieuweNotitie {
  tekst: string
  soort: Soort
  datum: string
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

// LET OP — `Validatie<T>` staat ook in `lib/taken/taken.ts`. Dat is bewust geen
// gedeelde import: het is een type-alias van één regel, en die over een
// feature-grens heen delen koppelt taken aan notities zonder dat ze iets met
// elkaar te maken hebben. Hoort op termijn in een neutrale `lib/api/`, samen met
// `haalJson` en `datum.ts` — dan één keer, voor iedereen.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isSoort(v: unknown): v is Soort {
  return v === 'brain_dump' || v === 'journal'
}

/**
 * Leest de tekst van een notitie.
 *
 * Trimt, want ' ' is leeg — en een lege notitie is geen notitie. De database
 * denkt er hetzelfde over (check-constraint op `length(btrim(tekst))`).
 */
export function leesTekst(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Tekst ontbreekt.' }
  const tekst = v.trim()
  if (tekst.length === 0) return { ok: false, fout: 'Een lege notitie is geen notitie.' }
  if (tekst.length > MAX_TEKST_LENGTE) {
    return { ok: false, fout: `Tekst mag maximaal ${MAX_TEKST_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: tekst }
}

/** Dagsleutel uit een request. Faalt op onzin i.p.v. een Invalid Date door te geven. */
export function leesDatum(v: unknown): Validatie<string> {
  if (typeof v !== 'string' || leesDatumSleutel(v) === null) {
    return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  }
  return { ok: true, waarde: v }
}

function leesSoort(v: unknown): Validatie<Soort> {
  if (!isSoort(v)) return { ok: false, fout: 'Soort is "brain_dump" of "journal".' }
  return { ok: true, waarde: v }
}

/** Nieuwe notitie uit een request-body. Faalt met een leesbare melding. */
export function leesNieuweNotitie(body: unknown): Validatie<NieuweNotitie> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const tekst = leesTekst(body.tekst)
  if (!tekst.ok) return tekst
  const soort = leesSoort(body.soort)
  if (!soort.ok) return soort
  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum

  return { ok: true, waarde: { tekst: tekst.waarde, soort: soort.waarde, datum: datum.waarde } }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function tekstOfNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Eén rij uit Postgres naar een `Notitie`, of null als hij niet klopt.
 *
 * Geen cast: de database is een systeemgrens als elke andere. Een rij met een
 * onbekende `soort` (bv. na een migratie die de allowlist verruimde) wordt hier
 * geweigerd in plaats van als `Soort` doorgegeven te worden — dat is precies
 * het gat waar `any` doorheen glipt.
 */
export function notitieVanRij(rij: unknown): Notitie | null {
  if (!isObject(rij)) return null

  const id = tekstOfNull(rij.id)
  const tekst = tekstOfNull(rij.tekst)
  const datum = tekstOfNull(rij.datum)
  const aangemaaktOp = tekstOfNull(rij.aangemaakt_op)
  const bijgewerktOp = tekstOfNull(rij.bijgewerkt_op)
  if (id === null || tekst === null || datum === null) return null
  if (aangemaaktOp === null || bijgewerktOp === null) return null
  if (!isSoort(rij.soort)) return null

  return { id, tekst, soort: rij.soort, datum, aangemaaktOp, bijgewerktOp }
}

export function notitiesVanRijen(rijen: readonly unknown[]): Notitie[] {
  return rijen.map(notitieVanRij).filter((n): n is Notitie => n !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Dat is geen duplicatie maar
// twee echt verschillende vormen — en beide worden gelezen, niet gecast.

/** Eén notitie zoals hij over de draad komt. */
export function leesNotitieJson(ruw: unknown): Notitie | null {
  if (!isObject(ruw)) return null

  const id = tekstOfNull(ruw.id)
  const tekst = tekstOfNull(ruw.tekst)
  const datum = tekstOfNull(ruw.datum)
  const aangemaaktOp = tekstOfNull(ruw.aangemaaktOp)
  const bijgewerktOp = tekstOfNull(ruw.bijgewerktOp)
  if (id === null || tekst === null || datum === null) return null
  if (aangemaaktOp === null || bijgewerktOp === null) return null
  if (!isSoort(ruw.soort)) return null

  return { id, tekst, soort: ruw.soort, datum, aangemaaktOp, bijgewerktOp }
}

/**
 * Het antwoord van `GET /api/notities`.
 *
 * Eén kapotte notitie maakt het hele antwoord ongeldig i.p.v. stil te
 * verdwijnen: een brain dump waar zomaar een idee uit weggelaten wordt, is
 * erger dan een zichtbare foutmelding. Fout ≠ leeg.
 */
export function leesNotitiesAntwoord(ruw: unknown): Notitie[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.notities)) return null

  const notities = ruw.notities.map(leesNotitieJson)
  if (notities.some((n) => n === null)) return null
  return notities.filter((n): n is Notitie => n !== null)
}

/** Het antwoord van `POST /api/notities`. */
export function leesNotitieAntwoord(ruw: unknown): Notitie | null {
  if (!isObject(ruw)) return null
  return leesNotitieJson(ruw.notitie)
}
