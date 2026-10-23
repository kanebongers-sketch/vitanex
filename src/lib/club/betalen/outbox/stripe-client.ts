// ─── Club, lidgeld: de Stripe-aanroepen achter een kleine interface ─────────
// De inbox leest (StripeLezer), de outbox schrijft (StripeSchrijver). In tests
// staat hier een nep-Stripe tegenover (nep-stripe.ts) die idempotentiesleutels
// onthoudt zoals Stripe dat doet. De echte uitvoering is SERVER-ONLY.

import {
  annuleerBetaling,
  haalAccountUitkomst,
  haalGeschillen,
  haalObject,
  koppelBetaalmethodeLos,
  maakEersteBetaalSessie,
  maakIncasso,
  maakKlant,
  maakLidTerugbetaling,
  maakMachtigingSessie,
  verwijderKlant,
  type EersteBetalingInvoer,
  type IncassoInvoer,
  type KlantInvoer,
  type LidTerugbetalingInvoer,
  type MachtigingInvoer,
  type OphaalSoort,
  type StripeUitkomst,
} from '../stripe-api'

export interface StripeLezer {
  haal(account: string, soort: OphaalSoort, id: string): Promise<StripeUitkomst<unknown>>
  haalGeschillen(account: string, paymentIntent: string): Promise<StripeUitkomst<unknown>>
  /** Platformaanroep: het Connect-account zelf. */
  haalAccount(account: string): Promise<StripeUitkomst<unknown>>
}

export interface StripeSchrijver {
  maakKlant(account: string, sleutel: string, k: KlantInvoer): Promise<StripeUitkomst<{ id: string }>>
  maakEersteBetaalSessie(account: string, sleutel: string, c: EersteBetalingInvoer): Promise<StripeUitkomst<{ id: string; url: string }>>
  maakMachtigingSessie(account: string, sleutel: string, m: MachtigingInvoer): Promise<StripeUitkomst<{ id: string; url: string }>>
  maakIncasso(account: string, sleutel: string, i: IncassoInvoer): Promise<StripeUitkomst<{ id: string; status: string | null }>>
  maakTerugbetaling(account: string, sleutel: string, t: LidTerugbetalingInvoer): Promise<StripeUitkomst<{ id: string; status: string | null }>>
  verwijderKlant(account: string, sleutel: string, klant: string): Promise<StripeUitkomst<{ id: string }>>
  koppelBetaalmethodeLos(account: string, sleutel: string, betaalmethode: string): Promise<StripeUitkomst<{ id: string }>>
  annuleerBetaling(account: string, sleutel: string, paymentIntent: string): Promise<StripeUitkomst<{ id: string; status: string | null }>>
}

export interface StripeClient extends StripeLezer, StripeSchrijver {}

/** De echte Stripe met de geheime sleutel van het platform (SERVER-ONLY). */
export function echteStripe(geheim: string): StripeClient {
  return {
    haal: (account, soort, id) => haalObject(geheim, account, soort, id),
    haalGeschillen: (account, pi) => haalGeschillen(geheim, account, pi),
    haalAccount: (account) => haalAccountUitkomst(geheim, account),
    maakKlant: (account, sleutel, k) => maakKlant(geheim, account, sleutel, k),
    maakEersteBetaalSessie: (account, sleutel, c) => maakEersteBetaalSessie(geheim, account, sleutel, c),
    maakMachtigingSessie: (account, sleutel, m) => maakMachtigingSessie(geheim, account, sleutel, m),
    maakIncasso: (account, sleutel, i) => maakIncasso(geheim, account, sleutel, i),
    maakTerugbetaling: (account, sleutel, t) => maakLidTerugbetaling(geheim, account, sleutel, t),
    verwijderKlant: (account, sleutel, klant) => verwijderKlant(geheim, account, sleutel, klant),
    koppelBetaalmethodeLos: (account, sleutel, pm) => koppelBetaalmethodeLos(geheim, account, sleutel, pm),
    annuleerBetaling: (account, sleutel, pi) => annuleerBetaling(geheim, account, sleutel, pi),
  }
}
