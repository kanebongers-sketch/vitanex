// ─── Club: rapporten, opmaak van cellen (PUUR) ──────────────────────────────
// Datums als dd-mm-jjjj (zo leest Excel NL ze als datum), tijden als uu:mm in
// Nederlandse tijd, uren als getal met twee decimalen.

import { dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'

/** "2026-10-07" naar "07-10-2026"; geen geldige datum = leeg. */
export function datumNl(dag: string | null): string | null {
  if (!dag || !/^\d{4}-\d{2}-\d{2}/.test(dag)) return null
  return `${dag.slice(8, 10)}-${dag.slice(5, 7)}-${dag.slice(0, 4)}`
}

/** De Nederlandse kalenderdag van een moment, als dd-mm-jjjj. */
export function momentDatum(d: Date | null): string | null {
  return d ? datumNl(dagSleutel(d)) : null
}

/** De Nederlandse kloktijd van een moment: "18:30". */
export function momentTijd(d: Date | null): string | null {
  return d ? tijdNl(d) : null
}

/** Minuten naar uren, afgerond op twee decimalen. */
export function uren(min: number): number {
  return Math.round((min / 60) * 100) / 100
}

/** Percentage van deel en geheel, afgerond; null als het geheel 0 is. */
export function procent(deel: number, geheel: number): number | null {
  return geheel > 0 ? Math.round((deel / geheel) * 100) : null
}

/** Sorteren op Nederlandse namen (hoofdletters en accenten tellen niet). */
export function vergelijkNaam(a: string, b: string): number {
  return a.localeCompare(b, 'nl', { sensitivity: 'base' })
}
