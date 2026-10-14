// ─── Fit Factory Club, rooster: de vormen en de systeemgrens (PUUR) ─────────
// Databaserijen komen binnen als `unknown` en worden hier genarrowd. Geen casts
// op databasedata: een rij die niet klopt valt eruit (null).

import { isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import { RESERVERING_BRONNEN, RESERVERING_STATUSSEN, type ReserveringBron, type ReserveringStatus } from './regels'
import { normaliseerTijd, isDatum } from './tijd'

export const LES_SOORTEN = ['kracht', 'cardio', 'mind_body', 'dans', 'spinning', 'functioneel', 'overig'] as const
export type LesSoort = (typeof LES_SOORTEN)[number]

export const SOORT_LABEL: Record<LesSoort, string> = {
  kracht: 'Kracht',
  cardio: 'Cardio',
  mind_body: 'Mind & body',
  dans: 'Dans',
  spinning: 'Spinning',
  functioneel: 'Functioneel',
  overig: 'Overig',
}

export interface Zaal {
  id: string
  vestiging: Vestiging
  naam: string
  capaciteit: number
  actief: boolean
}

export interface Lestype {
  id: string
  naam: string
  omschrijving: string | null
  soort: LesSoort
  duurMin: number
  intensiteit: number
  actief: boolean
}

export interface LesSerie {
  id: string
  vestiging: Vestiging
  lestypeId: string
  zaalId: string | null
  instructeurId: string | null
  weekdag: number
  /** "19:00" */
  starttijd: string
  duurMin: number
  capaciteit: number
  vanaf: string
  tot: string | null
  actief: boolean
}

export interface LesRij {
  id: string
  vestiging: Vestiging
  serieId: string | null
  lestypeId: string
  zaalId: string | null
  instructeurId: string | null
  startOp: string
  eindOp: string
  capaciteit: number
  geannuleerd: boolean
  annuleerReden: string | null
}

export interface ReserveringRij {
  id: string
  lesId: string
  lidId: string
  status: ReserveringStatus
  wachtpositie: number | null
  geboektOp: string
  bron: ReserveringBron
  teLaat: boolean
}

export const LES_KOLOMMEN = 'id, vestiging, serie_id, lestype_id, zaal_id, instructeur_id, start_op, eind_op, capaciteit, status, annuleer_reden'
export const RESERVERING_KOLOMMEN = 'id, les_id, lid_id, status, wachtpositie, geboekt_op, bron'
export const SERIE_KOLOMMEN = 'id, vestiging, lestype_id, zaal_id, instructeur_id, weekdag, starttijd, duur_min, capaciteit, vanaf, tot, actief'

type Rij = Record<string, unknown>

function alsRij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function geheel(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) ? v : null
}

export function isLesSoort(v: unknown): v is LesSoort {
  return typeof v === 'string' && (LES_SOORTEN as readonly string[]).includes(v)
}

export function isReserveringStatus(v: unknown): v is ReserveringStatus {
  return typeof v === 'string' && (RESERVERING_STATUSSEN as readonly string[]).includes(v)
}

export function isReserveringBron(v: unknown): v is ReserveringBron {
  return typeof v === 'string' && (RESERVERING_BRONNEN as readonly string[]).includes(v)
}

export function zaalUitRij(ruw: unknown): Zaal | null {
  const r = alsRij(ruw)
  if (!r) return null
  const id = tekst(r.id)
  const naam = tekst(r.naam)
  const capaciteit = geheel(r.capaciteit)
  if (!id || !naam || capaciteit === null || !isVestiging(r.vestiging)) return null
  return { id, vestiging: r.vestiging, naam, capaciteit, actief: r.actief !== false }
}

export function lestypeUitRij(ruw: unknown): Lestype | null {
  const r = alsRij(ruw)
  if (!r) return null
  const id = tekst(r.id)
  const naam = tekst(r.naam)
  const duurMin = geheel(r.duur_min)
  const intensiteit = geheel(r.intensiteit)
  if (!id || !naam || duurMin === null) return null
  return {
    id,
    naam,
    omschrijving: tekst(r.omschrijving),
    soort: isLesSoort(r.soort) ? r.soort : 'overig',
    duurMin,
    intensiteit: intensiteit !== null && intensiteit >= 1 && intensiteit <= 3 ? intensiteit : 2,
    actief: r.actief !== false,
  }
}

export function serieUitRij(ruw: unknown): LesSerie | null {
  const r = alsRij(ruw)
  if (!r) return null
  const id = tekst(r.id)
  const lestypeId = tekst(r.lestype_id)
  const weekdag = geheel(r.weekdag)
  const starttijd = normaliseerTijd(r.starttijd)
  const duurMin = geheel(r.duur_min)
  const capaciteit = geheel(r.capaciteit)
  if (!id || !lestypeId || !isVestiging(r.vestiging) || weekdag === null || weekdag < 1 || weekdag > 7) return null
  if (!starttijd || duurMin === null || capaciteit === null || !isDatum(r.vanaf)) return null
  return {
    id,
    vestiging: r.vestiging,
    lestypeId,
    zaalId: tekst(r.zaal_id),
    instructeurId: tekst(r.instructeur_id),
    weekdag,
    starttijd,
    duurMin,
    capaciteit,
    vanaf: r.vanaf,
    tot: isDatum(r.tot) ? r.tot : null,
    actief: r.actief !== false,
  }
}

export function lesUitRij(ruw: unknown): LesRij | null {
  const r = alsRij(ruw)
  if (!r) return null
  const id = tekst(r.id)
  const lestypeId = tekst(r.lestype_id)
  const startOp = tekst(r.start_op)
  const eindOp = tekst(r.eind_op)
  const capaciteit = geheel(r.capaciteit)
  if (!id || !lestypeId || !startOp || !eindOp || capaciteit === null || !isVestiging(r.vestiging)) return null
  if (Number.isNaN(Date.parse(startOp)) || Number.isNaN(Date.parse(eindOp))) return null
  return {
    id,
    vestiging: r.vestiging,
    serieId: tekst(r.serie_id),
    lestypeId,
    zaalId: tekst(r.zaal_id),
    instructeurId: tekst(r.instructeur_id),
    startOp,
    eindOp,
    capaciteit,
    geannuleerd: r.status === 'geannuleerd',
    annuleerReden: tekst(r.annuleer_reden),
  }
}

export function reserveringUitRij(ruw: unknown): ReserveringRij | null {
  const r = alsRij(ruw)
  if (!r) return null
  const id = tekst(r.id)
  const lesId = tekst(r.les_id)
  const lidId = tekst(r.lid_id)
  if (!id || !lesId || !lidId || !isReserveringStatus(r.status)) return null
  return {
    id,
    lesId,
    lidId,
    status: r.status,
    wachtpositie: geheel(r.wachtpositie),
    geboektOp: tekst(r.geboekt_op) ?? '',
    bron: isReserveringBron(r.bron) ? r.bron : 'app',
    teLaat: r.te_laat === true,
  }
}

/** Een lijst ruwe rijen naar nette objecten; onbruikbare rijen vallen weg. */
export function rijenNaar<T>(rijen: unknown, naar: (r: unknown) => T | null): T[] {
  if (!Array.isArray(rijen)) return []
  return rijen.map(naar).filter((x): x is T => x !== null)
}
