// Kop en menu van de verkoopwebsite (src/components/aiyourgym/site/AygKop.tsx en AygNav.tsx).

import { woordenboek } from '../../woordenboek'

/** De sleutels van de hoofdpagina's in het menu, in vaste volgorde (paden in site/paden.ts). */
export const MENU_SLEUTELS = ['functies', 'schemas', 'voorWie', 'ledenapp', 'prijzen', 'overstappen'] as const
export type MenuSleutel = (typeof MENU_SLEUTELS)[number]

export const KOP = woordenboek({
  nl: {
    overslaan: 'Naar de inhoud',
    logoLabel: 'AI Your Gym, naar de voorpagina',
    hoofdmenu: 'Hoofdmenu',
    menuPaneel: 'Menu',
    menu: 'Menu',
    sluit: 'Sluit',
    liveDemo: 'Live demo',
    planDemo: { voor: 'Plan ', lang: 'een gratis ', na: 'demo' },
    planDemoVol: 'Plan een gratis demo',
    probeer: 'Probeer gratis',
    probeerDagen: (dagen: number) => `Probeer ${dagen} dagen gratis`,
    ofLiveDemo: 'Of bekijk de live demo',
    links: {
      functies: { label: 'Functies', uitleg: 'Beheer, coaching, planning, groei en betrokkenheid' },
      schemas: { label: 'Schema’s', uitleg: 'Van intake tot voortgang, met coaching per oefening' },
      voorWie: { label: 'Voor wie', uitleg: 'Van gym en PT-studio tot yoga, vechtsport en keten' },
      ledenapp: { label: 'Ledenapp', uitleg: 'Een web-app in jouw huisstijl' },
      prijzen: { label: 'Prijzen', uitleg: 'Drie pakketten, een prijs op maat' },
      overstappen: { label: 'Overstappen', uitleg: 'Zo zet je je club erin' },
    },
  },
  en: {
    overslaan: 'Skip to content',
    logoLabel: 'AI Your Gym, back to the home page',
    hoofdmenu: 'Main menu',
    menuPaneel: 'Menu',
    menu: 'Menu',
    sluit: 'Close',
    liveDemo: 'Live demo',
    planDemo: { voor: 'Book ', lang: 'a free ', na: 'demo' },
    planDemoVol: 'Book a free demo',
    probeer: 'Try it free',
    probeerDagen: (dagen: number) => `Try it free for ${dagen} days`,
    ofLiveDemo: 'Or explore the live demo',
    links: {
      functies: { label: 'Features', uitleg: 'Management, coaching, planning, growth and engagement' },
      schemas: { label: 'Programmes', uitleg: 'From intake to progress, with coaching for every exercise' },
      voorWie: { label: 'Who it’s for', uitleg: 'From gyms and PT studios to yoga, martial arts and chains' },
      ledenapp: { label: 'Member app', uitleg: 'A web app in your own branding' },
      prijzen: { label: 'Pricing', uitleg: 'Three plans, priced for your club' },
      overstappen: { label: 'Switching', uitleg: 'How to move your club across' },
    },
  },
})
