// ─── Fit Factory Club: rekenwerk voor Vandaag (PUUR) ────────────────────────

import type { LidStatus } from '@/lib/club/kern/lid'
import { dagenTussen, dagSleutel, jarigOp, leeftijdOp } from './tijd'

/** Na zoveel dagen zonder bezoek staat een actief lid op de risicolijst. */
export const RISICO_DAGEN = 21
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
}

export interface Verschil {
  verschil: number
  richting: 'meer' | 'minder' | 'gelijk'
}

export function verschil(nu: number, toen: number): Verschil {
  const v = nu - toen
  return { verschil: v, richting: v > 0 ? 'meer' : v < 0 ? 'minder' : 'gelijk' }
}

/** Hoeveel check-ins vielen binnen de laatste `minuten` voor `nu`. */
export function nuBinnen(checkins: readonly Date[], nu: Date, minuten = BINNEN_MINUTEN): number {
  const grens = nu.getTime() - minuten * 60_000
  return checkins.filter((d) => d.getTime() >= grens && d.getTime() <= nu.getTime()).length
}

export interface RisicoLid {
  lid: VandaagLid
  /** Dagen sinds het laatste bezoek, of null als we geen bezoek kennen. */
  dagenWeg: number | null
}

/**
 * Actieve leden (status actief) die al `drempel` dagen of langer niet zijn
 * geweest. Wie nog nooit kwam, telt mee als hij al langer dan de drempel lid is.
 * Langst weg eerst; "nooit geweest" bovenaan.
 */
export function risicoLeden(
  leden: readonly VandaagLid[],
  laatsteBezoek: ReadonlyMap<string, Date>,
  vandaag: string,
  drempel = RISICO_DAGEN,
): RisicoLid[] {
  const uit: RisicoLid[] = []
  for (const lid of leden) {
    if (lid.status !== 'actief') continue
    const laatst = laatsteBezoek.get(lid.id)
    if (laatst) {
      const dagen = dagenTussen(dagSleutel(laatst), vandaag)
      if (dagen >= drempel) uit.push({ lid, dagenWeg: dagen })
    } else if (lid.lidSinds && dagenTussen(lid.lidSinds, vandaag) >= drempel) {
      uit.push({ lid, dagenWeg: null })
    }
  }
  return uit.sort((a, b) => (b.dagenWeg ?? Infinity) - (a.dagenWeg ?? Infinity))
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
