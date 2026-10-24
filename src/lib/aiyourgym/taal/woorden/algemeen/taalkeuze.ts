// De taalkeuze (NL | EN) op de website, in Club en in de ledenapp
// (src/components/aiyourgym/taal/TaalKeuze.tsx).

import { woordenboek } from '../../woordenboek'

export const TAALKEUZE = woordenboek({
  nl: {
    label: 'Taal',
    naam: { nl: 'Nederlands', en: 'English' },
    kort: { nl: 'NL', en: 'EN' },
  },
  en: {
    label: 'Language',
    naam: { nl: 'Nederlands', en: 'English' },
    kort: { nl: 'NL', en: 'EN' },
  },
})
