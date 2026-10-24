// De pagina Wat er nieuw is ((site)/nieuw/page.tsx). De punten zelf staan in
// beide talen in src/lib/aiyourgym/nieuw.ts (gedeeld met Wat is nieuw in Club).
// De namen van de hoofdstukken komen van de functiespagina en zijn daar vertaald.

import { woordenboek } from '../../woordenboek'

export const NIEUW_PAGINA = woordenboek({
  nl: {
    metaTitel: 'Wat er nieuw is',
    metaOmschrijving: 'Wat er elke maand bij AI Your Gym is bijgekomen. Alleen wat echt werkt, met de datum waarop het live ging.',
    label: 'Nieuw',
    titel: 'Wat er nieuw is.',
    tekst: (aantal: number) =>
      `Elke maand komt er iets bij. Hier staat wat er is gebouwd en nu werkt, met de datum waarop het live ging: ${aantal} onderdelen tot nu toe. Geen beloftes voor later.`,
    keerNieuw: (aantal: number) => `${aantal} keer nieuw`,
    bandTitel: 'Probeer het zelf, met alles wat er nu in zit.',
  },
  en: {
    metaTitel: 'What’s new',
    metaOmschrijving: 'What has been added to AI Your Gym each month. Only what really works, with the date it went live.',
    label: 'New',
    titel: 'What’s new.',
    tekst: (aantal: number) =>
      `Something is added every month. Here is what has been built and works today, with the date it went live: ${aantal} additions so far. No promises for later.`,
    keerNieuw: (aantal: number) => `${aantal} new`,
    bandTitel: 'Try it yourself, with everything that is in it today.',
  },
})
