// ─── Trends per dag, week en maand ────────────────────────────────────────────
// Bronnen leveren dagwaarden; weken en maanden zijn het gemiddelde per dag over
// de dagen mét meting. Bij optellende metrieken (stappen, kcal …) telt de
// lopende dag niet mee in een gemiddelde: die is nog niet af.

import { METRIEKEN } from '@/lib/health/gezondheid-metrics'
import {
  dagLabelKort, dagenTussen, datumKort, datumLang, gemiddelde, maandKort, maandLang,
  maandStart, verschuifDatum, verschuifMaand, weekStart,
} from './statistiek'
import type { GezondheidsDag, MetriekSleutel } from './types'

export type Periode = 'dag' | 'week' | 'maand'

export const PERIODES: readonly { waarde: Periode; label: string; omschrijving: string }[] = [
  { waarde: 'dag', label: 'Per dag', omschrijving: 'de afgelopen 30 dagen' },
  { waarde: 'week', label: 'Per week', omschrijving: 'de afgelopen 12 weken' },
  { waarde: 'maand', label: 'Per maand', omschrijving: 'de afgelopen 12 maanden' },
]

export function isPeriode(waarde: unknown): waarde is Periode {
  return waarde === 'dag' || waarde === 'week' || waarde === 'maand'
}

export interface TrendPunt {
  /** Begindatum van de dag/week/maand. */
  sleutel: string
  label: string
  labelLang: string
  waarde: number | null
  /** Aantal dagen met een meting in dit punt. */
  aantal: number
  /** Lopende dag/week/maand: nog niet compleet. */
  onvolledig: boolean
  /** Telt mee in het periodegemiddelde (een lopende dag met optellende metriek niet). */
  telMee: boolean
}

function waardeOp(index: Map<string, GezondheidsDag>, sleutel: MetriekSleutel, datum: string): number | undefined {
  return index.get(datum)?.waarden[sleutel]
}

function indexeer(dagen: readonly GezondheidsDag[]): Map<string, GezondheidsDag> {
  return new Map(dagen.map((d) => [d.datum, d]))
}

/** Dagwaarden in [vanaf, tot] die meetellen (een lopende dag alleen bij optellen tot een totaal). */
function telbareWaarden(
  index: Map<string, GezondheidsDag>, sleutel: MetriekSleutel, vanaf: string, tot: string, vandaag: string,
): number[] {
  const cfg = METRIEKEN[sleutel]
  const laatsteTelbare = cfg.cumulatief && cfg.aggregatie === 'gemiddelde' ? verschuifDatum(vandaag, -1) : vandaag
  const eind = tot < laatsteTelbare ? tot : laatsteTelbare
  const uit: number[] = []
  for (let d = vanaf; d <= eind; d = verschuifDatum(d, 1)) {
    const w = waardeOp(index, sleutel, d)
    if (w !== undefined) uit.push(w)
  }
  return uit
}

export function trendPerDag(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string, aantal = 30,
): TrendPunt[] {
  const index = indexeer(dagen)
  return Array.from({ length: aantal }, (_, i) => {
    const datum = verschuifDatum(vandaag, i - aantal + 1)
    const waarde = waardeOp(index, sleutel, datum) ?? null
    const onvolledig = datum === vandaag && METRIEKEN[sleutel].cumulatief
    return {
      sleutel: datum, label: dagLabelKort(datum), labelLang: datumLang(datum),
      waarde, aantal: waarde === null ? 0 : 1,
      onvolledig, telMee: !onvolledig || METRIEKEN[sleutel].aggregatie === 'totaal',
    }
  })
}

function totaal(waarden: readonly number[]): number | null {
  return waarden.length === 0 ? null : waarden.reduce((som, w) => som + w, 0)
}

function bucket(
  index: Map<string, GezondheidsDag>, sleutel: MetriekSleutel, vandaag: string,
  vanaf: string, tot: string, label: string, labelLang: string,
): TrendPunt {
  const waarden = telbareWaarden(index, sleutel, vanaf, tot, vandaag)
  return {
    sleutel: vanaf, label, labelLang,
    waarde: METRIEKEN[sleutel].aggregatie === 'totaal' ? totaal(waarden) : gemiddelde(waarden),
    aantal: waarden.length,
    onvolledig: tot >= vandaag,
    telMee: true,
  }
}

export function trendPerWeek(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string, aantal = 12,
): TrendPunt[] {
  const index = indexeer(dagen)
  const huidigeWeek = weekStart(vandaag)
  return Array.from({ length: aantal }, (_, i) => {
    const vanaf = verschuifDatum(huidigeWeek, (i - aantal + 1) * 7)
    const tot = verschuifDatum(vanaf, 6)
    return bucket(index, sleutel, vandaag, vanaf, tot, datumKort(vanaf), `week van ${datumLang(vanaf)}`)
  })
}

export function trendPerMaand(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string, aantal = 12,
): TrendPunt[] {
  const index = indexeer(dagen)
  const huidigeMaand = maandStart(vandaag)
  return Array.from({ length: aantal }, (_, i) => {
    const vanaf = verschuifMaand(huidigeMaand, i - aantal + 1)
    const tot = verschuifDatum(verschuifMaand(vanaf, 1), -1)
    return bucket(index, sleutel, vandaag, vanaf, tot, maandKort(vanaf), maandLang(vanaf))
  })
}

export function bouwTrend(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, periode: Periode, vandaag: string,
): TrendPunt[] {
  if (periode === 'week') return trendPerWeek(dagen, sleutel, vandaag)
  if (periode === 'maand') return trendPerMaand(dagen, sleutel, vandaag)
  return trendPerDag(dagen, sleutel, vandaag)
}

/**
 * Eén getal voor de hele periode: het gemiddelde per dag (gewogen naar het
 * aantal metingen per punt), of bij trainingen het totaal.
 */
export function periodeSamenvatting(
  punten: readonly TrendPunt[], sleutel: MetriekSleutel,
): { waarde: number | null; dagen: number } {
  const metWaarde = punten.filter((p) => p.waarde !== null && p.telMee)
  const dagenTotaal = metWaarde.reduce((som, p) => som + p.aantal, 0)
  if (dagenTotaal === 0) return { waarde: null, dagen: 0 }
  if (METRIEKEN[sleutel].aggregatie === 'totaal') {
    return { waarde: metWaarde.reduce((som, p) => som + (p.waarde ?? 0), 0), dagen: dagenTotaal }
  }
  const som = metWaarde.reduce((s, p) => s + (p.waarde ?? 0) * p.aantal, 0)
  return { waarde: som / dagenTotaal, dagen: dagenTotaal }
}

/** De zeven dagwaarden tot en met vandaag (null = geen meting). */
export function miniTrend(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): (number | null)[] {
  return trendPerDag(dagen, sleutel, vandaag, 7).map((p) => p.waarde)
}

export interface LaatsteMeting {
  waarde: number
  datum: string
  dagenGeleden: number
}

export function laatsteMeting(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): LaatsteMeting | null {
  for (let i = dagen.length - 1; i >= 0; i--) {
    const dag = dagen[i]
    const waarde = dag.waarden[sleutel]
    if (waarde !== undefined && dag.datum <= vandaag) {
      return { waarde, datum: dag.datum, dagenGeleden: dagenTussen(dag.datum, vandaag) }
    }
  }
  return null
}
