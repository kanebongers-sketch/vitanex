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
    tekst: (aantal: number) => `Alleen wat live staat, met de datum. ${aantal} onderdelen tot nu toe, geen beloftes voor later.`,
    keerNieuw: (aantal: number) => `${aantal} keer nieuw`,
    bandTitel: 'Probeer alles wat er nu in zit.',
  },
  en: {
    metaTitel: 'What’s new',
    metaOmschrijving: 'What has been added to AI Your Gym each month. Only what really works, with the date it went live.',
    label: 'New',
    titel: 'What’s new.',
    tekst: (aantal: number) => `Only what is live, with the date. ${aantal} additions so far, no promises for later.`,
    keerNieuw: (aantal: number) => `${aantal} new`,
    bandTitel: 'Try everything that is in it today.',
  },
})
