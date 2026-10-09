// ─── Highlights ───────────────────────────────────────────────────────────────
// Eén eerlijke zin per metriek die echt afwijkt, zoals Apple Health doet:
// "Je sliep de afgelopen 7 nachten gemiddeld 34 min minder dan je normaal."
//
// Regels:
// - recent = de laatste 7 (volledige) dagen, minimaal 3 metingen;
// - normaal = mediaan van de 28 dagen dáárvoor, minimaal 5 metingen;
// - pas boven de drempel per metriek (ruis zwijgen we dood);
// - geen oordeel, geen diagnose: alleen wat je data laat zien.

import { METRIEKEN, type Drempel } from '@/lib/health/gezondheid-metrics'
import { normaalOver, waardenInVenster, NORMAAL_VENSTER_DAGEN } from './normaal'
import { gemiddelde, verschuifDatum } from './statistiek'
import { METRIEK_SLEUTELS, type GezondheidsDag, type MetriekSleutel } from './types'

export const RECENT_DAGEN = 7
export const MIN_RECENTE_METINGEN = 3

export interface Highlight {
  sleutel: MetriekSleutel
  tekst: string
  /** Recent gemiddelde min normaal (met teken). */
  verschil: number
  recentGemiddelde: number
  normaal: number
  recentAantal: number
  normaalAantal: number
  /** Hoe ver boven de drempel (1 = precies op de drempel); voor sortering. */
  sterkte: number
}

function sterkteVan(drempel: Drempel, verschil: number, normaal: number): number {
  if (drempel.soort === 'absoluut') return Math.abs(verschil) / drempel.waarde
  if (normaal === 0) return 0
  return Math.abs(verschil / normaal) / drempel.waarde
}

interface Vergelijking {
  recent: number[]
  recentGemiddelde: number
  basisMediaan: number
  basisAantal: number
}

/** Recente week naast de 28 dagen daarvoor; null als daar te weinig metingen voor zijn. */
function vergelijkRecent(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): Vergelijking | null {
  const cfg = METRIEKEN[sleutel]
  if (!cfg.highlight) return null

  const recentTot = cfg.cumulatief ? verschuifDatum(vandaag, -1) : vandaag
  const recentVanaf = verschuifDatum(recentTot, -(RECENT_DAGEN - 1))
  const recent = waardenInVenster(dagen, sleutel, recentVanaf, recentTot)
  if (recent.length < MIN_RECENTE_METINGEN) return null

  const basisTot = verschuifDatum(recentVanaf, -1)
  const basis = normaalOver(dagen, sleutel, verschuifDatum(basisTot, -(NORMAAL_VENSTER_DAGEN - 1)), basisTot)
  const recentGemiddelde = gemiddelde(recent)
  if (!basis || recentGemiddelde === null) return null
  return { recent, recentGemiddelde, basisMediaan: basis.mediaan, basisAantal: basis.aantal }
}

/** Metrieken waarvoor genoeg data is om een highlight eerlijk te beoordelen. */
export function beoordeelbareMetrieken(
  dagen: readonly GezondheidsDag[], vandaag: string,
): MetriekSleutel[] {
  return METRIEK_SLEUTELS.filter((s) => vergelijkRecent(dagen, s, vandaag) !== null)
}

export function berekenHighlight(
  dagen: readonly GezondheidsDag[], sleutel: MetriekSleutel, vandaag: string,
): Highlight | null {
  const regel = METRIEKEN[sleutel].highlight
  const v = vergelijkRecent(dagen, sleutel, vandaag)
  if (!regel || !v) return null

  const verschil = v.recentGemiddelde - v.basisMediaan
  const sterkte = sterkteVan(regel.drempel, verschil, v.basisMediaan)
  if (sterkte < 1) return null

  return {
    sleutel,
    tekst: regel.beschrijf(regel.formatVerschil(Math.abs(verschil)), verschil > 0),
    verschil,
    recentGemiddelde: v.recentGemiddelde,
    normaal: v.basisMediaan,
    recentAantal: v.recent.length,
    normaalAantal: v.basisAantal,
    sterkte,
  }
}

/** Alle highlights, sterkste afwijking eerst. */
export function berekenHighlights(
  dagen: readonly GezondheidsDag[], vandaag: string, max = 3,
): Highlight[] {
  return METRIEK_SLEUTELS
    .map((s) => berekenHighlight(dagen, s, vandaag))
    .filter((h): h is Highlight => h !== null)
    .sort((a, b) => b.sterkte - a.sterkte)
    .slice(0, max)
}
