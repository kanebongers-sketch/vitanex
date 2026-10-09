// ─── Je persoonlijke normaal ──────────────────────────────────────────────────
// De mediaan van je eigen metingen over 28 dagen, met het middelste bereik
// (25e–75e percentiel) als "gebruikelijk". Pas vanaf 5 echte metingen: met
// minder data noemen we niets een normaal.

import { METRIEKEN } from '@/lib/health/gezondheid-metrics'
import { kwantiel, verschuifDatum } from './statistiek'
import type { GezondheidsDag, MetriekSleutel } from './types'

export const NORMAAL_VENSTER_DAGEN = 28
export const MIN_METINGEN_NORMAAL = 5

export interface Normaal {
  mediaan: number
  laag: number
  hoog: number
  aantal: number
  vanaf: string
  tot: string
}

/** Alle metingen van een metriek met vanaf ≤ datum ≤ tot. */
export function waardenInVenster(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vanaf: string, tot: string,
): number[] {
  return dagen
    .filter((d) => d.datum >= vanaf && d.datum <= tot)
    .map((d) => d.waarden[sleutel])
    .filter((w): w is number => w !== undefined)
}

/** Normaal over het venster [vanaf, tot]; null bij te weinig metingen. */
export function normaalOver(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vanaf: string, tot: string,
): Normaal | null {
  if (!METRIEKEN[sleutel].heeftNormaal) return null
  const waarden = waardenInVenster(dagen, sleutel, vanaf, tot)
  if (waarden.length < MIN_METINGEN_NORMAAL) return null
  const mediaan = kwantiel(waarden, 0.5)
  const laag = kwantiel(waarden, 0.25)
  const hoog = kwantiel(waarden, 0.75)
  if (mediaan === null || laag === null || hoog === null) return null
  return { mediaan, laag, hoog, aantal: waarden.length, vanaf, tot }
}

/** Je normaal van de 28 dagen vóór vandaag (vandaag zelf is vaak nog niet af). */
export function berekenNormaal(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): Normaal | null {
  const tot = verschuifDatum(vandaag, -1)
  const vanaf = verschuifDatum(vandaag, -NORMAAL_VENSTER_DAGEN)
  return normaalOver(dagen, sleutel, vanaf, tot)
}

/** Aantal metingen in het normaal-venster (ook als het er te weinig zijn). */
export function metingenVoorNormaal(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): number {
  return waardenInVenster(
    dagen, sleutel, verschuifDatum(vandaag, -NORMAAL_VENSTER_DAGEN), verschuifDatum(vandaag, -1),
  ).length
}
