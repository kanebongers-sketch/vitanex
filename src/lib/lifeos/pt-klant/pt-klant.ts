// ─── LifeOS — PT-klanten: wekelijkse sessies bewaken ────────────────────────
// PUUR. Geen fetch, geen DB. De naamconventie van een PT-sessie, de detectie of
// een afspraak bij een klant hoort, en de status per klant op basis van zijn
// ABONNEMENT (1×/week, 2×/week of 1×/2 weken). Zo vergeet je niemand.

import type { Abonnement, PtLocatie } from '../crm/crm'

export const LOCATIE_LABEL: Record<PtLocatie, string> = {
  bergeijk: 'Bergeijk',
  someren: 'Someren',
  budel: 'Budel',
}

export const ABONNEMENT_LABEL: Record<Abonnement, string> = {
  wekelijks_1: '1× per week',
  wekelijks_2: '2× per week',
  tweewekelijks_1: '1× per 2 weken',
}

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
 * in én de naam van de klant. Losjes (substring, hoofdletterongevoelig).
 */
export function matchtPtSessie(titel: string | null, naam: string): boolean {
  if (!titel) return false
  const n = normaliseer(naam)
  if (n.length === 0) return false
  const t = normaliseer(titel)
  return /\bpt\b/.test(t) && t.includes(n)
}

/**
 * De cadans achter een abonnement: hoeveel sessies nodig, over hoeveel weken.
 * `null` (nog niet ingesteld) telt als 1× per week — het meest voorkomende.
 */
export function cadans(abonnement: Abonnement | null): { nodig: number; weken: 1 | 2 } {
  switch (abonnement) {
    case 'wekelijks_2':
      return { nodig: 2, weken: 1 }
    case 'tweewekelijks_1':
      return { nodig: 1, weken: 2 }
    case 'wekelijks_1':
    default:
      return { nodig: 1, weken: 1 }
  }
}

/** Eén PT-klant met zijn config, zoals de status-berekening 'm nodig heeft. */
export interface PtKlant {
  id: string
  naam: string
  email: string | null
  abonnement: Abonnement | null
  duo: boolean
  locatie: PtLocatie | null
  /** Op vakantie t/m deze dag (YYYY-MM-DD), of null. */
  vakantieTot: string | null
}

/** Eén afspraak uit de agenda. */
export interface PtEvent {
  titel: string | null
  startOp: string
}

/** De status per klant: nodig vs. ingepland binnen zijn cadans-venster. */
export interface PtWeekStatus {
  id: string
  naam: string
  email: string | null
  locatie: PtLocatie | null
  abonnement: Abonnement | null
  duo: boolean
  /** De vensterlengte in weken (1 = deze week, 2 = per 2 weken). */
  weken: 1 | 2
  nodig: number
  ingepland: number
  /** Hoeveel er nog moeten (0 = klaar; nooit negatief). */
  tekort: number
  opVakantie: boolean
}

/**
 * De status per klant. `events` beslaan minstens de vorige + huidige week (zodat
 * een 2-wekelijks abonnement zijn hele venster ziet); `weekVanISO` is de maandag
 * van de huidige week. Per klant kijken we in het juiste venster: wekelijks alleen
 * deze week, tweewekelijks de laatste twee weken.
 */
export function bepaalWeekStatus(
  klanten: readonly PtKlant[],
  events: readonly PtEvent[],
  weekVanISO: string,
  vandaagKey: string,
): PtWeekStatus[] {
  const weekVan = new Date(weekVanISO).getTime()
  const weekTot = weekVan + 7 * 24 * 60 * 60 * 1000
  const vorigeVan = weekVan - 7 * 24 * 60 * 60 * 1000

  return klanten.map((k) => {
    const { nodig, weken } = cadans(k.abonnement)
    const vensterVan = weken === 2 ? vorigeVan : weekVan
    const ingepland = events.filter((e) => {
      if (!matchtPtSessie(e.titel, k.naam)) return false
      const t = new Date(e.startOp).getTime()
      return t >= vensterVan && t < weekTot
    }).length
    const opVakantie = k.vakantieTot !== null && vandaagKey <= k.vakantieTot
    const tekort = opVakantie ? 0 : Math.max(0, nodig - ingepland)
    return {
      id: k.id,
      naam: k.naam,
      email: k.email,
      locatie: k.locatie,
      abonnement: k.abonnement,
      duo: k.duo,
      weken,
      nodig,
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
function isAbo(v: unknown): v is Abonnement {
  return v === 'wekelijks_1' || v === 'wekelijks_2' || v === 'tweewekelijks_1'
}
function heelGetal(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

function leesStatus(ruw: unknown): PtWeekStatus | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const nodig = heelGetal(ruw.nodig)
  const ingepland = heelGetal(ruw.ingepland)
  const tekort = heelGetal(ruw.tekort)
  if (id === null || naam === null || nodig === null || ingepland === null || tekort === null) {
    return null
  }
  return {
    id,
    naam,
    email: tekstOfNull(ruw.email),
    locatie: isLoc(ruw.locatie) ? ruw.locatie : null,
    abonnement: isAbo(ruw.abonnement) ? ruw.abonnement : null,
    duo: ruw.duo === true,
    weken: ruw.weken === 2 ? 2 : 1,
    nodig,
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
