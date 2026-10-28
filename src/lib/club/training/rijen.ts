// ─── Fit Factory Club, training: databaserijen naar typen (PUUR) ────────────
// Systeemgrens: alles wat uit Supabase komt wordt hier genarrowd. Een rij die
// niet klopt wordt null en valt weg, in plaats van de pagina te breken.

import { BEELD_KOLOMMEN, beeldenUitRij, type OefeningBeelden } from './beeld'
import { isBlenderOefening, isGearchiveerd } from './blender-bibliotheek'
import type { GelogdeSet } from './progressie'
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
  /**
   * Kiesbaar: actief in de bibliotheek en niet gearchiveerd. Een gearchiveerde
   * oefening (migratie 465) staat hier altijd op false.
   */
  actief: boolean
  /** Oude standaardoefening zonder Blender-render: alleen leesbaar in bestaande schema's (migratie 465). */
  gearchiveerd: boolean
  /**
   * Oude illustratie (RepDB of Everkinetic), of null. Altijd null bij een
   * oefening met een eigen Blender-render: die toont de render (render-bron.ts).
   */
  beeld: OefeningBeelden | null
}

export const OEFENING_KOLOMMEN = `id, naam, spiergroep, spieren_primair, spieren_secundair, materiaal, niveau, patroon, belast, uitleg, aandachtspunten, actief, gearchiveerd, ${BEELD_KOLOMMEN}`

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
  /** Superset of circuit: zelfde nummer, direct na elkaar (migratie 443). */
  groep: number | null
  /** Tijd per set in seconden, in plaats van herhalingen. */
  tijdSec: number | null
  rpe: number | null
  rir: number | null
  /** Vier tekens, bijvoorbeeld 3110 (omlaag, onder, omhoog, boven). */
  tempo: string | null
}

export const REGEL_KOLOMMEN = 'id, dag, volgorde, oefening_id, sets, herhalingen, gewicht_kg, rust_sec, notitie, groep, tijd_sec, rpe, rir, tempo'

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
  /** Gemaakt uit de basisset (sleutel van het startschema), anders null. */
  basisSleutel: string | null
}

export const SCHEMA_KOLOMMEN =
  'id, lid_id, naam, doel, niveau, weken, medewerker_id, status, notitie, dag_titels, bijgewerkt_op, basis_sleutel, club_leden(voornaam, achternaam)'

export interface LogRegel {
  id: string
  schemaId: string | null
  dag: number | null
  op: string
  aantalOefeningen: number
  /** Duur van "start" tot "training klaar" (alleen als het lid de sets logde). */
  duurSec: number | null
}

type Rij = Record<string, unknown>

export function isRij(v: unknown): v is Rij {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

export function getalOfNull(v: unknown): number | null {
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

/** Het oude beeld van een oefening; null als er een eigen Blender-render is. */
export function oudBeeldUitRij(naam: string, rij: Record<string, unknown>): OefeningBeelden | null {
  return isBlenderOefening(naam) ? null : beeldenUitRij(rij)
}

export function oefeningUitRij(rij: unknown): Oefening | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const naam = tekstOfNull(rij.naam)
  if (!id || !naam || !isSpiergroep(rij.spiergroep)) return null
  const gearchiveerd = isGearchiveerd(naam, rij.gearchiveerd)
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
    actief: rij.actief !== false && !gearchiveerd,
    gearchiveerd,
    beeld: oudBeeldUitRij(naam, rij),
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
    groep: getalOfNull(rij.groep),
    tijdSec: getalOfNull(rij.tijd_sec),
    rpe: getalOfNull(rij.rpe),
    rir: getalOfNull(rij.rir),
    tempo: tekstOfNull(rij.tempo),
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
    basisSleutel: tekstOfNull(rij.basis_sleutel),
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
    duurSec: getalOfNull(rij.duur_sec),
  }
}

/** Een rij uit club_set_logs, met de oefening erbij. */
export function setUitRij(rij: unknown): { oefeningId: string; set: GelogdeSet } | null {
  if (!isRij(rij)) return null
  const oefeningId = tekstOfNull(rij.oefening_id)
  const trainingId = tekstOfNull(rij.trainingslog_id)
  const op = tekstOfNull(rij.op)
  const setNr = getalOfNull(rij.set_nr)
  if (!oefeningId || !trainingId || !op || setNr === null) return null
  return {
    oefeningId,
    set: { trainingId, op, setNr, herhalingen: getalOfNull(rij.herhalingen), gewichtKg: getalOfNull(rij.gewicht_kg), tijdSec: getalOfNull(rij.tijd_sec) },
  }
}
