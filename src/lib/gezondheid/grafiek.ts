// ─── Grafiekschaal ────────────────────────────────────────────────────────────
// Pure hulpen voor de detailgrafiek: y-domein (met je normaal erin), drie
// rasterlijnen en welke x-labels we tonen zonder dat ze botsen.

import type { Normaal } from './normaal'

export interface Domein {
  min: number
  max: number
}

/**
 * Staven beginnen altijd bij 0 (anders liegt de hoogte). Lijnen zoomen in op
 * het bereik van de data én je normaal, met wat lucht erboven en eronder.
 */
export function grafiekDomein(
  waarden: readonly (number | null)[], normaal: Normaal | null, vorm: 'staaf' | 'lijn',
): Domein {
  const gemeten = waarden.filter((w): w is number => w !== null)
  const alles = normaal ? [...gemeten, normaal.laag, normaal.hoog] : gemeten
  if (alles.length === 0) return { min: 0, max: 1 }
  const hoogste = Math.max(...alles)
  if (vorm === 'staaf') return { min: 0, max: hoogste > 0 ? hoogste * 1.1 : 1 }

  const laagste = Math.min(...alles)
  const marge = (hoogste - laagste) * 0.15 || Math.abs(hoogste) * 0.05 || 1
  return { min: laagste - marge, max: hoogste + marge }
}

/** Drie rasterwaarden: onder, midden, boven. */
export function rasterWaarden(domein: Domein): number[] {
  return [domein.min, (domein.min + domein.max) / 2, domein.max]
}

/** Positie van een waarde in procent vanaf de bovenkant (0 = top). */
export function yProcent(waarde: number, domein: Domein): number {
  const bereik = domein.max - domein.min || 1
  return 100 - ((waarde - domein.min) / bereik) * 100
}

/** Indexen van x-labels: maximaal `max` stuks, gelijk verdeeld, eerste en laatste altijd. */
export function labelIndexen(aantal: number, max = 5): number[] {
  if (aantal <= 0) return []
  if (aantal <= max) return Array.from({ length: aantal }, (_, i) => i)
  const stap = (aantal - 1) / (max - 1)
  return [...new Set(Array.from({ length: max }, (_, i) => Math.round(i * stap)))]
}
