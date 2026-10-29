import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'

/** Wat de pagina over een los pakket aan het formulier geeft: geen bedragen (besluit Kane). */
export interface PakketKeuze {
  sleutel: PakketSleutel
  naam: string
  voorWie: string
  inbegrepen: readonly string[]
  /** Heeft dit pakket een Stripe-prijs (en is er een sleutel)? */
  stripe: boolean
}

/** De gekozen pakketten samen: zo rondt de aanmelding af. */
export interface GekozenPakketten {
  /** "Groepslessen en Groei". */
  naam: string
  /** Online af te sluiten (Stripe voor alle gekozen pakketten, of een testbetaling)? Anders een aanvraag. */
  open: boolean
  /** Afronden met een testbetaling: Stripe is nog niet gekoppeld, er wordt niets afgeschreven. */
  test: boolean
}

export interface Invoer {
  pakketten: PakketSleutel[]
  sportschoolNaam: string
  aantalVestigingen: number
  slug: string
  /** Heeft de bezoeker het adres zelf aangepast? Dan volgt het de naam niet meer. */
  slugZelf: boolean
  eigenaarNaam: string
  eigenaarEmail: string
  eigenaarTelefoon: string
  wachtwoord: string
  wachtwoordHerhaal: string
  akkoord: boolean
  /** Onzichtbaar veld tegen robots. */
  website: string
}

export type Wijzig = <K extends keyof Invoer>(veld: K, waarde: Invoer[K]) => void
