// ─── Fit Factory Club, training: databaserijen naar typen (PUUR) ────────────
// Systeemgrens: alles wat uit Supabase komt wordt hier genarrowd. Een rij die
// niet klopt wordt null en valt weg, in plaats van de pagina te breken.

import { BEELD_KOLOMMEN, beeldenUitRij, type OefeningBeelden } from './beeld'
import { schoonSpieren, type Spier } from './spieren'
import {
  isDoel, isMateriaal, isNiveau, isPatroon, isSchemaStatus, isSpiergroep, isZone,
  type Doel, type Materiaal, type Niveau, type Patroon, type SchemaStatus, type Spiergroep, type Zone,
} from './typen'

export interface Oefening {
  id: string
  naam: string
  spiergroep: Spiergroep
  /** Waar de oefening vooral op werkt (migratie 394). Leeg als nog niet ingevuld. */
  spierenPrimair: Spier[]
  /** Spieren die meewerken. */
  spierenSecundair: Spier[]
  materiaal: Materiaal
  niveau: Niveau
  patroon: Patroon | null
  belast: Zone[]
  uitleg: string | null
  aandachtspunten: string | null
  actief: boolean
  /** Begin- en eindhouding (Everkinetic), of null. */
  beeld: OefeningBeelden | null
}

export const OEFENING_KOLOMMEN = `id, naam, spiergroep, spieren_primair, spieren_secundair, materiaal, niveau, patroon, belast, uitleg, aandachtspunten, actief, ${BEELD_KOLOMMEN}`

export interface SchemaRegel {
  id: string
  dag: number
  volgorde: number
  oefeningId: string
  sets: number | null
  herhalingen: string | null
  gewichtKg: number | null
  rustSec: number | null
  notitie: string | null
}

export const REGEL_KOLOMMEN = 'id, dag, volgorde, oefening_id, sets, herhalingen, gewicht_kg, rust_sec, notitie'

export interface SchemaKop {
  id: string
  lidId: string | null
  lidNaam: string | null
  naam: string
  doel: Doel | null
  niveau: Niveau
  weken: number | null
  medewerkerId: string | null
  status: SchemaStatus
  notitie: string | null
  dagTitels: string[]
  bijgewerktOp: string
}

export const SCHEMA_KOLOMMEN =
  'id, lid_id, naam, doel, niveau, weken, medewerker_id, status, notitie, dag_titels, bijgewerkt_op, club_leden(voornaam, achternaam)'

export interface LogRegel {
  id: string
  schemaId: string | null
  dag: number | null
  op: string
  aantalOefeningen: number
}

type Rij = Record<string, unknown>

export function isRij(v: unknown): v is Rij {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function getalOfNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

/** De naam uit een ingebedde club_leden-relatie (object of array van een). */
export function naamUitRelatie(v: unknown): string | null {
  const r = Array.isArray(v) ? v[0] : v
  if (!isRij(r)) return null
  const voornaam = tekstOfNull(r.voornaam)
  const achternaam = tekstOfNull(r.achternaam)
  return voornaam && achternaam ? `${voornaam} ${achternaam}` : null
}

/** Primair en secundair uit de rij; een spier die in beide staat telt alleen als primair. */
export function spierenUitRij(rij: Record<string, unknown>): { spierenPrimair: Spier[]; spierenSecundair: Spier[] } {
  const spierenPrimair = schoonSpieren(rij.spieren_primair)
  return { spierenPrimair, spierenSecundair: schoonSpieren(rij.spieren_secundair).filter((s) => !spierenPrimair.includes(s)) }
}

export function oefeningUitRij(rij: unknown): Oefening | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const naam = tekstOfNull(rij.naam)
  if (!id || !naam || !isSpiergroep(rij.spiergroep)) return null
  return {
    id,
    naam,
    spiergroep: rij.spiergroep,
    ...spierenUitRij(rij),
    materiaal: isMateriaal(rij.materiaal) ? rij.materiaal : 'overig',
    niveau: isNiveau(rij.niveau) ? rij.niveau : 1,
    patroon: isPatroon(rij.patroon) ? rij.patroon : null,
    belast: Array.isArray(rij.belast) ? rij.belast.filter(isZone) : [],
    uitleg: tekstOfNull(rij.uitleg),
    aandachtspunten: tekstOfNull(rij.aandachtspunten),
    actief: rij.actief !== false,
    beeld: beeldenUitRij(rij),
  }
}

export function regelUitRij(rij: unknown): SchemaRegel | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const oefeningId = tekstOfNull(rij.oefening_id)
  const dag = getalOfNull(rij.dag)
  if (!id || !oefeningId || dag === null) return null
  return {
    id,
    dag,
    volgorde: getalOfNull(rij.volgorde) ?? 0,
    oefeningId,
    sets: getalOfNull(rij.sets),
    herhalingen: tekstOfNull(rij.herhalingen),
    gewichtKg: getalOfNull(rij.gewicht_kg),
    rustSec: getalOfNull(rij.rust_sec),
    notitie: tekstOfNull(rij.notitie),
  }
}

export function schemaUitRij(rij: unknown): SchemaKop | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const naam = tekstOfNull(rij.naam)
  if (!id || !naam) return null
  return {
    id,
    lidId: tekstOfNull(rij.lid_id),
    lidNaam: naamUitRelatie(rij.club_leden),
    naam,
    doel: isDoel(rij.doel) ? rij.doel : null,
    niveau: isNiveau(rij.niveau) ? rij.niveau : 1,
    weken: getalOfNull(rij.weken),
    medewerkerId: tekstOfNull(rij.medewerker_id),
    status: isSchemaStatus(rij.status) ? rij.status : 'concept',
    notitie: tekstOfNull(rij.notitie),
    dagTitels: Array.isArray(rij.dag_titels) ? rij.dag_titels.map((t) => (typeof t === 'string' ? t : '')) : [],
    bijgewerktOp: tekstOfNull(rij.bijgewerkt_op) ?? '',
  }
}

export function logUitRij(rij: unknown): LogRegel | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const op = tekstOfNull(rij.op)
  if (!id || !op) return null
  return {
    id,
    schemaId: tekstOfNull(rij.schema_id),
    dag: getalOfNull(rij.dag),
    op,
    aantalOefeningen: Array.isArray(rij.uitgevoerd) ? rij.uitgevoerd.length : 0,
  }
}
