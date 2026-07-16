// ─── LifeOS — taken & top-3 ─────────────────────────────────────────────────
// Vervangt Todoist. Niet door Todoist na te bouwen — door de enige vraag te
// beantwoorden die 's ochtends telt: welke drie dingen doe ik vandaag?
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in de database (migratie 020). Dat is geen duplicatie
// maar diepteverdediging met verschillende doelen: de database garandeert dat
// er nooit twee taken op positie 1 staan, deze laag geeft je een nette
// Nederlandse foutmelding in plaats van "23505".

// Relatief, niet via `@/`: er is (nog) geen vitest-config met die alias, en de
// hele lib-laag draait daarom op relatieve imports. Zie `pijlers/score.ts`.
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

export const MAX_TITEL_LENGTE = 500
export const MAX_NOTITIE_LENGTE = 4000

export type Top3Positie = 1 | 2 | 3
export const TOP3_POSITIES: readonly Top3Positie[] = Object.freeze([1, 2, 3])

/** Een taak, zoals hij uit de database komt én over de draad gaat. */
export interface Taak {
  id: string
  titel: string
  notitie: string | null
  klaar: boolean
  /** ISO-moment waarop je 'm afvinkte, of null. */
  klaarOp: string | null
  /** Dagsleutel (YYYY-MM-DD), of null = "ooit". */
  datum: string | null
  top3Positie: Top3Positie | null
  aangemaaktOp: string
}

export interface NieuweTaak {
  titel: string
  notitie: string | null
  datum: string | null
  top3Positie: Top3Positie | null
}

/** Alleen de velden die je meestuurt worden gewijzigd. */
export interface TaakWijziging {
  titel?: string
  notitie?: string | null
  klaar?: boolean
  datum?: string | null
  top3Positie?: Top3Positie | null
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function leesTitel(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Titel ontbreekt.' }
  const titel = v.trim()
  if (titel.length === 0) return { ok: false, fout: 'Een taak zonder titel is geen taak.' }
  if (titel.length > MAX_TITEL_LENGTE) {
    return { ok: false, fout: `Titel mag maximaal ${MAX_TITEL_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: titel }
}

function leesNotitie(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Notitie moet tekst zijn.' }
  const notitie = v.trim()
  if (notitie.length === 0) return { ok: true, waarde: null }
  if (notitie.length > MAX_NOTITIE_LENGTE) {
    return { ok: false, fout: `Notitie mag maximaal ${MAX_NOTITIE_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: notitie }
}

function leesDatum(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  if (leesDatumSleutel(v) === null) return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  return { ok: true, waarde: v }
}

export function isTop3Positie(v: unknown): v is Top3Positie {
  return v === 1 || v === 2 || v === 3
}

function leesTop3(v: unknown): Validatie<Top3Positie | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (!isTop3Positie(v)) return { ok: false, fout: 'Top-3-positie is 1, 2 of 3.' }
  return { ok: true, waarde: v }
}

/** Nieuwe taak uit een request-body. Faalt met een leesbare melding. */
export function leesNieuweTaak(body: unknown): Validatie<NieuweTaak> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const titel = leesTitel(body.titel)
  if (!titel.ok) return titel
  const notitie = leesNotitie(body.notitie)
  if (!notitie.ok) return notitie
  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum
  const top3Positie = leesTop3(body.top3Positie)
  if (!top3Positie.ok) return top3Positie

  // Spiegelt de check-constraint in de database: een top-3 is de top-3 VAN EEN
  // DAG. Zonder dag bestaat positie 1 niet.
  if (top3Positie.waarde !== null && datum.waarde === null) {
    return { ok: false, fout: 'Een top-3-positie hoort bij een dag; geef ook een datum mee.' }
  }

  return {
    ok: true,
    waarde: {
      titel: titel.waarde,
      notitie: notitie.waarde,
      datum: datum.waarde,
      top3Positie: top3Positie.waarde,
    },
  }
}

/**
 * Wijziging uit een request-body. Alleen aanwezige velden tellen — zo kun je
 * afvinken zonder de rest van de taak mee te sturen.
 */
export function leesTaakWijziging(body: unknown): Validatie<TaakWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const wijziging: TaakWijziging = {}

  if ('titel' in body) {
    const titel = leesTitel(body.titel)
    if (!titel.ok) return titel
    wijziging.titel = titel.waarde
  }
  if ('notitie' in body) {
    const notitie = leesNotitie(body.notitie)
    if (!notitie.ok) return notitie
    wijziging.notitie = notitie.waarde
  }
  if ('klaar' in body) {
    if (typeof body.klaar !== 'boolean') return { ok: false, fout: 'Klaar is waar of niet waar.' }
    wijziging.klaar = body.klaar
  }
  if ('datum' in body) {
    const datum = leesDatum(body.datum)
    if (!datum.ok) return datum
    wijziging.datum = datum.waarde
  }
  if ('top3Positie' in body) {
    const top3 = leesTop3(body.top3Positie)
    if (!top3.ok) return top3
    wijziging.top3Positie = top3.waarde
  }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }

  return { ok: true, waarde: wijziging }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

export function taakVanRij(rij: unknown): Taak | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const titel = tekst(rij.titel)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || titel === null || aangemaaktOp === null) return null

  return {
    id,
    titel,
    notitie: tekst(rij.notitie),
    klaar: rij.klaar === true,
    klaarOp: tekst(rij.klaar_op),
    datum: tekst(rij.datum),
    top3Positie: isTop3Positie(rij.top3_positie) ? rij.top3_positie : null,
    aangemaaktOp,
  }
}

export function takenVanRijen(rijen: readonly unknown[]): Taak[] {
  return rijen.map(taakVanRij).filter((t): t is Taak => t !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Dat is geen duplicatie maar
// twee echt verschillende vormen — en beide worden gelezen, niet gecast.

/** Eén taak zoals hij over de draad komt. */
export function leesTaakJson(ruw: unknown): Taak | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const titel = tekst(ruw.titel)
  const aangemaaktOp = tekst(ruw.aangemaaktOp)
  if (id === null || titel === null || aangemaaktOp === null) return null

  return {
    id,
    titel,
    notitie: tekst(ruw.notitie),
    klaar: ruw.klaar === true,
    klaarOp: tekst(ruw.klaarOp),
    datum: tekst(ruw.datum),
    top3Positie: isTop3Positie(ruw.top3Positie) ? ruw.top3Positie : null,
    aangemaaktOp,
  }
}

/** Het antwoord van `GET /api/taken`. */
export function leesTakenAntwoord(ruw: unknown): Taak[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.taken)) return null

  const taken = ruw.taken.map(leesTaakJson)
  if (taken.some((t) => t === null)) return null
  return taken.filter((t): t is Taak => t !== null)
}

/** Het antwoord van `POST /api/taken` en `PATCH /api/taken/[id]`. */
export function leesTaakAntwoord(ruw: unknown): Taak | null {
  if (!isObject(ruw)) return null
  return leesTaakJson(ruw.taak)
}

/**
 * De drie plekken van de top-3, op volgorde. Een lege plek is `null` — geen
 * ingeschoven taak, want dan zou positie 3 stilletjes positie 1 worden.
 */
export function top3Van(taken: readonly Taak[]): (Taak | null)[] {
  return TOP3_POSITIES.map((positie) => taken.find((t) => t.top3Positie === positie) ?? null)
}

/** De laagste vrije top-3-plek, of null als alle drie bezet zijn. */
export function eersteVrijePositie(taken: readonly Taak[]): Top3Positie | null {
  return TOP3_POSITIES.find((positie) => !taken.some((t) => t.top3Positie === positie)) ?? null
}
