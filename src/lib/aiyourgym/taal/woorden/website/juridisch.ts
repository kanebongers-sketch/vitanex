// De juridische pagina's ((site)/privacy en (site)/voorwaarden). De tekst zelf
// blijft Nederlands: juridische teksten vertalen we niet zonder akkoord van Kane
// (docs/aiyourgym/TALEN.md). In het Engels staan de paginakop, een korte melding en de
// conceptmelding in het Engels boven de Nederlandse tekst (lang="nl").

import { woordenboek } from '../../woordenboek'

export const JURIDISCH = woordenboek({
  nl: {
    privacyTitel: 'Privacy',
    privacyOmschrijving: 'Hoe AI Your Gym omgaat met gegevens van sportscholen, medewerkers en leden. Concepttekst.',
    voorwaardenTitel: 'Voorwaarden',
    voorwaardenOmschrijving: 'De afspraken tussen AI Your Gym en sportscholen die de software gebruiken. Concepttekst.',
    // Alleen in het Engels in beeld; in het Nederlands is de tekst er gewoon.
    alleenNederlands: 'Deze tekst is in het Nederlands.',
    // De kop boven de tekst zelf
    privacyLabel: 'Privacy',
    privacyKop: 'Privacy',
    privacyTekst: 'Hoe we omgaan met de gegevens van sportscholen, hun medewerkers en hun leden. In gewone taal.',
    privacySectie: 'Privacyverklaring',
    voorwaardenLabel: 'Voorwaarden',
    voorwaardenKop: 'Voorwaarden',
    voorwaardenTekst: 'De afspraken tussen AI Your Gym en de sportscholen die de software gebruiken.',
    voorwaardenSectie: 'Voorwaarden',
    // De conceptmelding (Concept in site/bouwstenen.tsx)
    concept: { kop: 'Concept.', tekst: 'Deze tekst is een eerste versie en nog niet juridisch gecontroleerd. Er kunnen geen rechten aan worden ontleend.' },
  },
  en: {
    privacyTitel: 'Privacy',
    privacyOmschrijving: 'How AI Your Gym handles the data of gyms, their staff and their members. Draft text, available in Dutch.',
    voorwaardenTitel: 'Terms',
    voorwaardenOmschrijving: 'The agreements between AI Your Gym and the gyms that use the software. Draft text, available in Dutch.',
    alleenNederlands: 'This legal text is currently available in Dutch only.',
    privacyLabel: 'Privacy',
    privacyKop: 'Privacy',
    privacyTekst: 'How we handle the data of gyms, their staff and their members. In plain language.',
    privacySectie: 'Privacy statement',
    voorwaardenLabel: 'Terms',
    voorwaardenKop: 'Terms',
    voorwaardenTekst: 'The agreements between AI Your Gym and the gyms that use the software.',
    voorwaardenSectie: 'Terms',
    concept: { kop: 'Draft.', tekst: 'This text is a first version and has not yet been checked by a lawyer. No rights can be derived from it.' },
  },
})
