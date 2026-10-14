// ─── Fit Factory Club: databaserijen voor leden en check-in (PUUR) ──────────
// Systeemgrens: rijen uit Supabase naar nette types, zonder casts op de data.

export type ReserveringStatus = 'geboekt' | 'wachtlijst' | 'geannuleerd' | 'aanwezig' | 'no_show'

const RESERVERING_STATUSSEN: readonly ReserveringStatus[] = ['geboekt', 'wachtlijst', 'geannuleerd', 'aanwezig', 'no_show']

export const RESERVERING_LABEL: Record<ReserveringStatus, string> = {
  geboekt: 'Geboekt',
  wachtlijst: 'Wachtlijst',
  geannuleerd: 'Geannuleerd',
  aanwezig: 'Aanwezig',
  no_show: 'Niet gekomen',
}

/** De select voor een reservering met les en lesnaam (te filteren op club_lessen.*). */
export const RESERVERING_SELECT =
  'id, lid_id, status, wachtpositie, club_lessen!inner(id, start_op, eind_op, status, vestiging, club_lestypen(naam))'

export interface LidReservering {
  id: string
  lidId: string
  status: ReserveringStatus
  wachtpositie: number | null
  lesId: string
  lesNaam: string
  start: Date
  eind: Date
  lesGeannuleerd: boolean
  vestiging: string
}

function obj(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return obj(v[0])
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null
}

function datum(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function isReserveringStatus(v: unknown): v is ReserveringStatus {
  return typeof v === 'string' && (RESERVERING_STATUSSEN as readonly string[]).includes(v)
}

export function reserveringUitRij(rij: unknown): LidReservering | null {
  const r = obj(rij)
  const les = obj(r?.club_lessen)
  if (!r || !les || typeof r.id !== 'string' || typeof r.lid_id !== 'string' || typeof les.id !== 'string') return null
  const start = datum(les.start_op)
  const eind = datum(les.eind_op)
  if (!start || !eind || !isReserveringStatus(r.status)) return null
  const type = obj(les.club_lestypen)
  return {
    id: r.id,
    lidId: r.lid_id,
    status: r.status,
    wachtpositie: typeof r.wachtpositie === 'number' ? r.wachtpositie : null,
    lesId: les.id,
    lesNaam: typeof type?.naam === 'string' ? type.naam : 'Les',
    start,
    eind,
    lesGeannuleerd: les.status === 'geannuleerd',
    vestiging: typeof les.vestiging === 'string' ? les.vestiging : '',
  }
}

export interface CheckinRij {
  id: string
  lidId: string
  op: Date
  bron: string
  vestiging: string
  /** Alleen als de select club_leden(voornaam, achternaam) meenam. */
  naam: string | null
}

export function checkinUitRij(rij: unknown): CheckinRij | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.lid_id !== 'string') return null
  const op = datum(r.op)
  if (!op) return null
  const lid = obj(r.club_leden)
  const naam = lid && typeof lid.voornaam === 'string' && typeof lid.achternaam === 'string' ? `${lid.voornaam} ${lid.achternaam}` : null
  return {
    id: r.id,
    lidId: r.lid_id,
    op,
    bron: typeof r.bron === 'string' ? r.bron : 'balie',
    vestiging: typeof r.vestiging === 'string' ? r.vestiging : '',
    naam,
  }
}

export interface Notitie {
  id: string
  tekst: string
  auteur: string | null
  vastgepind: boolean
  op: string
}

export function notitieUitRij(rij: unknown): Notitie | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.tekst !== 'string') return null
  const op = datum(r.aangemaakt_op)
  if (!op) return null
  return {
    id: r.id,
    tekst: r.tekst,
    auteur: typeof r.auteur === 'string' ? r.auteur : null,
    vastgepind: r.vastgepind === true,
    op: op.toISOString(),
  }
}

/** Vastgepinde notities eerst, daarbinnen de nieuwste eerst. */
export function sorteerNotities(notities: readonly Notitie[]): Notitie[] {
  return [...notities].sort((a, b) => Number(b.vastgepind) - Number(a.vastgepind) || b.op.localeCompare(a.op))
}
