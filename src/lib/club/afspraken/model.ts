// ─── Club, afspraken: typen en databaserijen (PUUR) ─────────────────────────
// Afspraken van een lid met een trainer: intake, personal training, meting.
// Tijden staan als UTC-tijdstip in de database; het scherm denkt in
// Nederlandse dagen en kloktijden (zie rooster/tijd.ts).

import { KLEUREN, type Kleur } from '@/lib/club/personeel/typen'
import { isVestigingSlug, type VestigingSleutel } from '@/lib/club/kern/vestigingen'

export { KLEUREN, KLEUR_LABEL, type Kleur } from '@/lib/club/personeel/typen'

export const AFSPRAAK_STATUSSEN = ['gepland', 'geweest', 'niet_gekomen', 'geannuleerd'] as const
export type AfspraakStatus = (typeof AFSPRAAK_STATUSSEN)[number]

export const STATUS_LABEL: Record<AfspraakStatus, string> = {
  gepland: 'Gepland',
  geweest: 'Geweest',
  niet_gekomen: 'Niet gekomen',
  geannuleerd: 'Geannuleerd',
}

export const GEBOEKT_DOOR = ['balie', 'trainer', 'app'] as const
export type GeboektDoor = (typeof GEBOEKT_DOOR)[number]

export const GEBOEKT_DOOR_LABEL: Record<GeboektDoor, string> = { balie: 'Balie', trainer: 'Trainer', app: 'Ledenapp' }

export interface AfspraakType {
  id: string
  naam: string
  duurMin: number
  bufferMin: number
  kleur: Kleur
  /** Leeg = elke trainer van de vestiging. */
  medewerkerIds: string[]
  appBoekbaar: boolean
  boekenUrenVooraf: number
  annulerenUrenVooraf: number
  actief: boolean
  volgorde: number
}

export interface Afspraak {
  id: string
  vestiging: VestigingSleutel
  typeId: string
  medewerkerId: string
  lidId: string
  leadId: string | null
  /** ISO-tijdstippen (UTC). */
  start: string
  eind: string
  bezetTot: string
  status: AfspraakStatus
  notitie: string | null
  geboektDoor: GeboektDoor
  demo: boolean
}

/** Een afspraak met de namen erbij, zoals het scherm hem toont. */
export interface AfspraakWeergave extends Afspraak {
  lidNaam: string
  typeNaam: string
  kleur: Kleur
}

type Rij = Record<string, unknown>

function alsRij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function getal(v: unknown, standaard: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : standaard
}

function iso(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

export function isKleur(v: unknown): v is Kleur {
  return typeof v === 'string' && (KLEUREN as readonly string[]).includes(v)
}

export function isStatus(v: unknown): v is AfspraakStatus {
  return typeof v === 'string' && (AFSPRAAK_STATUSSEN as readonly string[]).includes(v)
}

export const TYPE_KOLOMMEN = 'id, naam, duur_min, buffer_min, kleur, medewerker_ids, app_boekbaar, boeken_uren_vooraf, annuleren_uren_vooraf, actief, volgorde'

/** Systeemgrens: een rij uit club_afspraak_typen, of null. */
export function typeUitRij(ruw: unknown): AfspraakType | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || !tekst(r.naam)) return null
  const duur = getal(r.duur_min, 0)
  if (duur < 5) return null
  return {
    id: r.id,
    naam: String(r.naam),
    duurMin: duur,
    bufferMin: Math.max(0, getal(r.buffer_min, 0)),
    kleur: isKleur(r.kleur) ? r.kleur : 'amber',
    medewerkerIds: Array.isArray(r.medewerker_ids) ? r.medewerker_ids.filter((x): x is string => typeof x === 'string') : [],
    appBoekbaar: r.app_boekbaar !== false,
    boekenUrenVooraf: Math.max(0, getal(r.boeken_uren_vooraf, 0)),
    annulerenUrenVooraf: Math.max(0, getal(r.annuleren_uren_vooraf, 0)),
    actief: r.actief !== false,
    volgorde: getal(r.volgorde, 0),
  }
}

export const AFSPRAAK_KOLOMMEN = 'id, vestiging, type_id, medewerker_id, lid_id, lead_id, start_op, eind_op, bezet_tot, status, notitie, geboekt_door, demo'

/** Systeemgrens: een rij uit club_afspraken, of null. */
export function afspraakUitRij(ruw: unknown): Afspraak | null {
  const r = alsRij(ruw)
  if (!r) return null
  const start = iso(r.start_op)
  const eind = iso(r.eind_op)
  const bezetTot = iso(r.bezet_tot) ?? eind
  if (typeof r.id !== 'string' || typeof r.type_id !== 'string' || typeof r.medewerker_id !== 'string' || typeof r.lid_id !== 'string') return null
  if (!isVestigingSlug(r.vestiging) || !start || !eind || !bezetTot) return null
  return {
    id: r.id,
    vestiging: r.vestiging,
    typeId: r.type_id,
    medewerkerId: r.medewerker_id,
    lidId: r.lid_id,
    leadId: tekst(r.lead_id),
    start,
    eind,
    bezetTot,
    status: isStatus(r.status) ? r.status : 'gepland',
    notitie: tekst(r.notitie),
    geboektDoor: GEBOEKT_DOOR.find((g) => g === r.geboekt_door) ?? 'balie',
    demo: r.demo === true,
  }
}

/** Telt deze afspraak mee voor de bezetting? Geannuleerd niet. */
export function telt(a: Pick<Afspraak, 'status'>): boolean {
  return a.status !== 'geannuleerd'
}

/** Rijen naar typen; onbruikbare rijen vallen weg. */
export function rijen<T>(data: unknown, naar: (r: unknown) => T | null): T[] {
  return Array.isArray(data) ? data.map(naar).filter((x): x is T => x !== null) : []
}
