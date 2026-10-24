// De 404 van de website (src/app/(aiyourgym)/(website)/not-found.tsx). De neutrale
// variant (schakelaar uit) noemt geen merk.

import { woordenboek } from '../../woordenboek'

export const NIET_GEVONDEN = woordenboek({
  nl: {
    neutraalTitel: 'Pagina niet gevonden',
    neutraalTekst: 'Deze pagina bestaat niet.',
    titel: 'Deze pagina bestaat niet.',
    tekst: 'Misschien is hij verplaatst, of klopt het adres net niet. Op de voorpagina vind je alles over AI Your Gym.',
    naarVoorpagina: 'Naar de voorpagina',
    bekijkDemo: 'Bekijk de demo',
  },
  en: {
    neutraalTitel: 'Page not found',
    neutraalTekst: 'This page does not exist.',
    titel: 'This page does not exist.',
    tekst: 'It may have moved, or the address is not quite right. The home page has everything about AI Your Gym.',
    naarVoorpagina: 'Go to the home page',
    bekijkDemo: 'View the demo',
  },
})
