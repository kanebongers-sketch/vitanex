// ─── Club, lidgeld-inbox: klopt dit Stripe-object bij onze betaling? (PUUR) ─
// Metadata alleen is niet genoeg: account, sportschool, factuur, bedrag, valuta,
// livemode en (als we hem al kennen) de PaymentIntent moeten allemaal kloppen.
// Klopt er iets niet, dan wordt het event 'afwijkend' en boeken we niets.
// De reden bevat alleen een woord, nooit gegevens van een lid.

import type { BetaalBron } from './stripe-stand'
import type { BetaalStatus } from './overgang'

/** Onze betaling, zoals de database hem kent. */
export interface BetalingRij {
  id: string
  organisatieId: string
  factuurId: string | null
  bedragCent: number
  status: BetaalStatus
  /** Ids van terugbetalingen die al in het kasboek staan. */
  terugIds: readonly string[]
  /** Al gekoppelde PaymentIntent (na de outbox), of null. */
  paymentIntent: string | null
}

export interface KoppelControle {
  betaling: BetalingRij
  bron: BetaalBron
  /** Het account van het event. */
  eventAccount: string
  /** Het account dat bij de sportschool van de betaling hoort. */
  accountVanSportschool: string | null
  liveVerwacht: boolean
}

export type KoppelReden = 'account' | 'sportschool' | 'factuur' | 'bedrag' | 'valuta' | 'livemode' | 'intent'

/** null = alles klopt; anders de eerste reden waarom niet. */
export function controleerKoppeling(c: KoppelControle): KoppelReden | null {
  const { betaling, bron } = c
  if (!c.accountVanSportschool || c.accountVanSportschool !== c.eventAccount) return 'account'
  if (bron.meta.organisatieId !== betaling.organisatieId) return 'sportschool'
  if (bron.meta.factuurId !== betaling.factuurId) return 'factuur'
  if (bron.livemode !== c.liveVerwacht) return 'livemode'
  if (bron.valuta !== 'eur') return 'valuta'
  if (bron.bedragCent !== betaling.bedragCent) return 'bedrag'
  if (betaling.paymentIntent && bron.paymentIntent && betaling.paymentIntent !== bron.paymentIntent) return 'intent'
  return null
}
