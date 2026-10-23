// ─── Club, lidgeld-inbox: wat de inbox van de database nodig heeft ──────────
// Een kleine interface, zodat de verwerking zonder database te testen is
// (nep-opslag.ts) en de echte uitvoering (opslag-supabase.ts) alleen SQL-
// aanroepen doet. Leesacties gooien een fout als de database niet antwoordt;
// de verwerker maakt daar 'opnieuw' van.

import type { AccountStand } from '../stripe-event'
import type { InboxEvent, InboxObject } from './event'
import type { BetalingRij } from './koppeling'
import type { BetaalStatus, Terugbetaling } from './overgang'
import type { MandaatStatus } from './stripe-stand'

/** Een geclaimde rij uit club_betalen_stripe_events. */
export interface InboxRij {
  eventId: string
  type: string
  object: InboxObject
  account: string | null
  objectId: string
  livemode: boolean
  /** Eerdere pogingen (0 bij de eerste keer). */
  pogingen: number
}

export type InboxEindStatus = 'verwerkt' | 'afwijkend' | 'genegeerd'

export type InboxAfloop =
  | { status: InboxEindStatus; reden: string | null }
  | { status: 'opnieuw'; reden: string; volgendeOp: Date }
  | { status: 'vast'; reden: string }

export interface BetalingWijziging {
  organisatieId: string
  betalingId: string
  factuurId: string | null
  /** De status die wij lazen: elke stap lukt alleen als de database nog daar staat. */
  van: BetaalStatus
  naar: BetaalStatus
  /** Alle statussen die we passeren, een stap per keer (zie overgang.ts). */
  pad: BetaalStatus[]
  /** Terugbetalingen om te boeken, uniek per id van Stripe. */
  nieuweTerug: Terugbetaling[]
  paymentIntent: string | null
  eventId: string
}

export interface MachtigingVastlegging {
  organisatieId: string
  contractId: string | null
  klant: string
  betaalmethode: string
  mandaat: string
  soort: string
  laatste4: string | null
  setupIntent: string
}

export interface MachtigingWijziging {
  organisatieId: string
  mandaat: string | null
  betaalmethode: string | null
  status: MandaatStatus
}

export interface InboxOpslag {
  /** Rij met status 'ontvangen'; 'dubbel' als het event er al is. */
  bewaar(e: InboxEvent): Promise<'nieuw' | 'dubbel' | 'fout'>
  /** Rijen claimen: elke rij hooguit bij een verwerker tegelijk (een event: alleen dat event). */
  claim(max: number, eventId?: string): Promise<InboxRij[]>
  rond(rij: InboxRij, afloop: InboxAfloop): Promise<void>
  sportschoolVanAccount(account: string): Promise<string | null>
  accountVanSportschool(organisatieId: string): Promise<string | null>
  betaling(betalingId: string): Promise<BetalingRij | null>
  /**
   * Stap voor stap vooruit, met de boekingen. 'verouderd' = iemand was ons voor
   * (opnieuw lezen); 'afwijkend' = de database weigert de stap.
   */
  pasBetalingToe(w: BetalingWijziging): Promise<'ok' | 'verouderd' | 'afwijkend'>
  werkAccountStandBij(stand: AccountStand): Promise<void>
  accountOntkoppeld(account: string): Promise<void>
  /** 'onbekend' = de Stripe-klant hoort bij geen lid van deze sportschool. */
  legMachtigingVast(m: MachtigingVastlegging): Promise<'ok' | 'onbekend'>
  werkMachtigingBij(m: MachtigingWijziging): Promise<void>
  /** Een terugbetaling van een losse verkoop (bestaande databasefunctie). */
  verkoopTerugbetaald(paymentIntent: string, account: string, terugCent: number): Promise<void>
  /** Iets klopt niet: vastleggen voor Kane (zonder persoonsgegevens). */
  meld(wat: string): Promise<void>
}
