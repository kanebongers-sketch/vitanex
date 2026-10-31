// ─── AI Your Gym: een staffel in woorden (PUUR) ─────────────────────────────
// "Tot 100 leden" of "prijs op maat", in de gekozen taal. Nooit een bedrag.

import { staffelVoor } from './staffel'
import type { Taal } from './taal/taal'
import { STAFFEL } from './taal/woorden/club/staffel'

function getal(n: number, taal: Taal): string {
  return new Intl.NumberFormat(taal === 'en' ? 'en-GB' : 'nl-NL').format(n)
}

/** De staffel van een aantal leden in woorden. */
export function staffelNaam(aantal: number, taal: Taal): string {
  const s = staffelVoor(aantal)
  if (!s || s.soort === 'op_maat') return STAFFEL[taal].opMaat
  return STAFFEL[taal].tot(getal(s.grens, taal))
}

/** De staffel bij een opgeslagen bovengrens (log), of null = prijs op maat. */
export function grensNaam(grens: number | null, taal: Taal): string {
  return grens === null ? STAFFEL[taal].opMaat : STAFFEL[taal].tot(getal(grens, taal))
}

export interface StaffelRegel {
  sleutel: string
  naam: string
  actieveLeden: number | null
  /** "Tot 100 leden", of null als we niet konden tellen. */
  staffel: string | null
  /** Het bedrag per maand van het abonnement van deze vestiging, uit Stripe, of null. */
  bedrag: string | null
  /** Heeft deze vestiging een eigen (lopend) abonnement bij Stripe? */
  abonnement: boolean
}

/**
 * De regels voor het blok Staffel per vestiging (PUUR, getest): elke vestiging
 * met de telling van nu, de staffel die daarbij hoort en (als Stripe het gaf)
 * het bedrag. De telling is de live telling, dezelfde regel als de cron.
 */
export function staffelOverzicht(
  vestigingen: readonly { sleutel: string; naam: string }[],
  leden: Readonly<Record<string, number>> | null,
  metAbonnement: ReadonlySet<string>,
  bedragen: Readonly<Record<string, string | null>>,
  taal: Taal,
): StaffelRegel[] {
  return vestigingen.map((v) => {
    const aantal = leden ? (leden[v.sleutel] ?? 0) : null
    return { sleutel: v.sleutel, naam: v.naam, actieveLeden: aantal, staffel: aantal === null ? null : staffelNaam(aantal, taal), bedrag: bedragen[v.sleutel] ?? null, abonnement: metAbonnement.has(v.sleutel) }
  })
}
