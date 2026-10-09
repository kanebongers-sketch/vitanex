// ─── Samenvatting per metriek ─────────────────────────────────────────────────
// Wat het overzicht per metriek nodig heeft: de laatste meting, een minitrend
// van 7 dagen en je normaal. Metrieken zonder enige meting komen er niet in.

import { METRIEKEN } from '@/lib/health/gezondheid-metrics'
import { berekenNormaal, type Normaal } from './normaal'
import { BRON_LABELS } from './samenvoegen'
import { relatieveDatum } from './statistiek'
import { laatsteMeting, miniTrend, type LaatsteMeting } from './trends'
import { METRIEK_SLEUTELS, type GezondheidsDag, type MetriekSleutel } from './types'

export interface MetriekSamenvatting {
  sleutel: MetriekSleutel
  laatste: LaatsteMeting
  /** Laatste meting is recent genoeg om als "nu" te tonen. */
  actueel: boolean
  mini: (number | null)[]
  normaal: Normaal | null
}

export function vatMetriekSamen(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): MetriekSamenvatting | null {
  const laatste = laatsteMeting(dagen, sleutel, vandaag)
  if (!laatste) return null
  return {
    sleutel,
    laatste,
    actueel: laatste.dagenGeleden < METRIEKEN[sleutel].actueelDagen,
    mini: miniTrend(dagen, sleutel, vandaag),
    normaal: berekenNormaal(dagen, sleutel, vandaag),
  }
}

/** Samenvattingen van alle metrieken met minstens één meting, in catalogusvolgorde. */
export function vatAllesSamen(
  dagen: readonly GezondheidsDag[], vandaag: string,
): MetriekSamenvatting[] {
  return METRIEK_SLEUTELS
    .map((s) => vatMetriekSamen(dagen, s, vandaag))
    .filter((s): s is MetriekSamenvatting => s !== null)
}

/** "Afgelopen nacht", "Vandaag, tot nu toe", "Gisteren" of "ma 5 okt". */
export function meetmomentLabel(sleutel: MetriekSleutel, datum: string, vandaag: string): string {
  const cfg = METRIEKEN[sleutel]
  if (datum === vandaag && cfg.groep === 'slaap') return 'Afgelopen nacht'
  if (datum === vandaag && cfg.cumulatief) return 'Vandaag, tot nu toe'
  return relatieveDatum(datum, vandaag)
}

export type Ligging = 'binnen' | 'boven' | 'onder'

/** Ligt een waarde binnen je gebruikelijke bereik (25e–75e percentiel)? */
export function liggingTovNormaal(waarde: number, normaal: Normaal): Ligging {
  if (waarde > normaal.hoog) return 'boven'
  if (waarde < normaal.laag) return 'onder'
  return 'binnen'
}

/** Leesbare namen van de bronnen die deze metriek leverden, meest gebruikte eerst. */
export function bronnenVan(dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel): string[] {
  const tellingen = new Map<string, number>()
  for (const d of dagen) {
    const bron = d.herkomst[sleutel]
    if (!bron) continue
    const label = BRON_LABELS[bron] ?? bron
    tellingen.set(label, (tellingen.get(label) ?? 0) + 1)
  }
  return [...tellingen.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label)
}
