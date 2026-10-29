// ─── AI Your Gym: de keuze van losse pakketten bij het aanmelden (PUUR) ─────
// Zelfde regel als de server (checkout-route): Stripe alleen als ELK gekozen
// pakket een prijs heeft; anders de testbetaling als die aan staat; anders een
// aanvraag.

import { sorteerPakketten, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { pakkettenTekst } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { GekozenPakketten, PakketKeuze } from './types'

export function gekozenVan(pakketten: readonly PakketKeuze[], gekozen: readonly PakketSleutel[], testAan: boolean, taal: Taal): GekozenPakketten | null {
  if (gekozen.length === 0) return null
  const stripe = gekozen.every((s) => pakketten.find((p) => p.sleutel === s)?.stripe === true)
  const test = !stripe && testAan
  return { naam: pakkettenTekst(sorteerPakketten(gekozen), taal), open: stripe || test, test }
}

/** Een pakket aan- of uitvinken (nooit in place). */
export function wisselPakket(gekozen: readonly PakketSleutel[], sleutel: PakketSleutel): PakketSleutel[] {
  return gekozen.includes(sleutel) ? gekozen.filter((s) => s !== sleutel) : sorteerPakketten([...gekozen, sleutel])
}
