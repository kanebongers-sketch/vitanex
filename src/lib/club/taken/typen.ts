// ─── Fit Factory Club, taken: de vormen (PUUR) ──────────────────────────────
// Takenlijsten per vestiging (Dagelijks, Afsluitronde, Poetsrooster), de taken
// erin en wat het personeel per dag afvinkt. Rijen uit de database worden hier
// genarrowd: een onbruikbare rij valt weg in plaats van de pagina te breken.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'

export const FREQUENTIES = ['dagelijks', 'per_week', 'indien_nodig', 'extra'] as const
export type Frequentie = (typeof FREQUENTIES)[number]

export const FREQUENTIE_LABEL: Record<Frequentie, string> = {
  dagelijks: 'Elke dag',
  per_week: 'Minimaal x per week',
  indien_nodig: 'Indien nodig',
  extra: 'Extra',
}

export const MOMENTEN = ['ochtend', 'middag', 'afsluiten', 'vrij'] as const
export type Moment = (typeof MOMENTEN)[number]

export const MOMENT_LABEL: Record<Moment, string> = {
  ochtend: 'Ochtend',
  middag: 'Middag',
  afsluiten: 'Afsluiten',
  vrij: 'Gedurende de dag',
}

export interface Takenlijst {
  id: string
  vestiging: Vestiging
  naam: string
  volgorde: number
  actief: boolean
}

export interface Taak {
  id: string
  lijstId: string
  naam: string
  groep: string | null
  frequentie: Frequentie
  /** Alleen bij frequentie per_week: hoe vaak minimaal. */
  perWeekMin: number | null
  moment: Moment
  volgorde: number
  actief: boolean
}

export interface Afvinking {
  id: string
  taakId: string
  datum: string
  afgevinktOp: string
  medewerkerId: string | null
  wie: string
  notitie: string | null
}

export interface DagNotitie {
  id: string
  datum: string
  tekst: string
  wie: string | null
  aangemaaktOp: string
}

export interface Afsluitronde {
  datum: string
  wie: string
  op: string
  openTaken: number
}

export const LIJST_KOLOMMEN = 'id, vestiging, naam, volgorde, actief'
export const TAAK_KOLOMMEN = 'id, lijst_id, naam, groep, frequentie, per_week_min, moment, volgorde, actief'
export const AFVINK_KOLOMMEN = 'id, taak_id, datum, afgevinkt_op, medewerker_id, wie, notitie'
export const NOTITIE_KOLOMMEN = 'id, datum, tekst, wie, aangemaakt_op'
export const AFSLUIT_KOLOMMEN = 'datum, wie, op, open_taken'

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function getal(v: unknown, standaard: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : standaard
}

export function isFrequentie(v: unknown): v is Frequentie {
  return typeof v === 'string' && (FREQUENTIES as readonly string[]).includes(v)
}

export function isMoment(v: unknown): v is Moment {
  return typeof v === 'string' && (MOMENTEN as readonly string[]).includes(v)
}

export function lijstUitRij(rij: unknown): Takenlijst | null {
  const r = obj(rij)
  const id = tekst(r?.id)
  const naam = tekst(r?.naam)
  if (!r || !id || !naam || !isVestigingSlug(r.vestiging)) return null
  return { id, vestiging: r.vestiging, naam, volgorde: getal(r.volgorde, 0), actief: r.actief !== false }
}

export function taakUitRij(rij: unknown): Taak | null {
  const r = obj(rij)
  const id = tekst(r?.id)
  const lijstId = tekst(r?.lijst_id)
  const naam = tekst(r?.naam)
  if (!r || !id || !lijstId || !naam || !isFrequentie(r.frequentie)) return null
  const min = typeof r.per_week_min === 'number' ? r.per_week_min : null
  return {
    id,
    lijstId,
    naam,
    groep: tekst(r.groep),
    frequentie: r.frequentie,
    perWeekMin: r.frequentie === 'per_week' ? (min ?? 1) : null,
    moment: isMoment(r.moment) ? r.moment : 'vrij',
    volgorde: getal(r.volgorde, 0),
    actief: r.actief !== false,
  }
}

export function afvinkingUitRij(rij: unknown): Afvinking | null {
  const r = obj(rij)
  const id = tekst(r?.id)
  const taakId = tekst(r?.taak_id)
  const datum = tekst(r?.datum)
  const op = tekst(r?.afgevinkt_op)
  const wie = tekst(r?.wie)
  if (!r || !id || !taakId || !datum || !op || !wie) return null
  return { id, taakId, datum: datum.slice(0, 10), afgevinktOp: op, medewerkerId: tekst(r.medewerker_id), wie, notitie: tekst(r.notitie) }
}

export function notitieUitRij(rij: unknown): DagNotitie | null {
  const r = obj(rij)
  const id = tekst(r?.id)
  const datum = tekst(r?.datum)
  const inhoud = tekst(r?.tekst)
  const op = tekst(r?.aangemaakt_op)
  if (!r || !id || !datum || !inhoud || !op) return null
  return { id, datum: datum.slice(0, 10), tekst: inhoud, wie: tekst(r.wie), aangemaaktOp: op }
}

export function afsluitrondeUitRij(rij: unknown): Afsluitronde | null {
  const r = obj(rij)
  const datum = tekst(r?.datum)
  const wie = tekst(r?.wie)
  const op = tekst(r?.op)
  if (!r || !datum || !wie || !op) return null
  return { datum: datum.slice(0, 10), wie, op, openTaken: getal(r.open_taken, 0) }
}

/** Een lijst rijen naar nette waarden; geen array = lege lijst. */
export function rijenNaar<T>(data: unknown, naar: (rij: unknown) => T | null): T[] {
  return Array.isArray(data) ? data.map(naar).filter((x): x is T => x !== null) : []
}

/** Op volgorde, bij gelijke volgorde op naam. Geeft een nieuwe array. */
export function opVolgorde<T extends { volgorde: number; naam: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam, 'nl'))
}

/** Kort voor in een vakje: "Lynn Maas" wordt "LM", "lm" wordt "LM", "Kane" wordt "KA". */
export function kortWie(wie: string): string {
  const woorden = wie.trim().split(/\s+/).filter(Boolean)
  if (woorden.length === 0) return '?'
  if (woorden.length === 1) {
    const w = woorden[0]
    return (w.length <= 3 ? w : w.slice(0, 2)).toUpperCase()
  }
  return `${woorden[0].charAt(0)}${woorden[woorden.length - 1].charAt(0)}`.toUpperCase()
}

/** "Minimaal 3x per week", "Elke dag", ... voor bij een taak, in de gekozen taal. */
export function frequentieTekst(taak: Pick<Taak, 'frequentie' | 'perWeekMin'>, taal: Taal = 'nl'): string {
  if (taak.frequentie === 'per_week') return TAKEN[taal].perWeek(taak.perWeekMin ?? 1)
  return TAKEN[taal].frequentie[taak.frequentie]
}

/** Het label van een frequentie in de gekozen taal. */
export function frequentieLabel(f: Frequentie, taal: Taal = 'nl'): string {
  return TAKEN[taal].frequentie[f]
}

/** Het label van een moment in de gekozen taal. */
export function momentLabel(m: Moment, taal: Taal = 'nl'): string {
  return TAKEN[taal].moment[m]
}
