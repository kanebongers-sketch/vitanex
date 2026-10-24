// De juridische pagina's ((site)/privacy en (site)/voorwaarden). De tekst zelf
// blijft Nederlands: juridische teksten vertalen we niet zonder akkoord van Kane
// (docs/aiyourgym/TALEN.md). Op /en staat alleen een korte Engelse melding erboven,
// en de titel en omschrijving zijn Engels.

import { woordenboek } from '../../woordenboek'

export const JURIDISCH = woordenboek({
  nl: {
    privacyTitel: 'Privacy',
    privacyOmschrijving: 'Hoe AI Your Gym omgaat met gegevens van sportscholen, medewerkers en leden. Concepttekst.',
    voorwaardenTitel: 'Voorwaarden',
    voorwaardenOmschrijving: 'De afspraken tussen AI Your Gym en sportscholen die de software gebruiken. Concepttekst.',
    // Alleen in het Engels in beeld; in het Nederlands is de tekst er gewoon.
    alleenNederlands: 'Deze tekst is in het Nederlands.',
  },
  en: {
    privacyTitel: 'Privacy',
    privacyOmschrijving: 'How AI Your Gym handles the data of gyms, their staff and their members. Draft text, available in Dutch.',
    voorwaardenTitel: 'Terms',
    voorwaardenOmschrijving: 'The agreements between AI Your Gym and the gyms that use the software. Draft text, available in Dutch.',
    alleenNederlands: 'This legal text is currently available in Dutch only.',
  },
})
