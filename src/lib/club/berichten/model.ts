// ─── Club: nieuws en berichten aan leden, het model (PUUR) ─────────────────
// Een bericht staat in de ledenapp op Home. Doelgroep: vestigingen (leeg =
// alle), lidstatussen (leeg = iedereen) en optioneel een tag. Zichtbaar van
// `zichtbaarVan` tot `zichtbaarTot` (null = geen einde).

import { LID_STATUSSEN, type LidStatus } from '@/lib/club/kern/lid'
import { isVestigingSlug } from '@/lib/club/kern/vestigingen'

export const TITEL_MAX = 80
export const TEKST_MAX = 2000
export const TAG_MAX = 40

export const SOORTEN = ['nieuws', 'actie', 'belangrijk'] as const
export type BerichtSoort = (typeof SOORTEN)[number]

export const SOORT_LABEL: Record<BerichtSoort, string> = {
  nieuws: 'Nieuws',
  actie: 'Actie',
  belangrijk: 'Belangrijk',
}

/** De statuskleur per soort: chip-variant uit club.css. */
export const SOORT_CHIP: Record<BerichtSoort, 'info' | 'ok' | 'let-op'> = {
  nieuws: 'info',
  actie: 'ok',
  belangrijk: 'let-op',
}

export interface Bericht {
  id: string
  titel: string
  tekst: string
  soort: BerichtSoort
  /** Leeg = alle vestigingen. */
  vestigingen: string[]
  /** Leeg = alle leden. */
  statussen: LidStatus[]
  tag: string | null
  zichtbaarVan: string
  zichtbaarTot: string | null
  vastgepind: boolean
  aangemaaktDoor: string | null
  aangemaaktOp: string
  demo: boolean
  /** De medewerker die het schreef, als die een profielfoto heeft (op naam gevonden; alleen in Club). */
  auteurFoto?: { id: string; versie: string } | null
}

export const BERICHT_KOLOMMEN =
  'id, titel, tekst, soort, vestigingen, statussen, tag, zichtbaar_van, zichtbaar_tot, vastgepind, aangemaakt_door, aangemaakt_op, demo'

export function isSoort(v: unknown): v is BerichtSoort {
  return typeof v === 'string' && (SOORTEN as readonly string[]).includes(v)
}

export function isLidStatus(v: unknown): v is LidStatus {
  return typeof v === 'string' && (LID_STATUSSEN as readonly string[]).includes(v)
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function isMoment(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v))
}

/** Systeemgrens: een databaserij naar een Bericht, of null als de rij onbruikbaar is. */
export function berichtUitRij(rij: unknown): Bericht | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.titel !== 'string' || !isMoment(r.zichtbaar_van)) return null
  const vestigingen = Array.isArray(r.vestigingen) ? r.vestigingen.filter(isVestigingSlug) : []
  const statussen = Array.isArray(r.statussen) ? r.statussen.filter(isLidStatus) : []
  return {
    id: r.id,
    titel: r.titel,
    tekst: typeof r.tekst === 'string' ? r.tekst : '',
    soort: isSoort(r.soort) ? r.soort : 'nieuws',
    vestigingen,
    statussen,
    tag: tekstOfNull(r.tag),
    zichtbaarVan: new Date(r.zichtbaar_van).toISOString(),
    zichtbaarTot: isMoment(r.zichtbaar_tot) ? new Date(r.zichtbaar_tot).toISOString() : null,
    vastgepind: r.vastgepind === true,
    aangemaaktDoor: tekstOfNull(r.aangemaakt_door),
    aangemaaktOp: isMoment(r.aangemaakt_op) ? new Date(r.aangemaakt_op).toISOString() : new Date(r.zichtbaar_van).toISOString(),
    demo: r.demo === true,
  }
}

/** Het bericht uit een API-antwoord ({ bericht }), of null. */
export function leesBerichtAntwoord(data: unknown): Bericht | null {
  if (typeof data !== 'object' || data === null || !('bericht' in data)) return null
  return berichtUitRij(dbVorm((data as { bericht: unknown }).bericht))
}

/** Een Bericht (camelCase, uit de API) terug naar de rijvorm, zodat berichtUitRij hem kan controleren. */
function dbVorm(v: unknown): unknown {
  if (typeof v !== 'object' || v === null) return null
  const b = v as Record<string, unknown>
  return {
    id: b.id,
    titel: b.titel,
    tekst: b.tekst,
    soort: b.soort,
    vestigingen: b.vestigingen,
    statussen: b.statussen,
    tag: b.tag,
    zichtbaar_van: b.zichtbaarVan,
    zichtbaar_tot: b.zichtbaarTot,
    vastgepind: b.vastgepind,
    aangemaakt_door: b.aangemaaktDoor,
    aangemaakt_op: b.aangemaaktOp,
    demo: b.demo,
  }
}
