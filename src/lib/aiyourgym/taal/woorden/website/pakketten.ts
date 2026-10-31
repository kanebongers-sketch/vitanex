// De teksten rond de basis met add-ons op de website (prijzenpagina, aanmelden,
// prijs op maat). Naam, voor wie en wat erin zit staan per pakket in
// woorden/algemeen/pakketten.ts (gedeeld met Club); hier alleen de website.

import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { pakketInTaal } from '../algemeen/pakketten'
import { woordenboek } from '../../woordenboek'

export const PAKKET_TEKST = woordenboek({
  nl: {
    prijsOpMaat: 'Prijs op aanvraag',
    perVestiging: 'Per vestiging per maand, jaarcontract',
    staffel: 'De prijs volgt een staffel per vestiging op het aantal actieve leden. Je ziet het bedrag bij Stripe voordat je betaalt.',
    kies: 'Kies dit pakket',
    gekozen: 'Gekozen',
    weetNiet: 'Weet ik nog niet',
    alles: 'Alle pakketten',
  },
  en: {
    prijsOpMaat: 'Price on request',
    perVestiging: 'Per location per month, annual contract',
    staffel: 'The price follows a tier per location based on the number of active members. You see the amount at Stripe before you pay.',
    kies: 'Choose this package',
    gekozen: 'Chosen',
    weetNiet: 'Not sure yet',
    alles: 'All packages',
  },
})

/** Naam, voor wie en wat erin zit, in een taal. */
export function pakketTekst(sleutel: PakketSleutel, taal: 'nl' | 'en'): { naam: string; voorWie: string; inbegrepen: readonly string[] } {
  return pakketInTaal(sleutel, taal)
}
