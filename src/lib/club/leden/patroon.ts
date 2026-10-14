// ─── Fit Factory Club: bezoekpatroon (PUUR) ─────────────────────────────────
// Voor de ledenkaart: bezoeken per week (laatste 12 weken, blokken van 7 dagen
// eindigend op vandaag) en per weekdag. Een bezoek = een dag met een check-in.

import { dagNummer, dagSleutel, datumKort, weekdagNl } from './tijd'

export interface WeekBalk {
  /** Eerste dag van het blok, bv. "6 okt". */
  label: string
  aantal: number
  /** Het blok dat op vandaag eindigt. */
  huidig: boolean
}

export const PATROON_WEKEN = 12

/** De unieke bezoekdagen als "dagen geleden", binnen `dagen` terug. */
function bezoekDagen(bezoeken: readonly Date[], nu: Date, dagen: number): Map<number, Date> {
  const vandaag = dagNummer(dagSleutel(nu))
  const uniek = new Map<number, Date>()
  for (const b of bezoeken) {
    const geleden = vandaag - dagNummer(dagSleutel(b))
    if (geleden >= 0 && geleden < dagen && !uniek.has(geleden)) uniek.set(geleden, b)
  }
  return uniek
}

export function weekBalken(bezoeken: readonly Date[], nu: Date, weken = PATROON_WEKEN): WeekBalk[] {
  const dagen = bezoekDagen(bezoeken, nu, weken * 7)
  const tellingen = Array.from({ length: weken }, () => 0)
  for (const geleden of dagen.keys()) tellingen[weken - 1 - Math.floor(geleden / 7)] += 1
  return tellingen.map((aantal, i) => {
    const eersteDag = new Date(nu.getTime() - ((weken - 1 - i) * 7 + 6) * 86_400_000)
    return { label: datumKort(eersteDag, nu), aantal, huidig: i === weken - 1 }
  })
}

/** Bezoeken per weekdag (index 0 = maandag) over de laatste `weken` weken. */
export function perWeekdag(bezoeken: readonly Date[], nu: Date, weken = PATROON_WEKEN): number[] {
  const telling = [0, 0, 0, 0, 0, 0, 0]
  for (const b of bezoekDagen(bezoeken, nu, weken * 7).values()) telling[weekdagNl(b) - 1] += 1
  return telling
}

export const WEEKDAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const
