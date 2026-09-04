// ─── LifeOS — PT-klanten: wekelijkse sessies bewaken ────────────────────────
// PUUR. Geen fetch, geen DB. De naamconventie van een PT-sessie, de detectie of
// een afspraak bij een klant hoort, en de week-status per klant (nodig vs
// ingepland, vakantie-aware). Zo kun je nooit iemand vergeten in te plannen.

import type { PtLocatie } from '../crm/crm'

/** De labels van de drie locaties, voor de titel en de UI. */
export const LOCATIE_LABEL: Record<PtLocatie, string> = {
  bergeijk: 'Bergeijk',
  someren: 'Someren',
  budel: 'Budel',
}

/** Hoe vaak per week als er niets is ingesteld: één keer. */
export const STANDAARD_PER_WEEK = 1

/** De vaste sessie-titel: "PT Iris Someren" (naam + locatie, geen haakjes). */
export function ptSessieTitel(naam: string, locatie: PtLocatie | null): string {
  const loc = locatie ? ` ${LOCATIE_LABEL[locatie]}` : ''
  return `PT ${naam.trim()}${loc}`
}

function normaliseer(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Herkent een PT-sessie met déze klant aan de titel: er staat een los "pt"-woord
 * in én de naam van de klant. Losjes (substring, hoofdletterongevoelig), want je
 * typt de titel niet altijd exact. "Lunch met Iris" telt niet mee (geen "pt"),
 * en "PT Rick" telt niet mee voor Iris (andere naam).
 */
export function matchtPtSessie(titel: string | null, naam: string): boolean {
  if (!titel) return false
  const n = normaliseer(naam)
  if (n.length === 0) return false
  const t = normaliseer(titel)
  return /\bpt\b/.test(t) && t.includes(n)
}

/** Eén PT-klant met zijn config, zoals de status-berekening 'm nodig heeft. */
export interface PtKlant {
  id: string
  naam: string
  email: string | null
  /** 1 of 2, of null = nog niet ingesteld (telt als 1). */
  sessiesPerWeek: number | null
  locatie: PtLocatie | null
  /** Op vakantie t/m deze dag (YYYY-MM-DD), of null. */
  vakantieTot: string | null
}

/** Eén afspraak uit de agenda. */
export interface PtEvent {
  titel: string | null
  startOp: string
}

/** De week-status per klant: hoeveel sessies nodig vs. ingepland deze week. */
export interface PtWeekStatus {
  id: string
  naam: string
  email: string | null
  locatie: PtLocatie | null
  sessiesPerWeek: number
  /** Hoeveel er deze week gepland staan. */
  ingepland: number
  /** Hoeveel er nog moeten (0 = klaar; nooit negatief). */
  tekort: number
  /** Staat deze klant op vakantie op de peildatum? Dan niet meetellen. */
  opVakantie: boolean
}

/**
 * Bepaalt per klant de week-status. `events` zijn al op de kalenderweek gefilterd
 * door de aanroeper. `vandaagKey` (YYYY-MM-DD) beslist de vakantie: een klant met
 * `vakantieTot >= vandaag` telt als "op vakantie" en heeft geen tekort.
 */
export function bepaalWeekStatus(
  klanten: readonly PtKlant[],
  events: readonly PtEvent[],
  vandaagKey: string,
): PtWeekStatus[] {
  return klanten.map((k) => {
    const nodig = k.sessiesPerWeek ?? STANDAARD_PER_WEEK
    const ingepland = events.filter((e) => matchtPtSessie(e.titel, k.naam)).length
    const opVakantie = k.vakantieTot !== null && vandaagKey <= k.vakantieTot
    const tekort = opVakantie ? 0 : Math.max(0, nodig - ingepland)
    return {
      id: k.id,
      naam: k.naam,
      email: k.email,
      locatie: k.locatie,
      sessiesPerWeek: nodig,
      ingepland,
      tekort,
      opVakantie,
    }
  })
}

// ─── De vorm over de draad (systeemgrens) ───────────────────────────────────

export type PtKlantenAntwoord =
  | { gekoppeld: false }
  | { gekoppeld: true; klanten: PtWeekStatus[] }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}
function isLoc(v: unknown): v is PtLocatie {
  return v === 'bergeijk' || v === 'someren' || v === 'budel'
}
function heelGetal(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

function leesStatus(ruw: unknown): PtWeekStatus | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const sessiesPerWeek = heelGetal(ruw.sessiesPerWeek)
  const ingepland = heelGetal(ruw.ingepland)
  const tekort = heelGetal(ruw.tekort)
  if (id === null || naam === null || sessiesPerWeek === null || ingepland === null || tekort === null) {
    return null
  }
  return {
    id,
    naam,
    email: tekstOfNull(ruw.email),
    locatie: isLoc(ruw.locatie) ? ruw.locatie : null,
    sessiesPerWeek,
    ingepland,
    tekort,
    opVakantie: ruw.opVakantie === true,
  }
}

/** Het antwoord van `GET /api/lifeos/pt-klanten`, of null als het niet klopt. */
export function leesPtKlanten(ruw: unknown): PtKlantenAntwoord | null {
  if (!isObject(ruw)) return null
  if (ruw.gekoppeld === false) return { gekoppeld: false }
  if (ruw.gekoppeld !== true) return null
  if (!Array.isArray(ruw.klanten)) return null
  const klanten = ruw.klanten.map(leesStatus)
  if (klanten.some((k) => k === null)) return null
  return { gekoppeld: true, klanten: klanten.filter((k): k is PtWeekStatus => k !== null) }
}
