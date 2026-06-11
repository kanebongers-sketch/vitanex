/**
 * Gedeelde types, validatie en merge-logica voor gezondheidsdata.
 * Gebruikt door de sync-endpoints (server) en de native sync (client).
 */

export interface DagMeting {
  datum: string
  stappen?: number | null
  slaapMinuten?: number | null
  hartslag?: number | null
  calorieen?: number | null
}

export type HealthBron = 'health_connect' | 'apple_health' | 'google_fit'

export const HEALTH_BRONNEN: HealthBron[] = ['health_connect', 'apple_health', 'google_fit']

export const BRON_LABELS: Record<HealthBron, string> = {
  health_connect: 'Health Connect',
  apple_health: 'Apple Health',
  google_fit: 'Google Fit',
}

const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/

/** Realistische bovengrenzen — alles daarbuiten is meetruis of misbruik */
const GRENZEN = {
  stappen: 200_000,
  slaapMinuten: 24 * 60,
  hartslag: 250,
  calorieen: 20_000,
} as const

function geldigGetal(waarde: unknown, max: number): boolean {
  return waarde === null || waarde === undefined
    || (typeof waarde === 'number' && Number.isFinite(waarde) && waarde >= 0 && waarde <= max)
}

/** Valideert één dagmeting van een (onvertrouwde) client. */
export function isGeldigeDagMeting(x: unknown): x is DagMeting {
  if (typeof x !== 'object' || x === null) return false
  const m = x as Record<string, unknown>
  if (typeof m.datum !== 'string' || !DATUM_PATROON.test(m.datum)) return false
  return geldigGetal(m.stappen, GRENZEN.stappen)
    && geldigGetal(m.slaapMinuten, GRENZEN.slaapMinuten)
    && geldigGetal(m.hartslag, GRENZEN.hartslag)
    && geldigGetal(m.calorieen, GRENZEN.calorieen)
}

/** Houdt alleen metingen over die ten minste één waarde bevatten. */
export function heeftMeetwaarde(m: DagMeting): boolean {
  return [m.stappen, m.slaapMinuten, m.hartslag, m.calorieen]
    .some(v => v !== null && v !== undefined)
}

export interface BestaandeRij {
  datum: string
  stappen: number | null
  slaap_minuten: number | null
  hartslag_gemiddeld: number | null
  calorieen: number | null
}

export interface SamengevoegdeRij {
  datum: string
  stappen: number | null
  slaap_minuten: number | null
  hartslag_gemiddeld: number | null
  calorieen: number | null
  bron: string
}

/**
 * Voegt nieuwe metingen samen met bestaande rijen: nieuwe niet-lege waarden
 * winnen, bestaande waarden blijven staan waar de bron niets levert.
 * Zo overschrijft een bron die alleen stappen kent nooit iemands slaapdata.
 */
export function mergeDagMetingen(
  bestaand: BestaandeRij[],
  nieuw: DagMeting[],
  bron: string
): SamengevoegdeRij[] {
  const perDatum = new Map(bestaand.map(r => [r.datum, r]))

  return nieuw
    .filter(heeftMeetwaarde)
    .map(m => {
      const oud = perDatum.get(m.datum)
      return {
        datum: m.datum,
        stappen: afgerond(m.stappen) ?? oud?.stappen ?? null,
        slaap_minuten: afgerond(m.slaapMinuten) ?? oud?.slaap_minuten ?? null,
        hartslag_gemiddeld: afgerond(m.hartslag) ?? oud?.hartslag_gemiddeld ?? null,
        calorieen: afgerond(m.calorieen) ?? oud?.calorieen ?? null,
        bron,
      }
    })
}

function afgerond(v: number | null | undefined): number | null {
  return v === null || v === undefined ? null : Math.round(v)
}

/** Datum (YYYY-MM-DD) van een tijdstip in Nederlandse tijd. */
export function datumInNL(tijdstip: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(tijdstip)
}
