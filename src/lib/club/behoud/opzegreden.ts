// ─── Club, behoud: waarom een lid opzegt of stopt (PUUR) ────────────────────
// Bij opzeggen of stoppen op de ledenkaart kiest de balie verplicht een reden
// uit een vaste lijst, met een optionele toelichting. Zo staan de cijfers over
// behoud later op echte gegevens. Tabel club_lid_opzeggingen (migratie 482).
//
// Gezondheid: alleen de categorie, nooit details. Een toelichting bij die reden
// gaat niet mee (de database weigert hem ook).

import type { LidStatus } from '@/lib/club/kern/lid'

export const OPZEG_REDENEN = [
  'prijs',
  'verhuizing',
  'tijd',
  'gezondheid',
  'begeleiding',
  'faciliteiten',
  'andere_sportschool',
  'doel_bereikt',
  'anders',
] as const
export type OpzegReden = (typeof OPZEG_REDENEN)[number]

export const TOELICHTING_MAX = 300

export interface OpzegInvoer {
  reden: OpzegReden
  /** Null bij gezondheid of als er niets is ingevuld. */
  toelichting: string | null
}

export function isOpzegReden(v: unknown): v is OpzegReden {
  return typeof v === 'string' && (OPZEG_REDENEN as readonly string[]).includes(v)
}

/** Bij deze reden mag er geen toelichting bij (bijzondere persoonsgegevens). */
export function zonderToelichting(reden: OpzegReden): boolean {
  return reden === 'gezondheid'
}

const WEG: readonly LidStatus[] = ['opgezegd', 'gestopt']

/**
 * Vraagt deze statuswissel een opzegreden? Ja zodra een lid van een lopende
 * status (proef, actief, gepauzeerd) naar opgezegd of gestopt gaat. Van
 * opgezegd naar gestopt staat de reden er al.
 */
export function vraagtOpzegReden(oud: LidStatus, nieuw: LidStatus): boolean {
  return WEG.includes(nieuw) && !WEG.includes(oud)
}

export type OpzegUitslag = { ok: true; waarde: OpzegInvoer } | { ok: false; fout: 'geenReden' | 'teLang' }

/** Systeemgrens: de opzegreden uit de body van PATCH /api/club/leden/[id]. */
export function leesOpzegReden(ruw: unknown): OpzegUitslag {
  if (typeof ruw !== 'object' || ruw === null || Array.isArray(ruw)) return { ok: false, fout: 'geenReden' }
  const r = ruw as Record<string, unknown>
  if (!isOpzegReden(r.reden)) return { ok: false, fout: 'geenReden' }
  const tekst = typeof r.toelichting === 'string' ? r.toelichting.trim().replace(/\s+/g, ' ') : ''
  if (tekst.length > TOELICHTING_MAX) return { ok: false, fout: 'teLang' }
  const toelichting = zonderToelichting(r.reden) || tekst === '' ? null : tekst
  return { ok: true, waarde: { reden: r.reden, toelichting } }
}

/** De actie waaronder de reden wordt bewaard. */
export function opzegActie(nieuw: LidStatus): 'opzeggen' | 'stoppen' {
  return nieuw === 'opgezegd' ? 'opzeggen' : 'stoppen'
}
