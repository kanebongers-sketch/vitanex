// ─── Club, Prikbord: rijen uit de database naar het model (PUUR) ────────────
// Vergevingsgezind lezen: een rij die niet klopt valt weg, een lijst die geen
// lijst is wordt leeg.

import { isUuid } from '@/lib/club/kern/organisatie'
import { isRol, type Rol } from '@/lib/club/rollen/typen'
import { isWerkwijzeSoort, type Gelezen, type Mededeling, type Stap, type Uitvoering, type Werkwijze } from './typen'

export const MEDEDELING_KOLOMMEN = 'id, titel, inhoud, vestigingen, rollen, verplicht, soort, werkwijze_id, werkwijze_versie, door_profiel, geplaatst_op, verloopt_op, gearchiveerd'
export const GELEZEN_KOLOMMEN = 'mededeling_id, profiel_id, gelezen_op, bevestigd_op'
export const WERKWIJZE_KOLOMMEN = 'id, titel, soort, vestigingen, rollen, versie, takenlijst_id, bron_notitie_id, gearchiveerd, bijgewerkt_op'
export const VERSIE_KOLOMMEN = 'werkwijze_id, versie, stappen, wat_anders'
export const UITVOERING_KOLOMMEN = 'id, werkwijze_id, versie, vestiging, profiel_id, gestart_op, afgerond_op, afgevinkt, notitie, lid_id'

type Rij = Record<string, unknown>

function rij(v: unknown): Rij | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Rij) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function teksten(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function rollen(v: unknown): Rol[] {
  return Array.isArray(v) ? v.filter(isRol) : []
}

function geheel(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) ? v : null
}

export function mededelingUitRij(ruw: unknown): Mededeling | null {
  const r = rij(ruw)
  const id = r ? tekst(r.id) : null
  const titel = r ? tekst(r.titel) : null
  const geplaatstOp = r ? tekst(r.geplaatst_op) : null
  if (!r || !id || !titel || !geplaatstOp) return null
  const soort = r.soort === 'wijziging' ? 'wijziging' : 'mededeling'
  return {
    id,
    titel,
    inhoud: tekst(r.inhoud) ?? '',
    vestigingen: teksten(r.vestigingen),
    rollen: rollen(r.rollen),
    verplicht: r.verplicht === true,
    soort,
    werkwijzeId: isUuid(r.werkwijze_id) ? r.werkwijze_id : null,
    werkwijzeVersie: geheel(r.werkwijze_versie),
    doorProfiel: isUuid(r.door_profiel) ? r.door_profiel : null,
    geplaatstOp,
    verlooptOp: tekst(r.verloopt_op),
    gearchiveerd: r.gearchiveerd === true,
  }
}

export function gelezenUitRij(ruw: unknown): Gelezen | null {
  const r = rij(ruw)
  if (!r || !isUuid(r.mededeling_id) || !isUuid(r.profiel_id) || typeof r.gelezen_op !== 'string') return null
  return { mededelingId: r.mededeling_id, profielId: r.profiel_id, gelezenOp: r.gelezen_op, bevestigdOp: tekst(r.bevestigd_op) }
}

export function stappenUitJson(v: unknown): Stap[] {
  if (!Array.isArray(v)) return []
  return v.flatMap((s) => {
    const o = rij(s)
    const t = o ? tekst(o.tekst) : null
    return t ? [{ tekst: t, uitleg: o ? tekst(o.uitleg) : null }] : []
  })
}

export interface VersieRij {
  werkwijzeId: string
  versie: number
  stappen: Stap[]
  watAnders: string | null
}

export function versieUitRij(ruw: unknown): VersieRij | null {
  const r = rij(ruw)
  const versie = r ? geheel(r.versie) : null
  if (!r || !isUuid(r.werkwijze_id) || versie === null) return null
  return { werkwijzeId: r.werkwijze_id, versie, stappen: stappenUitJson(r.stappen), watAnders: tekst(r.wat_anders) }
}

/** Een werkwijze met de stappen van de huidige versie; zonder die versie valt hij weg. */
export function werkwijzeUitRij(ruw: unknown, versies: readonly VersieRij[]): Werkwijze | null {
  const r = rij(ruw)
  const id = r ? tekst(r.id) : null
  const titel = r ? tekst(r.titel) : null
  const versie = r ? geheel(r.versie) : null
  if (!r || !id || !titel || versie === null) return null
  const huidig = versies.find((v) => v.werkwijzeId === id && v.versie === versie)
  if (!huidig || huidig.stappen.length === 0) return null
  return {
    id,
    titel,
    soort: isWerkwijzeSoort(r.soort) ? r.soort : 'eigen',
    vestigingen: teksten(r.vestigingen),
    rollen: rollen(r.rollen),
    versie,
    takenlijstId: isUuid(r.takenlijst_id) ? r.takenlijst_id : null,
    bronNotitieId: isUuid(r.bron_notitie_id) ? r.bron_notitie_id : null,
    gearchiveerd: r.gearchiveerd === true,
    bijgewerktOp: tekst(r.bijgewerkt_op) ?? '',
    stappen: huidig.stappen,
    watAnders: huidig.watAnders,
  }
}

export function uitvoeringUitRij(ruw: unknown): Uitvoering | null {
  const r = rij(ruw)
  const versie = r ? geheel(r.versie) : null
  if (!r || !isUuid(r.id) || !isUuid(r.werkwijze_id) || versie === null || typeof r.vestiging !== 'string' || typeof r.gestart_op !== 'string') return null
  return {
    id: r.id,
    werkwijzeId: r.werkwijze_id,
    versie,
    vestiging: r.vestiging,
    profielId: isUuid(r.profiel_id) ? r.profiel_id : null,
    gestartOp: r.gestart_op,
    afgerondOp: tekst(r.afgerond_op),
    afgevinkt: Array.isArray(r.afgevinkt) ? r.afgevinkt.filter((n): n is number => Number.isInteger(n)) : [],
    notitie: tekst(r.notitie),
    lidId: isUuid(r.lid_id) ? r.lid_id : null,
  }
}

