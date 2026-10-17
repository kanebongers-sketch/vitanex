// ─── Club, challenges: status en periode (PUUR) ─────────────────────────────
// Datums zijn yyyy-mm-dd in Nederlandse tijd. Een gestopte challenge is
// afgelopen vanaf de dag dat hij stopte.

import type { Challenge } from './model'

export type ChallengeStatus = 'gepland' | 'lopend' | 'afgelopen'

export const STATUS_LABEL: Record<ChallengeStatus, string> = {
  lopend: 'Lopend',
  gepland: 'Gepland',
  afgelopen: 'Afgelopen',
}

const NL_DATUM = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' })

/** De Nederlandse kalenderdag van een moment (ISO of Date), yyyy-mm-dd. */
export function nlDatum(moment: string | Date): string {
  return NL_DATUM.format(typeof moment === 'string' ? new Date(moment) : moment)
}

/** De laatste dag die meetelt: de einddatum, of eerder als de challenge gestopt is. */
export function laatsteDag(c: Pick<Challenge, 'eind' | 'gestoptOp'>): string {
  if (!c.gestoptOp) return c.eind
  const stop = nlDatum(c.gestoptOp)
  return stop < c.eind ? stop : c.eind
}

export function statusVan(c: Pick<Challenge, 'start' | 'eind' | 'gestoptOp'>, vandaag: string): ChallengeStatus {
  if (c.gestoptOp && nlDatum(c.gestoptOp) <= vandaag) return 'afgelopen'
  if (vandaag < c.start) return 'gepland'
  return vandaag > c.eind ? 'afgelopen' : 'lopend'
}

/** Valt dit moment in de periode van de challenge (tot en met de laatste dag)? */
export function inPeriode(c: Pick<Challenge, 'start' | 'eind' | 'gestoptOp'>, moment: string): boolean {
  const dag = nlDatum(moment)
  return dag >= c.start && dag <= laatsteDag(c)
}

function dagNummer(dag: string): number {
  const [j, m, d] = dag.split('-').map(Number)
  return Math.round(Date.UTC(j, m - 1, d) / 86_400_000)
}

/** Aantal dagen van a tot en met b (dezelfde dag = 1). */
export function dagenTussen(a: string, b: string): number {
  return dagNummer(b) - dagNummer(a) + 1
}

/** Nog te gaan bij een lopende challenge, vandaag meegeteld; 0 als hij voorbij is. */
export function dagenTeGaan(c: Pick<Challenge, 'eind'>, vandaag: string): number {
  return Math.max(0, dagenTussen(vandaag, c.eind))
}

/** Hoe ver de tijd is, 0 tot en met 1. */
export function tijdVerstreken(c: Pick<Challenge, 'start' | 'eind'>, vandaag: string): number {
  const totaal = dagenTussen(c.start, c.eind)
  const voorbij = dagenTussen(c.start, vandaag)
  return Math.max(0, Math.min(1, voorbij / totaal))
}

export interface Gegroepeerd {
  lopend: Challenge[]
  gepland: Challenge[]
  afgelopen: Challenge[]
}

/** Lopend (eerst wat het eerst eindigt), gepland (eerst wat het eerst begint), afgelopen (nieuwste eerst). */
export function groepeer(lijst: readonly Challenge[], vandaag: string): Gegroepeerd {
  const van = (s: ChallengeStatus) => lijst.filter((c) => statusVan(c, vandaag) === s)
  return {
    lopend: [...van('lopend')].sort((a, b) => a.eind.localeCompare(b.eind) || a.titel.localeCompare(b.titel)),
    gepland: [...van('gepland')].sort((a, b) => a.start.localeCompare(b.start) || a.titel.localeCompare(b.titel)),
    afgelopen: [...van('afgelopen')].sort((a, b) => laatsteDag(b).localeCompare(laatsteDag(a)) || a.titel.localeCompare(b.titel)),
  }
}

/** Geldt de challenge voor leden van deze (thuis)vestiging? Leeg = alle vestigingen. */
export function geldtVoor(c: Pick<Challenge, 'vestigingen'>, vestiging: string): boolean {
  return c.vestigingen.length === 0 || c.vestigingen.includes(vestiging)
}

/** Doet dit lid mee? Bij inschrijven alleen met een inschrijving, anders iedereen van de vestiging(en). */
export function doetMee(c: Pick<Challenge, 'vestigingen' | 'deelname'>, lid: { vestiging: string }, ingeschreven: boolean): boolean {
  if (!geldtVoor(c, lid.vestiging)) return false
  return c.deelname === 'automatisch' || ingeschreven
}
