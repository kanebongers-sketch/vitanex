// ─── AI Your Gym: basis met add-ons kiezen bij het aanmelden (PUUR) ─────────
// De basis (Ledenadministratie) zit altijd in de keuze (besluit Kane 31-10-2026).
// Zelfde regel als de server (checkout-route): Stripe alleen als ELK gekozen
// pakket een prijs heeft; anders de testbetaling als die aan staat; anders een
// aanvraag. Alle zes met een bundelprijs (besluit Kane 30-10-2026) gaat ook
// via Stripe, ook als niet elk los pakket een prijs heeft.

import { isAllePakketten, isBasis, metBasis, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { pakkettenTekst } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { GekozenPakketten, PakketKeuze } from './types'

export function gekozenVan(pakketten: readonly PakketKeuze[], gekozen: readonly PakketSleutel[], testAan: boolean, taal: Taal, bundel = false): GekozenPakketten | null {
  if (gekozen.length === 0) return null
  const lijst = metBasis(gekozen)
  const stripe = (bundel && isAllePakketten(lijst)) || lijst.every((s) => pakketten.find((p) => p.sleutel === s)?.stripe === true)
  const test = !stripe && testAan
  return { naam: pakkettenTekst(lijst, taal), open: stripe || test, test }
}

/** Een add-on aan- of uitvinken (nooit in place). De basis blijft altijd staan. */
export function wisselPakket(gekozen: readonly PakketSleutel[], sleutel: PakketSleutel): PakketSleutel[] {
  if (isBasis(sleutel)) return metBasis(gekozen)
  return metBasis(gekozen.includes(sleutel) ? gekozen.filter((s) => s !== sleutel) : [...gekozen, sleutel])
}
