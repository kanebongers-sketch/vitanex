// De opening van de voorpagina (src/components/aiyourgym/home/Held.tsx en HeldRoutes.tsx).
// Het label staat naast de kloktijd 06:00 (de voorpagina is een werkdag, zie dag.ts).
// Het wisselende woord komt in het Nederlands uit DOELGROEPEN (inhoud/doelgroepen.ts),
// in dezelfde volgorde; het Engels heeft evenveel woorden (de test controleert dat).

import { DOELGROEPEN } from '@/components/aiyourgym/inhoud/doelgroepen'
import { woordenboek } from '../../woordenboek'

export const HELD = woordenboek({
  nl: {
    label: 'Clubsoftware voor sportscholen',
    titelVoorlezen: 'Alles voor je sportschool, in een systeem.',
    titelVoor: 'Alles voor je',
    titelStart: 'sportschool',
    titelNa: 'in een systeem.',
    wisselWoorden: DOELGROEPEN.map((d) => d.kort),
    lead: 'Check-in, lessen, rooster, trainingsschema’s met coaching en een ledenapp in jouw naam en kleuren.',
    beeldLabel:
      'AI Your Gym in een samengesteld beeld van voorbeeldsportschool Kernhal: het scherm Vandaag met tegels, de lessen van de dag met bezetting en een ledenkaart, de ledenapp op een telefoon met de QR-code om in te checken, en het eerste check-in van de dag',
    bijschrift: 'Schermvoorbeeld met voorbeeldgegevens',
    routesLabel: 'Andere routes',
    overstappen: { kop: 'Heb je al software?', tekst: 'Zo stap je over', extra: '' },
    demo: { kop: 'Eerst rondkijken?', tekst: 'Live demo', extra: ', zonder account' },
  },
  en: {
    label: 'Club software for gyms',
    titelVoorlezen: 'Everything for your gym, in one system.',
    titelVoor: 'Everything for your',
    titelStart: 'gym',
    titelNa: 'in one system.',
    wisselWoorden: ['gym', 'boutique studio', 'PT studio', 'chain', 'yoga studio', 'martial arts school', 'bootcamp'],
    lead: 'Check-in, classes, staff rota, training programmes with coaching and a member app in your name and colours.',
    beeldLabel:
      'AI Your Gym in one composite image for the example gym Kernhal: the Today screen with tiles, the day’s classes with attendance and a member card, the member app on a phone with the QR code for check-in, and the first check-in of the day',
    bijschrift: 'Example screens with sample data',
    routesLabel: 'Other ways in',
    overstappen: { kop: 'Already using software?', tekst: 'How to switch', extra: '' },
    demo: { kop: 'Want a look first?', tekst: 'Live demo', extra: ', no account needed' },
  },
})
