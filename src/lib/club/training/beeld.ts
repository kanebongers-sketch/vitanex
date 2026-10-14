// ─── Fit Factory Club, training: tekeningen bij oefeningen (PUUR) ───────────
// Een oefening kan een begin- en eindhouding hebben (lijntekeningen van
// Everkinetic, CC BY-SA 4.0, zie public/club/oefeningen/LICENSE.txt).
// Systeemgrens: alleen paden naar onze eigen map komen door. Het pad belandt in
// een CSS-masker en een <img>, dus niets anders mag erin.

export interface OefeningBeelden {
  start: string
  eind: string
}

const BEELD_PAD = /^\/club\/oefeningen\/\d{4}-(?:start|eind)\.svg$/

export function isBeeldPad(v: unknown): v is string {
  return typeof v === 'string' && BEELD_PAD.test(v)
}

/** Beide houdingen uit een databaserij (beeld_start, beeld_eind), of null. */
export function beeldenUitRij(rij: { beeld_start?: unknown; beeld_eind?: unknown }): OefeningBeelden | null {
  return isBeeldPad(rij.beeld_start) && isBeeldPad(rij.beeld_eind) ? { start: rij.beeld_start, eind: rij.beeld_eind } : null
}

export const BEELD_KOLOMMEN = 'beeld_start, beeld_eind'

/** De bronvermelding die de licentie vraagt. Overal waar de tekeningen staan. */
export const BEELD_BRON = {
  tekst: 'Illustraties: Everkinetic, CC BY-SA 4.0',
  bron: 'https://github.com/everkinetic/data',
  licentie: 'https://creativecommons.org/licenses/by-sa/4.0/deed.nl',
} as const

export interface BeeldTelling {
  met: number
  totaal: number
}

export function telBeelden(oefeningen: readonly { beeld: OefeningBeelden | null }[]): BeeldTelling {
  return { met: oefeningen.filter((o) => o.beeld !== null).length, totaal: oefeningen.length }
}
