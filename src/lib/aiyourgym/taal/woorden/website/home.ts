// De oogopslag op de voorpagina (src/components/aiyourgym/home/Oogopslag.tsx). De
// schemabouw staat in dag.ts. Het Nederlands komt waar het kan uit de
// bronnen in inhoud/ (daar staat ook waarom elke zin klopt); het Engels zegt hetzelfde,
// in dezelfde volgorde (de test controleert even lange lijsten).

import { ROLLEN } from '@/components/aiyourgym/inhoud/systeem'
import { woordenboek } from '../../woordenboek'

/** Wat AI Your Gym is, in een oogopslag (home/Oogopslag.tsx). Rollen in de volgorde van ROLLEN. */
export const OOGOPSLAG = woordenboek({
  nl: {
    label: 'In een oogopslag',
    titel: { voor: 'Vijf plekken. ', accent: 'Een', na: ' systeem.' },
    lead: 'Balie, vloer, trainers, eigenaar en leden werken in dezelfde gegevens. Niets dubbel, niets overtypen.',
    rollen: ROLLEN.map((r) => ({ naam: r.naam, kop: r.kop })),
    meerLabel: 'Meer over AI Your Gym',
    functies: 'Alle functies',
    voorWie: 'Voor wie',
  },
  en: {
    label: 'At a glance',
    titel: { voor: 'Five places. ', accent: 'One', na: ' system.' },
    lead: 'Front desk, gym floor, trainers, owner and members all work from the same data. Nothing twice, nothing retyped.',
    rollen: [
      { naam: 'Front desk', kop: 'QR check-in, the member card and notes for the next shift.' },
      { naam: 'Gym floor', kop: 'Classes with a waiting list, shifts and today’s tasks.' },
      { naam: 'Trainer', kop: 'From intake to programme, with coaching for every exercise.' },
      { naam: 'Owner', kop: 'Monthly figures, permissions per role and your own branding.' },
      { naam: 'Member', kop: 'An app in your name: booking, check-in and their own programme.' },
    ],
    meerLabel: 'More about AI Your Gym',
    functies: 'All features',
    voorWie: 'Who it’s for',
  },
})
