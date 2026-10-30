// ─── Club: opvolgtaken (PUUR) ───────────────────────────────────────────────
// Een opvolgtaak is een lid plus een aanleiding (regel) die het team oppakt:
// open, gedaan of overgeslagen. "Vervallen" zet Club zelf als de aanleiding
// niet meer klopt (het lid kwam weer, de score herstelde).

import { MEDEWERKER_ROLLEN, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { REGEL_SLEUTELS, isRegelSleutel, isUuid, type RegelSleutel, type Uitkomst, type Wie } from './regels'
import type { SjabloonWaarden } from './sjabloon'

export const TAAK_STATUSSEN = ['open', 'gedaan', 'overgeslagen', 'vervallen'] as const
export type TaakStatus = (typeof TAAK_STATUSSEN)[number]

export const TAAK_STATUS_LABEL: Record<TaakStatus, string> = {
  open: 'Open',
  gedaan: 'Gedaan',
  overgeslagen: 'Overgeslagen',
  vervallen: 'Vanzelf opgelost',
}

export const NOTITIE_MAX = 500

export interface TaakLid {
  voornaam: string
  achternaam: string
  telefoon: string | null
  email: string | null
  /** Versie van de profielfoto, of null. */
  foto?: string | null
}

export interface Taak {
  id: string
  lidId: string
  vestiging: string
  regel: RegelSleutel
  periode: string
  waarde: number | null
  reden: string
  status: TaakStatus
  wie: Wie
  notitie: string | null
  afgehandeldDoor: string | null
  afgehandeldOp: string | null
  aangemaaktOp: string
  lid: TaakLid | null
}

export const TAAK_KOLOMMEN =
  'id, lid_id, vestiging, regel, periode, waarde, reden, status, rol, medewerker_id, notitie, afgehandeld_door, afgehandeld_op, aangemaakt_op, club_leden(voornaam, achternaam, telefoon, email, profielfoto)'

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function isStatus(v: unknown): v is TaakStatus {
  return typeof v === 'string' && (TAAK_STATUSSEN as readonly string[]).includes(v)
}

function isRol(v: unknown): v is MedewerkerRol {
  return typeof v === 'string' && (MEDEWERKER_ROLLEN as readonly string[]).includes(v)
}

function lidUit(v: unknown): TaakLid | null {
  const r = Array.isArray(v) ? v[0] : v
  if (typeof r !== 'object' || r === null) return null
  const o = r as Record<string, unknown>
  const voornaam = tekst(o.voornaam)
  if (!voornaam) return null
  return { voornaam, achternaam: tekst(o.achternaam) ?? '', telefoon: tekst(o.telefoon), email: tekst(o.email), foto: tekst(o.profielfoto) }
}

function wieUit(r: Record<string, unknown>): Wie {
  if (isUuid(r.medewerker_id)) return { soort: 'medewerker', id: r.medewerker_id }
  if (isRol(r.rol)) return { soort: 'rol', rol: r.rol }
  return { soort: 'iedereen' }
}

/** Systeemgrens: een rij uit club_opvolgtaken (met het lid erbij) naar een Taak. */
export function taakUitRij(rij: unknown): Taak | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  const id = tekst(r.id)
  const lidId = tekst(r.lid_id)
  const vestiging = tekst(r.vestiging)
  if (!id || !lidId || !vestiging || !isRegelSleutel(r.regel)) return null
  return {
    id,
    lidId,
    vestiging,
    regel: r.regel,
    periode: tekst(r.periode) ?? '',
    waarde: typeof r.waarde === 'number' && Number.isFinite(r.waarde) ? r.waarde : null,
    reden: tekst(r.reden) ?? '',
    status: isStatus(r.status) ? r.status : 'open',
    wie: wieUit(r),
    notitie: tekst(r.notitie),
    afgehandeldDoor: tekst(r.afgehandeld_door),
    afgehandeldOp: tekst(r.afgehandeld_op),
    aangemaaktOp: tekst(r.aangemaakt_op) ?? '',
    lid: lidUit(r.club_leden),
  }
}

export interface RegelGroep {
  regel: RegelSleutel
  taken: Taak[]
}

/** Open taken per regel, in de vaste volgorde; binnen een groep de oudste eerst, dan op naam. */
export function groepeerPerRegel(taken: readonly Taak[]): RegelGroep[] {
  return REGEL_SLEUTELS.map((regel) => ({
    regel,
    taken: taken
      .filter((t) => t.regel === regel)
      .sort((a, b) => a.aangemaaktOp.localeCompare(b.aangemaaktOp) || (a.lid?.voornaam ?? '').localeCompare(b.lid?.voornaam ?? '', 'nl') || a.id.localeCompare(b.id)),
  })).filter((g) => g.taken.length > 0)
}

/** Aantal open taken per regel, voor Club Vandaag. Alleen regels met minstens een taak. */
export function telPerRegel(regels: readonly string[]): { regel: RegelSleutel; aantal: number }[] {
  const tel = new Map<RegelSleutel, number>()
  for (const r of regels) if (isRegelSleutel(r)) tel.set(r, (tel.get(r) ?? 0) + 1)
  return REGEL_SLEUTELS.filter((r) => tel.has(r)).map((regel) => ({ regel, aantal: tel.get(regel) ?? 0 }))
}

/** De waarden voor de voorbeeldtekst van een taak. */
export function sjabloonWaarden(taak: Pick<Taak, 'regel' | 'waarde' | 'lid'>, vestigingNaam: string): SjabloonWaarden {
  const dagen = taak.regel === 'welkom' || taak.regel === 'proefles_opvolgen' || taak.regel === 'niet_gezien' ? taak.waarde : null
  return {
    voornaam: taak.lid?.voornaam ?? null,
    vestiging: vestigingNaam,
    dagen,
    bezoeken: taak.regel === 'mijlpaal' ? taak.waarde : null,
  }
}

export type TaakActie = { soort: 'gedaan' | 'overgeslagen' | 'heropen'; notitie: string | null | undefined } | { soort: 'notitie'; notitie: string | null }

function leesNotitie(v: unknown): string | null | undefined | false {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v !== 'string') return false
  const schoon = v.trim()
  if (schoon.length > NOTITIE_MAX) return false
  return schoon === '' ? null : schoon
}

/** Systeemgrens: de body van PATCH /api/club/automatisering/taken/[id]. */
export function leesTaakActie(ruw: unknown): Uitkomst<TaakActie> {
  if (typeof ruw !== 'object' || ruw === null) return { ok: false, fout: 'Onleesbare invoer.' }
  const r = ruw as Record<string, unknown>
  const notitie = leesNotitie(r.notitie)
  if (notitie === false) return { ok: false, fout: `Een notitie is hoogstens ${NOTITIE_MAX} tekens.` }
  if (r.actie === 'notitie') return { ok: true, waarde: { soort: 'notitie', notitie: notitie ?? null } }
  if (r.actie === 'gedaan' || r.actie === 'overgeslagen' || r.actie === 'heropen') return { ok: true, waarde: { soort: r.actie, notitie } }
  return { ok: false, fout: 'Onbekende actie.' }
}

/** De kolommen die een actie verandert. */
export function actieNaarWijziging(actie: TaakActie, wie: string, nu: Date): Record<string, string | null> {
  const notitie: Record<string, string | null> = actie.notitie === undefined ? {} : { notitie: actie.notitie }
  if (actie.soort === 'notitie') return { ...notitie }
  if (actie.soort === 'heropen') return { ...notitie, status: 'open', afgehandeld_door: null, afgehandeld_op: null }
  return { ...notitie, status: actie.soort, afgehandeld_door: wie.slice(0, 80), afgehandeld_op: nu.toISOString() }
}
