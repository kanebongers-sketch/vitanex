// De kaders van de productbeelden (mockups/kaders.tsx, een clientcomponent): het
// bijschrift, het menu van Club in het browservenster en de tabbladen van de ledenapp.
// De plekken en schermen komen uit Club zelf (src/components/club/shell en het
// woordenboek van het menu, NL en EN), zodat het beeld altijd het echte menu laat
// zien: vijf plekken bovenin, de schermen van de plek eronder, rechts zoeken en
// het vraagteken voor Hulp. Tabbladen per Nederlandse naam (zo geven de schermen ze door).

import { ONDERDELEN, PLEKKEN, inMenu, type PlekSleutel } from '@/components/club/shell/onderdelen'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { woordenboek } from '../../../woordenboek'

type Taal = 'nl' | 'en'

function plekken(taal: Taal): Record<PlekSleutel, string> {
  return Object.fromEntries(PLEKKEN.map((p) => [p.sleutel, MENU[taal].plekken[p.sleutel].label])) as Record<PlekSleutel, string>
}

function schermen(taal: Taal): Record<string, string> {
  const namen: Readonly<Record<string, { label: string } | undefined>> = MENU[taal].onderdelen
  return Object.fromEntries(ONDERDELEN.filter(inMenu).map((o) => [o.sleutel, namen[o.sleutel]?.label ?? o.label]))
}

export const KADERS = woordenboek({
  nl: {
    bijschrift: 'Schermvoorbeeld met voorbeeldgegevens',
    plekken: plekken('nl'),
    onderdelen: schermen('nl'),
    zoeken: 'Zoeken',
    hulp: 'Hulp',
    tabs: {
      Home: 'Home',
      Boeken: 'Boeken',
      Schema: 'Schema',
      Voeding: 'Voeding',
      Profiel: 'Profiel',
    },
  },
  en: {
    bijschrift: 'Example screen with sample data',
    plekken: plekken('en'),
    onderdelen: schermen('en'),
    zoeken: 'Search',
    hulp: 'Help',
    tabs: {
      Home: 'Home',
      Boeken: 'Book',
      Schema: 'Programme',
      Voeding: 'Nutrition',
      Profiel: 'Profile',
    },
  },
})
