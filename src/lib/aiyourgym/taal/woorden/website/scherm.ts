// Algemene schermen van de website: laden ((site)/loading.tsx), het foutscherm
// ((website)/error.tsx) en de tekst op de deelafbeelding ((site)/opengraph-image.tsx).
// Het foutscherm noemt geen merk: het kan ook verschijnen zolang de site geheim is.

import { woordenboek } from '../../woordenboek'

export const SCHERM = woordenboek({
  nl: {
    laden: 'Laden',
    foutTitel: 'Er ging iets mis',
    foutTekst: 'Probeer het opnieuw. Blijft het misgaan, kom dan later nog eens terug.',
    opnieuw: 'Probeer opnieuw',
    deelKop: 'Alles voor je sportschool, in een systeem.',
    deelEu: 'Database binnen de EU',
  },
  en: {
    laden: 'Loading',
    foutTitel: 'Something went wrong',
    foutTekst: 'Please try again. If it keeps going wrong, come back a little later.',
    opnieuw: 'Try again',
    deelKop: 'Everything for your gym, in one system.',
    deelEu: 'Database in the EU',
  },
})
