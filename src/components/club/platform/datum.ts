import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'

// Datums op het platformoverzicht, altijd in Nederlandse tijd, in de taal van de pagina.

function geldig(iso: string): Date | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "18 okt. 2026" | "18 Oct 2026", of "onbekend" als de datum kapot is. */
export function nlDatum(iso: string, taal: Taal = 'nl'): string {
  const d = geldig(iso)
  return d ? formatDatum(d, taal, 'kort') : PLATFORM[taal].onbekend
}

/** "18 okt. 10:24" | "18 Oct 10:24". */
export function nlMoment(iso: string, taal: Taal = 'nl'): string {
  const d = geldig(iso)
  return d ? `${formatDatum(d, taal, 'dagMaand')} ${formatTijd(d, taal)}` : PLATFORM[taal].onbekend
}
