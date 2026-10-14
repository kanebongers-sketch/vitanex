// ─── Fit Factory Club, rooster: lessen uit het weekrooster (PUUR) ───────────
// Een serie ("elke dinsdag 19:00 Spinning") wordt per datum een concrete les.
// De kloktijd is Nederlandse tijd: over de overgang naar wintertijd heen blijft
// de les om 19:00 beginnen. Idempotent: lessen die al bestaan (zelfde serie en
// starttijd, de unieke index op serie_id + start_op) worden overgeslagen.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isoWeekdag, nlNaarUtc, plusDagen } from './tijd'
import type { LesSerie } from './typen'

export interface NieuweLes {
  vestiging: Vestiging
  serieId: string
  lestypeId: string
  zaalId: string | null
  instructeurId: string | null
  startOp: string
  eindOp: string
  capaciteit: number
}

export const MAX_WEKEN_VOORUIT = 12

/** De sleutel waarmee een les uniek is: serie plus exact starttijdstip. */
export function lesSleutel(serieId: string, startOp: string | Date): string {
  const ms = typeof startOp === 'string' ? Date.parse(startOp) : startOp.getTime()
  return `${serieId}|${ms}`
}

/** Valt deze datum binnen de looptijd van de serie? */
function binnenLooptijd(serie: LesSerie, datum: string): boolean {
  if (datum < serie.vanaf) return false
  return serie.tot === null || datum <= serie.tot
}

/**
 * Alle lessen die er vanaf `vandaag` (Nederlandse datum) voor `weken` weken
 * moeten zijn. Lessen die al begonnen zijn (voor `nu`) en lessen die al bestaan
 * (`bestaand`, sleutels uit lesSleutel) komen er niet in.
 */
export function lessenUitSeries(
  series: readonly LesSerie[],
  vandaag: string,
  weken: number,
  nu: Date,
  bestaand: ReadonlySet<string> = new Set(),
): NieuweLes[] {
  const aantalDagen = Math.max(0, Math.min(MAX_WEKEN_VOORUIT, Math.floor(weken))) * 7
  const uit: NieuweLes[] = []
  for (let i = 0; i < aantalDagen; i++) {
    const datum = plusDagen(vandaag, i)
    const weekdag = isoWeekdag(datum)
    for (const serie of series) {
      if (!serie.actief || serie.weekdag !== weekdag || !binnenLooptijd(serie, datum)) continue
      const start = nlNaarUtc(datum, serie.starttijd)
      if (start.getTime() <= nu.getTime() || bestaand.has(lesSleutel(serie.id, start))) continue
      const eind = new Date(start.getTime() + serie.duurMin * 60_000)
      uit.push({
        vestiging: serie.vestiging,
        serieId: serie.id,
        lestypeId: serie.lestypeId,
        zaalId: serie.zaalId,
        instructeurId: serie.instructeurId,
        startOp: start.toISOString(),
        eindOp: eind.toISOString(),
        capaciteit: serie.capaciteit,
      })
    }
  }
  return uit.sort((a, b) => (a.startOp < b.startOp ? -1 : a.startOp > b.startOp ? 1 : 0))
}
