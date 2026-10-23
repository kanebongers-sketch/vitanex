import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'

/** Wat de pagina over een pakket aan het formulier geeft: geen bedragen (besluit Kane). */
export interface PakketKeuze {
  sleutel: PakketSleutel
  naam: string
  voorWie: string
  inbegrepen: readonly string[]
  maxVestigingen: number
  /** Geen grens aan vestigingen in het pakket (online starten kan tot maxVestigingen). */
  onbeperkt: boolean
  aanbevolen: boolean
  /** Online af te sluiten (Stripe-prijs ingesteld, of een testbetaling)? Anders een aanvraag. */
  open: boolean
  /** Afronden met een testbetaling: Stripe is nog niet gekoppeld, er wordt niets afgeschreven. */
  test: boolean
}

export interface Invoer {
  pakket: PakketSleutel | ''
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
