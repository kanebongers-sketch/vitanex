// ─── Club: rapporten, databaserijen naar typen (PUUR, systeemgrens) ─────────
// Alles uit de database is `unknown` tot het hier is nagekeken. Er worden
// alleen kolommen gelezen die in een rapport mogen: geen geboortedata,
// metingen, intake-antwoorden of vrije notities.

import { alsRij, dag, datum, ingeslotenNaam, isLidStatus, lesBasisUitRij, tekst } from '@/lib/club/cijfers/rijen'
import { isReserveringStatus, type LesBasis, type ReserveringStatus } from '@/lib/club/cijfers/lessen'
import { isLeadBron, isLeadStatus, type LeadBron, type LeadStatus } from '@/lib/club/cijfers/leads'
import type { LidStatus } from '@/lib/club/kern/lid'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'
import { REGEL_SLEUTELS, type RegelSleutel } from '@/lib/club/automatisering/regels'

export const LID_RAPPORT_KOLOMMEN = 'id, vestiging, lidnummer, voornaam, achternaam, email, telefoon, abonnement, status, lid_sinds, einddatum'
export const LID_NAAM_KOLOMMEN = 'id, vestiging, lidnummer, voornaam, achternaam'

export interface LidNaam {
  id: string
  vestiging: string
  lidnummer: string | null
  voornaam: string
  achternaam: string
}

export interface LidRij extends LidNaam {
  email: string | null
  telefoon: string | null
  abonnement: string | null
  status: LidStatus
  lidSinds: string | null
  einddatum: string | null
}

export interface CheckinRij {
  lidId: string
  vestiging: string
  op: Date
}

export interface LesRij extends LesBasis {
  instructeurId: string | null
}

export interface ReserveringRij {
  lesId: string
  lidId: string | null
  status: ReserveringStatus
  teLaat: boolean
}

export interface LeadRij {
  aangemaakt: Date
  naam: string
  email: string | null
  telefoon: string | null
  vestiging: string
  bron: LeadBron
  interesse: string | null
  status: LeadStatus
  proeflesOp: Date | null
  verlorenReden: string | null
  medewerkerId: string | null
}

export const AFSPRAAK_STATUSSEN = ['gepland', 'geweest', 'niet_gekomen', 'geannuleerd'] as const
export type AfspraakStatus = (typeof AFSPRAAK_STATUSSEN)[number]

export interface AfspraakRij {
  vestiging: string
  medewerkerId: string
  lidId: string | null
  start: Date
  eind: Date
  status: AfspraakStatus
  type: string
}

export interface OpvolgRij {
  vestiging: string
  regel: RegelSleutel
  status: 'gedaan' | 'overgeslagen'
  door: string | null
  op: Date
}

export function lidNaamUitRij(v: unknown): LidNaam | null {
  const r = alsRij(v)
  const id = r ? tekst(r.id) : null
  if (!r || !id || !isVestigingSlug(r.vestiging)) return null
  return { id, vestiging: r.vestiging, lidnummer: tekst(r.lidnummer), voornaam: tekst(r.voornaam) ?? '', achternaam: tekst(r.achternaam) ?? '' }
}

export function lidRapportUitRij(v: unknown): LidRij | null {
  const basis = lidNaamUitRij(v)
  const r = alsRij(v)
  if (!basis || !r || !isLidStatus(r.status)) return null
  return {
    ...basis,
    email: tekst(r.email),
    telefoon: tekst(r.telefoon),
    abonnement: tekst(r.abonnement),
    status: r.status,
    lidSinds: dag(r.lid_sinds),
    einddatum: dag(r.einddatum),
  }
}

export function checkinUitRij(v: unknown): CheckinRij | null {
  const r = alsRij(v)
  const lidId = r ? tekst(r.lid_id) : null
  const op = r ? datum(r.op) : null
  if (!r || !lidId || !op || !isVestigingSlug(r.vestiging)) return null
  return { lidId, vestiging: r.vestiging, op }
}

export function lesRapportUitRij(v: unknown): LesRij | null {
  const basis = lesBasisUitRij(v)
  const r = alsRij(v)
  return basis && r ? { ...basis, instructeurId: tekst(r.instructeur_id) } : null
}

export function reserveringRapportUitRij(v: unknown): ReserveringRij | null {
  const r = alsRij(v)
  const lesId = r ? tekst(r.les_id) : null
  if (!r || !lesId || !isReserveringStatus(r.status)) return null
  return { lesId, lidId: tekst(r.lid_id), status: r.status, teLaat: r.te_laat === true }
}

export function leadRapportUitRij(v: unknown): LeadRij | null {
  const r = alsRij(v)
  const aangemaakt = r ? datum(r.aangemaakt_op) : null
  if (!r || !aangemaakt || !isVestigingSlug(r.vestiging) || !isLeadBron(r.bron) || !isLeadStatus(r.status)) return null
  return {
    aangemaakt,
    naam: tekst(r.naam) ?? '',
    email: tekst(r.email),
    telefoon: tekst(r.telefoon),
    vestiging: r.vestiging,
    bron: r.bron,
    interesse: tekst(r.interesse),
    status: r.status,
    proeflesOp: datum(r.proefles_op),
    verlorenReden: tekst(r.verloren_reden),
    medewerkerId: tekst(r.medewerker_id),
  }
}

function isAfspraakStatus(v: unknown): v is AfspraakStatus {
  return typeof v === 'string' && (AFSPRAAK_STATUSSEN as readonly string[]).includes(v)
}

export function afspraakUitRij(v: unknown): AfspraakRij | null {
  const r = alsRij(v)
  const medewerkerId = r ? tekst(r.medewerker_id) : null
  const start = r ? datum(r.start_op) : null
  const eind = r ? datum(r.eind_op) : null
  if (!r || !medewerkerId || !start || !eind || !isVestigingSlug(r.vestiging) || !isAfspraakStatus(r.status)) return null
  return { vestiging: r.vestiging, medewerkerId, lidId: tekst(r.lid_id), start, eind, status: r.status, type: ingeslotenNaam(r.club_afspraak_typen) ?? 'Afspraak' }
}

function isRegel(v: unknown): v is RegelSleutel {
  return typeof v === 'string' && (REGEL_SLEUTELS as readonly string[]).includes(v)
}

export function opvolgUitRij(v: unknown): OpvolgRij | null {
  const r = alsRij(v)
  const op = r ? datum(r.afgehandeld_op) : null
  if (!r || !op || !isVestigingSlug(r.vestiging) || !isRegel(r.regel)) return null
  if (r.status !== 'gedaan' && r.status !== 'overgeslagen') return null
  return { vestiging: r.vestiging, regel: r.regel, status: r.status, door: tekst(r.afgehandeld_door), op }
}

/** id naar naam, uit rijen { id, naam } (club_medewerkers). */
export function namenUitRijen(rijen: readonly unknown[]): Map<string, string> {
  const uit = new Map<string, string>()
  for (const v of rijen) {
    const r = alsRij(v)
    const id = r ? tekst(r.id) : null
    const naam = r ? tekst(r.naam) : null
    if (id && naam) uit.set(id, naam)
  }
  return uit
}

