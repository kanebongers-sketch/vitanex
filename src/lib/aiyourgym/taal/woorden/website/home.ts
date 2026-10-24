// De secties van de voorpagina boven de vertrouwensblokken (src/components/aiyourgym/home):
// Oogopslag, SoortKeuze, Schemas en OokGeregeld. Het Nederlands komt waar het kan uit de
// bronnen in inhoud/ (daar staat ook waarom elke zin klopt); het Engels zegt hetzelfde,
// in dezelfde volgorde (de test controleert even lange lijsten).

import { DOELGROEPEN } from '@/components/aiyourgym/inhoud/doelgroepen'
import { ROLLEN } from '@/components/aiyourgym/inhoud/systeem'
import { OVERSTAP_STAPPEN } from '@/components/aiyourgym/inhoud/vertrouwen'
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

/** De snelle keuze per soort sportschool onder de held (home/SoortKeuze.tsx). Namen in de volgorde van DOELGROEPEN. */
export const SOORT_KEUZE = woordenboek({
  nl: {
    kop: 'Wat voor sportschool heb je?',
    namen: DOELGROEPEN.map((d) => d.naam),
  },
  en: {
    kop: 'What kind of gym do you run?',
    namen: ['Independent gym', 'Boutique studio', 'PT studio', 'Chain', 'Yoga, pilates and dance', 'Martial arts and boxing', 'Bootcamp and HIIT'],
  },
})

/**
 * Trainingsschema's met de blikvanger (home/Schemas.tsx). De kernpunten zelf komen uit de
 * oefenbibliotheek van Club en zijn nog Nederlands; dat zegt de regel `onder` in het Engels eerlijk.
 */
export const SCHEMAS = woordenboek({
  nl: {
    label: 'Trainingsschema’s',
    titel: { voor: 'Schema’s zoals een ', accent: 'trainer', na: ' ze geeft.' },
    lead: 'Bij elke oefening een figuur dat de beweging voordoet en de aanwijzingen van een goede trainer: genummerd, kort en in gewone taal.',
    onder: 'Echte tekst uit de oefenbibliotheek, aan te passen in de taal van je eigen trainers.',
    link: 'Zo werken trainingsschema’s',
    bereik: (van: number, tot: number) => `${van} tot ${tot}`,
    voorschrift: (sets: number, herhalingen: string, rustSec: number) => `${sets} x ${herhalingen}, ${rustSec} sec rust`,
  },
  en: {
    label: 'Training programmes',
    titel: { voor: 'Programmes the way a ', accent: 'trainer', na: ' delivers them.' },
    lead: 'Every exercise comes with a figure that demonstrates the movement and the cues of a good trainer: numbered, short and in plain language.',
    onder: 'Real text from the Club exercise library, shown in Dutch for now. Adapt it to the words your own trainers use.',
    link: 'How training programmes work',
    bereik: (van: number, tot: number) => `${van} to ${tot}`,
    voorschrift: (sets: number, herhalingen: string, rustSec: number) => `${sets} x ${herhalingen}, ${rustSec} sec rest`,
  },
})

/** Ledenapp en overstappen als twee korte vakken (home/OokGeregeld.tsx). Stappen in de volgorde van OVERSTAP_STAPPEN. */
export const OOK_GEREGELD = woordenboek({
  nl: {
    sectieLabel: 'Ledenapp en overstappen',
    app: {
      label: 'Ledenapp',
      titel: { voor: 'Reserveren, inchecken, trainen. ', accent: 'Een app.' },
      zin: 'In de naam en kleuren van je sportschool. Leden zetten hem met een tik op hun beginscherm, zonder app store.',
      punten: ['Reserveren met wachtlijst', 'Inchecken met QR', 'Eigen schema met coaching'],
      link: 'Alles over de ledenapp',
      beeldLabel: 'De ledenapp op een telefoon: het lesrooster van vandaag met vrije plekken, reserveren en een wachtlijst',
    },
    overstap: {
      label: 'Overstappen',
      titel: { voor: 'Overstappen ', accent: 'zonder gedoe.' },
      zin: 'Je ledenadministratie en incasso blijven waar ze zijn. In drie stappen staat je club erin.',
      stappen: OVERSTAP_STAPPEN.map((s) => s.titel),
      link: 'Zo stap je over',
    },
  },
  en: {
    sectieLabel: 'Member app and switching',
    app: {
      label: 'Member app',
      titel: { voor: 'Book, check in, train. ', accent: 'One app.' },
      zin: 'In your gym’s name and colours. Members add it to their home screen with one tap, no app store needed.',
      punten: ['Booking with a waiting list', 'Check-in with QR', 'Their own programme with coaching'],
      link: 'All about the member app',
      beeldLabel: 'The member app on a phone: today’s timetable with free spots, booking and a waiting list',
    },
    overstap: {
      label: 'Switching',
      titel: { voor: 'Switch ', accent: 'without the hassle.' },
      zin: 'Your membership admin and direct debits stay where they are. Three steps and your club is set up.',
      stappen: ['Import your member list', 'Run the set-up wizard', 'Get members on the app'],
      link: 'How to switch',
    },
  },
})
