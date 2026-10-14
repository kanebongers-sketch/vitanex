// ─── Fit Factory Club: check-in, wat de API teruggeeft (PUUR) ───────────────
// Gedeeld tussen de API-routes en het baliescherm. Datums als ISO-tekst.

import type { LidStatus } from '@/lib/club/kern/lid'
import type { CheckinBron } from './regels'

export interface BalieLes {
  naam: string
  start: string
  status: string
  /** Telt een check-in nu voor deze les (wordt dan "aanwezig")? */
  inVenster: boolean
}

export interface BalieLid {
  id: string
  naam: string
  initialen: string
  lidnummer: string | null
  status: LidStatus
  statusLabel: string
  magTrainen: boolean
  abonnement: string | null
  vestigingLabel: string
  /** Lid van een andere vestiging dan waar de balie staat. */
  andereVestiging: boolean
  /** Mag hier niet sporten (lid van een andere club die in Eersel incheckt). */
  geenToegang: boolean
  les: BalieLes | null
  /** Al ingecheckt in de laatste 30 minuten? Dan de tijd daarvan. */
  dubbelSinds: string | null
}

export interface ZoekAntwoord {
  /** Precies gevonden op een code (QR, bandje, lidnummer). */
  exact: boolean
  bron: CheckinBron
  leden: BalieLid[]
}

export type CheckinAntwoord =
  | { soort: 'ingecheckt'; op: string; les: { naam: string; start: string } | null }
  | { soort: 'dubbel'; op: string }
  | { soort: 'niet_actief'; statusLabel: string }
  | { soort: 'geen_toegang'; vestigingLabel: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isBalieLid(v: unknown): v is BalieLid {
  return isObject(v) && typeof v.id === 'string' && typeof v.naam === 'string' && typeof v.magTrainen === 'boolean'
}

/** Systeemgrens in de browser: is dit een antwoord van /api/club/checkin/zoek? */
export function isZoekAntwoord(v: unknown): v is ZoekAntwoord {
  return isObject(v) && typeof v.exact === 'boolean' && typeof v.bron === 'string' && Array.isArray(v.leden) && v.leden.every(isBalieLid)
}

/** Systeemgrens in de browser: is dit een antwoord van POST /api/club/checkin? */
export function isCheckinAntwoord(v: unknown): v is CheckinAntwoord {
  if (!isObject(v)) return false
  if (v.soort === 'ingecheckt' || v.soort === 'dubbel') return typeof v.op === 'string'
  if (v.soort === 'geen_toegang') return typeof v.vestigingLabel === 'string'
  return v.soort === 'niet_actief' && typeof v.statusLabel === 'string'
}
