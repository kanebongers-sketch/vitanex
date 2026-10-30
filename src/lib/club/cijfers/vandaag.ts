// ─── Fit Factory Club: rekenwerk voor Vandaag (PUUR) ────────────────────────

import type { LidStatus } from '@/lib/club/kern/lid'
import { jarigOp, leeftijdOp } from './tijd'

/** Wie in de laatste zoveel minuten incheckte, telt als "nu binnen". */
export const BINNEN_MINUTEN = 90

export interface VandaagLid {
  id: string
  voornaam: string
  achternaam: string
  status: LidStatus
  lidSinds: string | null
  einddatum: string | null
  geboortedatum: string | null
  abonnement: string | null
  /** Versie van de profielfoto, of null. */
  foto?: string | null
}

export interface Verschil {
  verschil: number
  richting: 'meer' | 'minder' | 'gelijk'
}

export function verschil(nu: number, toen: number): Verschil {
  const v = nu - toen
  return { verschil: v, richting: v > 0 ? 'meer' : v < 0 ? 'minder' : 'gelijk' }
}

/**
 * Vergelijking met dezelfde weekdag vorige week tot hetzelfde tijdstip. Alleen
 * eerlijk als er die dag ook echt check-ins zijn geregistreerd; anders null.
 */
export function vergelijkMetVorigeWeek(nu: number, toenTotNu: number, toenHeleDag: number): Verschil | null {
  return toenHeleDag > 0 ? verschil(nu, toenTotNu) : null
}

export interface CheckinMoment {
  lidId: string | null
  op: Date
}

/** Hoeveel mensen checkten in de laatste `minuten` voor `nu` in (twee keer inchecken telt een keer). */
export function nuBinnen(checkins: readonly CheckinMoment[], nu: Date, minuten = BINNEN_MINUTEN): number {
  const grens = nu.getTime() - minuten * 60_000
  const binnen = checkins.filter((c) => c.op.getTime() >= grens && c.op.getTime() <= nu.getTime())
  const zonderId = binnen.filter((c) => c.lidId === null).length
  return new Set(binnen.flatMap((c) => (c.lidId ? [c.lidId] : []))).size + zonderId
}

/** Nieuwe leden en proefleden met lid sinds vanaf `maandag` tot en met vandaag. */
export function nieuwDezeWeek(leden: readonly VandaagLid[], maandag: string, vandaag: string): VandaagLid[] {
  return leden
    .filter((l) => l.lidSinds !== null && l.lidSinds >= maandag && l.lidSinds <= vandaag)
    .filter((l) => l.status === 'actief' || l.status === 'proef')
    .sort((a, b) => (b.lidSinds ?? '').localeCompare(a.lidSinds ?? ''))
}

export interface Jarige {
  lid: VandaagLid
  leeftijd: number | null
}

/** Leden die vandaag jarig zijn (niet gestopt). */
export function jarigen(leden: readonly VandaagLid[], vandaag: string): Jarige[] {
  return leden
    .filter((l) => l.status !== 'gestopt' && jarigOp(l.geboortedatum, vandaag))
    .map((lid) => ({ lid, leeftijd: leeftijdOp(lid.geboortedatum, vandaag) }))
}

export type LesFase = 'voorbij' | 'bezig' | 'straks'

export function lesFase(start: Date, eind: Date, nu: Date): LesFase {
  if (eind.getTime() <= nu.getTime()) return 'voorbij'
  return start.getTime() <= nu.getTime() ? 'bezig' : 'straks'
}
