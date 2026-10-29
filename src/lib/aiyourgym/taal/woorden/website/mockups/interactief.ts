// De interactieve delen van de productbeelden (clientcomponenten, daarom een eigen klein
// bestand): de huisstijl-demo (mockups/HuisstijlDemo.tsx). Kleurnamen in de volgorde
// van STALEN (mockups/stalen.ts).

import { STALEN } from '@/components/aiyourgym/mockups/stalen'
import { woordenboek } from '../../../woordenboek'

export const HUISSTIJL_DEMO = woordenboek({
  nl: {
    kiesKleur: 'Kies een kleur',
    thema: 'Thema',
    donker: 'Donker',
    licht: 'Licht',
    donkerKlein: 'donker',
    lichtKlein: 'licht',
    stalen: STALEN.map((s) => s.naam),
    aangepast: (naam: string) => `${naam} is iets bijgesteld, zodat knoppen en tekst goed leesbaar blijven.`,
    goed: (naam: string, thema: string) => `${naam} op ${thema}: genoeg contrast, zo overgenomen.`,
  },
  en: {
    kiesKleur: 'Choose a colour',
    thema: 'Theme',
    donker: 'Dark',
    licht: 'Light',
    donkerKlein: 'dark',
    lichtKlein: 'light',
    stalen: ['Iron', 'Coral', 'Ocean', 'Raspberry', 'Purple', 'Gold'],
    aangepast: (naam: string) => `${naam} has been adjusted slightly so buttons and text stay easy to read.`,
    goed: (naam: string, thema: string) => `${naam} on ${thema}: enough contrast, used as is.`,
  },
})
