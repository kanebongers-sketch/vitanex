// ─── Club: rapporten als CSV (PUUR) ─────────────────────────────────────────
// Puntkomma als scheiding, UTF-8 met BOM en CRLF, zodat Excel NL het bestand
// meteen goed opent. Cellen die met = + - @ tab of CR beginnen krijgen een
// apostrof ervoor (geen formules uit een export). De opbouw zit in
// cijfers/csv.ts; hier komen het plafond en de bestandsnaam bij.

import { csvBestandsnaam, naarCsv, type CsvWaarde } from '@/lib/club/cijfers/csv'
import type { Maand } from '@/lib/club/cijfers/maand'
import type { RapportSleutel } from './definities'

export type { CsvWaarde }

/** Nooit meer rijen in een export of voorbeeld dan dit. */
export const MAX_RIJEN = 10_000

/** Zoveel rijen toont het voorbeeld op de pagina. */
export const VOORBEELD_RIJEN = 20

export interface RapportTabel {
  kolommen: readonly string[]
  rijen: CsvWaarde[][]
}

export interface Begrensd extends RapportTabel {
  /** Het aantal rijen voor het plafond. */
  totaal: number
  afgekapt: boolean
}

export function begrens(t: RapportTabel, max = MAX_RIJEN): Begrensd {
  return { kolommen: t.kolommen, rijen: t.rijen.slice(0, max), totaal: t.rijen.length, afgekapt: t.rijen.length > max }
}

export function rapportCsv(t: RapportTabel): string {
  return naarCsv(t.kolommen, t.rijen)
}

/** "bezoek-2026-09-budel-eersel.csv" of "...-alle-vestigingen.csv". */
export function rapportBestand(rapport: RapportSleutel, maand: Maand, vestigingen: readonly string[], alle: boolean): string {
  const waar = alle ? ['alle-vestigingen'] : vestigingen.length > 4 ? [`${vestigingen.length}-vestigingen`] : [...vestigingen]
  return csvBestandsnaam(rapport, maand, ...waar)
}
