// ─── Club, betalen: een bedrag eerlijk verdelen (PUUR) ──────────────────────
// Grootste-restmethode: elk deel krijgt eerst het naar beneden afgeronde deel
// van zijn gewicht, de overgebleven centen gaan een voor een naar de delen met
// de grootste rest. Bij een gelijke rest wint het eerste deel. De som van de
// delen is altijd precies het totaal, ook bij een negatief totaal.

import { cent, type Cent } from './cent'

/**
 * Verdeel `totaal` naar verhouding van `gewichten` (gehele getallen, nul of
 * meer, samen meer dan nul). Geeft evenveel delen als gewichten.
 */
export function verdeel(totaal: Cent, gewichten: readonly number[]): Cent[] {
  if (gewichten.length === 0) throw new RangeError('Verdelen kan niet zonder gewichten')
  for (const g of gewichten) {
    if (!Number.isSafeInteger(g) || g < 0) throw new RangeError(`Gewicht moet een geheel getal van 0 of meer zijn: ${String(g)}`)
  }
  const somGewicht = gewichten.reduce((s, g) => s + BigInt(g), BigInt(0))
  if (somGewicht === BigInt(0)) throw new RangeError('De gewichten zijn samen 0')

  const negatiefTotaal = totaal < 0
  const abs = BigInt(Math.abs(totaal))
  const basis = gewichten.map((g) => (abs * BigInt(g)) / somGewicht)
  const resten = gewichten.map((g, i) => ({ i, rest: abs * BigInt(g) - basis[i] * somGewicht }))
  const verdeeld = basis.reduce((s, b) => s + b, BigInt(0))
  const over = Number(abs - verdeeld)

  // Grootste rest eerst; bij gelijke rest de laagste index.
  const volgorde = [...resten].sort((a, b) => (a.rest === b.rest ? a.i - b.i : a.rest > b.rest ? -1 : 1))
  const extra = new Set(volgorde.slice(0, over).map((r) => r.i))

  return basis.map((b, i) => {
    const deel = Number(b) + (extra.has(i) ? 1 : 0)
    return cent(negatiefTotaal ? -deel : deel)
  })
}

/** Verdeel `totaal` in `aantal` zo gelijk mogelijke delen (de eerste delen krijgen de extra cent). */
export function verdeelGelijk(totaal: Cent, aantal: number): Cent[] {
  if (!Number.isSafeInteger(aantal) || aantal < 1) throw new RangeError(`Aantal delen moet 1 of meer zijn: ${String(aantal)}`)
  return verdeel(totaal, Array.from({ length: aantal }, () => 1))
}
