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
  /** Versie van de profielfoto, of null. */
  foto?: string | null
  lidnummer: string | null
  status: LidStatus
  statusLabel: string
  magTrainen: boolean
  abonnement: string | null
  vestigingLabel: string
  /** Lid van een andere vestiging dan waar de balie staat. */
  andereVestiging: boolean
  /** Mag hier niet sporten: de vestiging laat alleen eigen leden binnen (alleen_eigen_leden, migratie 477). */
  geenToegang: boolean
  les: BalieLes | null
  /** Past niet bij de lidmaatschapsvorm (vestiging of daluren): de reden. Niet blokkeren, de balie beslist. */
  vormWaarschuwing: string | null
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
  /** Niet ingecheckt: het lidmaatschap laat dit niet toe. Opnieuw met toch = true checkt wel in. */
  | { soort: 'vorm_waarschuwing'; reden: string }

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
  if (v.soort === 'vorm_waarschuwing') return typeof v.reden === 'string'
  return v.soort === 'niet_actief' && typeof v.statusLabel === 'string'
}

/** Antwoord van GET /api/club/lid/checkin-code: de wisselende QR-code, of waarom er geen is. */
export type CheckinCodeAntwoord =
  | { soort: 'code'; beeld: string; naam: string; vakSec: number; vernieuwOverMs: number }
  | { soort: 'uit'; melding: string }

export function isCheckinCodeAntwoord(v: unknown): v is CheckinCodeAntwoord {
  if (!isObject(v)) return false
  if (v.soort === 'uit') return typeof v.melding === 'string'
  return v.soort === 'code' && typeof v.beeld === 'string' && v.beeld.startsWith('data:image/') && typeof v.naam === 'string'
    && typeof v.vakSec === 'number' && typeof v.vernieuwOverMs === 'number'
}

/** Wie er met de QR-code incheckte (voor het scherm; de voornaam voor de kiosk). */
export interface QrLid {
  id: string
  naam: string
  voornaam: string
  andereVestiging: boolean
  vestigingLabel: string
}

/** Antwoord van POST /api/club/checkin met { qr }: de uitkomst plus het lid uit de code. */
export type QrCheckinAntwoord = CheckinAntwoord & { lid: QrLid }

function isQrLid(v: unknown): v is QrLid {
  return isObject(v) && typeof v.id === 'string' && typeof v.naam === 'string' && typeof v.voornaam === 'string'
    && typeof v.andereVestiging === 'boolean' && typeof v.vestigingLabel === 'string'
}

export function isQrCheckinAntwoord(v: unknown): v is QrCheckinAntwoord {
  return isObject(v) && isQrLid(v.lid) && isCheckinAntwoord(v)
}
