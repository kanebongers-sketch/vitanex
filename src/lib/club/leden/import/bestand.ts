// ─── Club, leden inlezen: welk bestand is het en hoe lezen we het (PUUR) ────
// CSV (of .txt) en Excel (.xlsx) worden allebei dezelfde tabel. Een oud .xls,
// .ods of .numbers kunnen we niet lezen: dan zeggen we hoe je het opslaat.
// Het bestand wordt in de browser gelezen; er gaat niets naar de server tot de
// eigenaar op Controleren drukt, en het bestand zelf wordt nooit bewaard.

import { decodeerBestand, leesCsv, type CsvTabel } from './csv'
import { leesXlsx, XlsxFout } from './xlsx'
import type { Inflate } from './zip'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

/** Groter dan dit lezen we niet in de browser. */
export const MAX_BESTAND_BYTES = 10 * 1024 * 1024

export type BestandSoort = 'csv' | 'xlsx' | 'onbekend'

/** Wat voor tabel de input accepteert. */
export const BESTAND_ACCEPT = '.csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function bestandSoort(naam: string): BestandSoort {
  if (/\.(csv|txt)$/i.test(naam)) return 'csv'
  if (/\.xlsx$/i.test(naam)) return 'xlsx'
  return 'onbekend'
}

export type BestandUitslag = { ok: true; tabel: CsvTabel } | { ok: false; fout: string }

/** Controleer naam en grootte voordat we iets lezen. Null = in orde. */
export function controleerBestand(naam: string, grootte: number, taal: Taal = 'nl'): string | null {
  const t = LEDEN[taal].import.bestand
  if (bestandSoort(naam) === 'onbekend') return t.onbekend
  if (grootte > MAX_BESTAND_BYTES) return t.teGroot
  if (grootte === 0) return t.leeg
  return null
}

/** Een gekozen bestand als tabel, of een begrijpelijke fout. */
export async function leesLedenBestand(naam: string, bytes: ArrayBuffer, inflate?: Inflate, taal: Taal = 'nl'): Promise<BestandUitslag> {
  const fout = controleerBestand(naam, bytes.byteLength, taal)
  if (fout) return { ok: false, fout }
  if (bestandSoort(naam) === 'csv') return { ok: true, tabel: leesCsv(decodeerBestand(bytes)) }
  try {
    return { ok: true, tabel: await leesXlsx(new Uint8Array(bytes), inflate) }
  } catch (err) {
    // De meldingen van de Excel-lezer zijn Nederlands; in het Engels een algemene melding.
    const excelFout = LEDEN[taal].import.bestand.excelFout
    return { ok: false, fout: err instanceof XlsxFout && taal === 'nl' ? err.message : excelFout }
  }
}
