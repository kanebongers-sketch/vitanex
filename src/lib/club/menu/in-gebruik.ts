// ─── Club: verbergen tot gebruikt (PUUR) ────────────────────────────────────
// Ontwerp "Club in 10 minuten" (docs/club/EENVOUD-10-MINUTEN.md, regel 4): een
// scherm dat nog nooit gebruikt is en niet de kern van zijn plek is, staat niet
// in het menu. Het is via zoeken en via de knop op de plek waar je hem nodig hebt
// (bijvoorbeeld "Takenlijst maken" op Vandaag) wel te maken. Welke schermen
// wachten en hoe, staat in inGebruik() in src/components/club/shell/onderdelen.ts.
// Hier alleen de stand en het lezen van de instelling; de database leest
// in-gebruik-opslag.ts.

/** Wat het menu moet weten om een nog leeg scherm weg te laten. */
export interface GebruikStand {
  /** Aantal actieve takenlijsten; null = onbekend (dan staat Taken er gewoon). */
  takenlijsten: number | null
  /** Mededelingen, werkwijzen en notities samen; null = onbekend. */
  prikbord: number | null
  /** "Alles tonen, ook wat nog leeg is" (Instellingen · Onderdelen). */
  allesTonen: boolean
}

/** Alles in gebruik: zo staat het menu als de stand niet te lezen is. */
export const ALLES_IN_GEBRUIK: GebruikStand = { takenlijsten: null, prikbord: null, allesTonen: true }

/**
 * Waar de instelling "Alles tonen" staat: club_organisaties.instellingen.menu.alles_tonen
 * (true = ook wat nog leeg is). Standaard uit: de eenvoudige stand is de standaard.
 */
export const ALLES_TONEN_PAD = ['menu', 'alles_tonen'] as const

/** Leest "Alles tonen" uit de ruwe instellingen; alles behalve true is uit. */
export function leesAllesTonen(instellingen: unknown): boolean {
  if (!instellingen || typeof instellingen !== 'object') return false
  const menu = (instellingen as Record<string, unknown>)[ALLES_TONEN_PAD[0]]
  if (!menu || typeof menu !== 'object') return false
  return (menu as Record<string, unknown>)[ALLES_TONEN_PAD[1]] === true
}

/** Telt aantallen op; is een ervan onbekend, dan is het geheel onbekend. */
export function somOfOnbekend(aantallen: readonly (number | null)[]): number | null {
  if (aantallen.some((n) => n === null)) return null
  return aantallen.reduce<number>((som, n) => som + (n ?? 0), 0)
}
