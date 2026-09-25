// ─── LifeOS — Sportmerk: unit economics per order ───────────────────────────
// Puur en testbaar. Rekent uit wat er per bestelling overblijft ná btw,
// kostprijs, verzending, betaalkosten en een retourreservering — en daarna na
// één betaalde klant. Dat laatste is de maatstaf: een hoog margepercentage op
// een product van €25 zegt niets als de klant €35 kost.
//
// EERLIJK: elk getal hier is een werkaanname, geen gemeten cijfer. Ze staan
// daarom op één plek, en de pagina toont ze letterlijk naast de uitkomst.

import type { BerekendeMarge, ProductAanname, Risico } from './types'

export interface MargeAannames {
  btw: number
  betaalkosten: number
  /** Deel van de ex-btw-omzet dat we reserveren voor retouren en refunds. */
  retourReserve: Record<Risico, number>
  cacPerKlant: number
}

export const MARGE_AANNAMES: MargeAannames = {
  btw: 0.21,
  betaalkosten: 0.025,
  retourReserve: { laag: 0.03, middel: 0.08, hoog: 0.15 },
  cacPerKlant: 35,
}

/** Standaard uitgaande verzending (3PL pick/pack + PostNL-pakket), aanname. */
export const VERZENDING_STANDAARD = 6

function opCenten(bedrag: number): number {
  return Math.round(bedrag * 100) / 100
}

export function berekenMarge(product: ProductAanname, aannames: MargeAannames = MARGE_AANNAMES): BerekendeMarge {
  const exBtw = product.prijsInclBtw / (1 + aannames.btw)
  const kostprijs = (product.kostprijs.min + product.kostprijs.max) / 2
  const betaal = product.prijsInclBtw * aannames.betaalkosten
  const retour = exBtw * aannames.retourReserve[product.retourRisico]
  const overVoorAds = exBtw - kostprijs - product.verzendkosten - betaal - retour

  return {
    exBtw: opCenten(exBtw),
    overVoorAds: opCenten(overVoorAds),
    naAds: opCenten(overVoorAds - aannames.cacPerKlant),
  }
}
