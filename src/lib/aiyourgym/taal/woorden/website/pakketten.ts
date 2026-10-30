// De teksten rond de losse pakketten op de website (prijzenpagina, aanmelden,
// prijs op maat). Naam, voor wie en wat erin zit staan per pakket in
// woorden/algemeen/pakketten.ts (gedeeld met Club); hier alleen de website.

import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { pakketInTaal } from '../algemeen/pakketten'
import { woordenboek } from '../../woordenboek'

export const PAKKET_TEKST = woordenboek({
  nl: {
    prijsOpMaat: 'Prijs op aanvraag',
    perVestiging: 'Per vestiging per maand, jaarcontract',
    bundel: 'Neem je alle zes, dan geldt een bundelprijs.',
    kies: 'Kies dit pakket',
    gekozen: 'Gekozen',
    weetNiet: 'Weet ik nog niet',
    alles: 'Alle pakketten',
    voorstel: 'Voorstel voor',
    soorten: {
      gym: 'Sportschool',
      boutique: 'Boutique studio',
      pt: 'PT-studio',
      keten: 'Keten',
      yoga: 'Yoga of pilates',
      vechtsport: 'Vechtsport',
      bootcamp: 'Bootcamp',
    },
  },
  en: {
    prijsOpMaat: 'Price on request',
    perVestiging: 'Per location per month, annual contract',
    bundel: 'Take all six and a bundle price applies.',
    kies: 'Choose this package',
    gekozen: 'Chosen',
    weetNiet: 'Not sure yet',
    alles: 'All packages',
    voorstel: 'Suggestion for',
    soorten: {
      gym: 'Gym',
      boutique: 'Boutique studio',
      pt: 'PT studio',
      keten: 'Chain',
      yoga: 'Yoga or pilates',
      vechtsport: 'Martial arts',
      bootcamp: 'Bootcamp',
    },
  },
})

/** Naam, voor wie en wat erin zit, in een taal. */
export function pakketTekst(sleutel: PakketSleutel, taal: 'nl' | 'en'): { naam: string; voorWie: string; inbegrepen: readonly string[] } {
  return pakketInTaal(sleutel, taal)
}
