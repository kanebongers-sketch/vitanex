// ─── Fit Factory Club: check-in regels (PUUR) ───────────────────────────────
// Wat de balie mag en doet bij een check-in:
// - Alleen leden die mogen trainen (actief, proef, opgezegd tot de einddatum).
// - Dubbel inchecken binnen 30 minuten telt niet opnieuw (scanner twee keer, of
//   lid dat even naar de auto liep).
// - Wie incheckt binnen het check-in venster (club_vestigingen.regels,
//   standaard 15 minuten) voor een geboekte les, staat op "aanwezig". Wie tot
//   10 minuten te laat binnenkomt telt ook nog.
// - "Nu binnen" is een schatting: we hebben geen uitcheck, dus iedereen die in
//   de laatste 90 minuten incheckte.

import { magTrainen, type LidStatus } from '@/lib/club/kern/lid'
import type { CheckinRij, LidReservering } from '@/lib/club/leden/rijen'

export const DUBBEL_MIN = 30
export const NU_BINNEN_MIN = 90
export const STANDAARD_VENSTER_MIN = 15
export const MAX_VENSTER_MIN = 120
export const TE_LAAT_MIN = 10
export const LAATSTE_AANTAL = 10

const MIN = 60_000

export type CheckinBron = 'balie' | 'qr' | 'bandje'
export type MatchVeld = 'qr_token' | 'sportivity_id' | 'lidnummer' | 'naam'

/** Het venster uit club_vestigingen.regels (jsonb), of de standaard. */
export function leesVenster(regels: unknown): number {
  if (typeof regels !== 'object' || regels === null || Array.isArray(regels)) return STANDAARD_VENSTER_MIN
  const waarde = (regels as Record<string, unknown>).checkin_venster_min
  if (typeof waarde !== 'number' || !Number.isFinite(waarde)) return STANDAARD_VENSTER_MIN
  return Math.min(MAX_VENSTER_MIN, Math.max(0, Math.round(waarde)))
}

/** Is er binnen `min` minuten voor `nu` al ingecheckt? */
export function isDubbel(laatste: Date | null, nu: Date, min = DUBBEL_MIN): boolean {
  if (!laatste) return false
  const verschil = nu.getTime() - laatste.getTime()
  return verschil >= -MIN && verschil < min * MIN
}

/**
 * De geboekte les waarvoor deze check-in telt: begint binnen het venster of is
 * hooguit 10 minuten bezig. Bij meer kandidaten de vroegste.
 */
export function lesInVenster(reserveringen: readonly LidReservering[], nu: Date, vensterMin: number): LidReservering | null {
  const t = nu.getTime()
  const kandidaten = reserveringen.filter((r) => {
    if (r.status !== 'geboekt' || r.lesGeannuleerd) return false
    const start = r.start.getTime()
    return t >= start - vensterMin * MIN && t <= start + TE_LAAT_MIN * MIN
  })
  return kandidaten.sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null
}

const TELT_VOOR_VANDAAG: readonly string[] = ['geboekt', 'wachtlijst', 'aanwezig']

/** De les die dit lid vandaag heeft: de eerstvolgende die nog niet voorbij is, anders de laatste. */
export function lesVandaag(reserveringen: readonly LidReservering[], nu: Date): LidReservering | null {
  const geldig = reserveringen
    .filter((r) => TELT_VOOR_VANDAAG.includes(r.status) && !r.lesGeannuleerd)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  return geldig.find((r) => r.eind.getTime() >= nu.getTime()) ?? geldig[geldig.length - 1] ?? null
}

/** Welke bron een check-in krijgt, naar het veld waarop het lid gevonden is. */
export function bronVoorMatch(veld: MatchVeld): CheckinBron {
  if (veld === 'qr_token') return 'qr'
  if (veld === 'sportivity_id') return 'bandje'
  return 'balie'
}

/** Lijkt de invoer op een gescande code (geen spaties, letters/cijfers)? */
export function isCode(invoer: string): boolean {
  return /^[A-Za-z0-9_-]{2,64}$/.test(invoer.trim())
}

/**
 * Mag een lid van `lidVestiging` sporten in `balieVestiging`? Regel van
 * fitfactory.nl: leden van Eersel sporten bij alle clubs, leden van een andere
 * club bij alle clubs behalve Eersel.
 */
export function magInVestiging(lidVestiging: string, balieVestiging: string): boolean {
  return balieVestiging !== 'eersel' || lidVestiging === 'eersel'
}

export type CheckinBesluit =
  | { soort: 'mag' }
  | { soort: 'niet_actief'; status: LidStatus }
  | { soort: 'geen_toegang' }
  | { soort: 'dubbel'; op: Date }

export function beoordeelCheckin(status: LidStatus, laatste: Date | null, nu: Date, toegang = true): CheckinBesluit {
  if (!magTrainen(status)) return { soort: 'niet_actief', status }
  if (!toegang) return { soort: 'geen_toegang' }
  if (laatste && isDubbel(laatste, nu)) return { soort: 'dubbel', op: laatste }
  return { soort: 'mag' }
}

export interface DagSamenvatting {
  vandaag: number
  /** Een rij per lid (de nieuwste check-in), nieuwste eerst. */
  binnen: CheckinRij[]
  laatste: CheckinRij[]
}

/** Uit de check-ins van vandaag: de teller, wie er (waarschijnlijk) binnen is en de laatste tien. */
export function vatDagSamen(checkins: readonly CheckinRij[], nu: Date): DagSamenvatting {
  const nieuwsteEerst = [...checkins].sort((a, b) => b.op.getTime() - a.op.getTime())
  const grens = nu.getTime() - NU_BINNEN_MIN * MIN
  const gezien = new Set<string>()
  const binnen = nieuwsteEerst.filter((c) => {
    if (c.op.getTime() < grens || c.op.getTime() > nu.getTime() + MIN || gezien.has(c.lidId)) return false
    gezien.add(c.lidId)
    return true
  })
  return { vandaag: checkins.length, binnen, laatste: nieuwsteEerst.slice(0, LAATSTE_AANTAL) }
}

const BRONNEN: readonly CheckinBron[] = ['balie', 'qr', 'bandje']

export interface CheckinInvoer {
  lidId: string
  vestiging: string
  bron: CheckinBron
}

/** Systeemgrens: het verzoek van het baliescherm. De vestiging controleert de route. */
export function leesCheckinInvoer(body: unknown): CheckinInvoer | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const o = body as Record<string, unknown>
  if (typeof o.lidId !== 'string' || !/^[0-9a-f-]{36}$/i.test(o.lidId)) return null
  if (typeof o.vestiging !== 'string') return null
  const bron = BRONNEN.find((b) => b === o.bron) ?? 'balie'
  return { lidId: o.lidId, vestiging: o.vestiging, bron }
}
