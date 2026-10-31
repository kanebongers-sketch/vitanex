// De pagina Voor wie ((site)/voor-wie/page.tsx).
// Het Nederlands van de soorten sportscholen is DOELGROEPEN uit inhoud/doelgroepen.ts
// (ook gebruikt door de voorpagina, blijft de bron). Het korte woord voor de kop van
// de voorpagina (kort) staat in ./held.ts; het pakket per soort blijft in DOELGROEPEN.
// Het Engels zegt precies hetzelfde, niets meer.

import { DOELGROEPEN, type DoelgroepSleutel } from '@/components/aiyourgym/inhoud/doelgroepen'
import { woordenboek } from '../../woordenboek'

interface DoelgroepTekst {
  naam: string
  wie: string
  kop: string
  punten: readonly string[]
}

function perSleutel(): Record<DoelgroepSleutel, DoelgroepTekst> {
  return Object.fromEntries(DOELGROEPEN.map(({ sleutel, naam, wie, kop, punten }) => [sleutel, { naam, wie, kop, punten }])) as Record<DoelgroepSleutel, DoelgroepTekst>
}

const NL_DOELGROEPEN: Record<DoelgroepSleutel, DoelgroepTekst> = perSleutel()

export const VOOR_WIE = woordenboek({
  nl: {
    metaTitel: 'Voor wie',
    metaOmschrijving:
      'AI Your Gym voor een zelfstandige sportschool, boutique studio, PT-studio, keten, yoga- of pilatesstudio, vechtsportschool of bootcamp.',
    label: 'Voor wie',
    titel: 'Voor elke sportschool die het goed wil regelen.',
    tekst: 'Dezelfde software, ingericht op jouw soort club.',
    soortenLabel: 'Soorten sportscholen op deze pagina',
    doelgroepen: NL_DOELGROEPEN,
    pastBij: 'Past meestal bij',
    basisPlus: 'de basis plus',
    alleenBasis: 'de basis',
    beeld: {
      zelfstandig: 'De check-in met de leden die net binnen zijn en hun status',
      boutique: 'Een week van het lesrooster met de bezetting per les en volle lessen met wachtlijst',
      'pt-studio': 'Een oefening met genummerde kernpunten, ademhaling en tempo, zoals in Club',
      keten: 'Het personeelsrooster met diensten en de status van de uren',
      yoga: 'De ledenapp op een telefoon met de lessen van vandaag, vrije plekken en knoppen om te reserveren of op de wachtlijst te gaan',
      vechtsport: 'De opvolglijst van vandaag met leden en de reden om ze aan te spreken',
      bootcamp: 'De cijfers van een kalendermaand met tegels en een staafgrafiek',
    },
    aanpassenLabel: 'Alles aan te passen',
    aanpassenTitel: 'Onze basis als start. Jouw club als eindresultaat.',
    aanpassenTekst: 'In de startwizard kies je alles zelf. Daarna maak je het helemaal van jezelf.',
    aanpassen: [
      { titel: 'Onderdelen aan of uit', tekst: 'Wat je niet gebruikt, ziet niemand.' },
      { titel: 'Eigen oefeningen en coaching', tekst: 'Onze bibliotheek als basis, jouw teksten erbij.' },
      { titel: 'Lessen, regels en huisstijl', tekst: 'Jouw zalen, tijden, regels, logo en kleuren.' },
    ],
    band: 'Welke sportschool je ook hebt: zet hem er vandaag in.',
  },
  en: {
    metaTitel: 'Who it’s for',
    metaOmschrijving:
      'AI Your Gym for an independent gym, boutique studio, PT studio, chain, yoga or Pilates studio, martial arts school or bootcamp.',
    label: 'Who it’s for',
    titel: 'For every gym that wants to get it right.',
    tekst: 'The same software, set up for your kind of club.',
    soortenLabel: 'Types of gym on this page',
    doelgroepen: {
      zelfstandig: {
        naam: 'Independent gym',
        wie: 'One location and a small team for floor and front desk.',
        kop: 'One system for the whole shift, from opening to closing.',
        punten: [
          'QR check-in, with instant access checks on the membership',
          'Daily tasks, closing round and cleaning rota in one table',
          'A follow-up list for new members and anyone who stays away',
        ],
      },
      boutique: {
        naam: 'Boutique studio',
        wie: 'Classes come first, in small groups.',
        kop: 'Full classes, fewer empty spots.',
        punten: [
          'A timetable per room with a waiting list and your cancellation rules',
          'Members book themselves and move up automatically',
          'Attendance per class and per calendar month',
        ],
      },
      'pt-studio': {
        naam: 'PT studio',
        wie: 'Personal training and small groups, where guidance makes the difference.',
        kop: 'Every member a programme with a trainer inside.',
        punten: [
          'Intake with measurements, only with the member’s consent',
          'Coaching for every exercise: cues, mistakes, breathing',
          'Nutrition plan, appointments and progress per member',
        ],
      },
      keten: {
        naam: 'Chain',
        wie: 'Several locations with club managers and central administration.',
        kop: 'Every location its own rules, one place for the overview.',
        punten: [
          'Memberships decide where a member can train',
          'Permissions per role: you decide what a club manager sees',
          'Approve hours and export them for payroll',
        ],
      },
      yoga: {
        naam: 'Yoga, Pilates and dance',
        wie: 'Regular classes and small groups, where calm counts.',
        kop: 'Your classes full, without messages back and forth.',
        punten: [
          'A timetable per room with spots and a waiting list',
          'Members book and cancel themselves, following your rules',
          'A member app with your studio’s name and colours',
        ],
      },
      vechtsport: {
        naam: 'Martial arts and boxing',
        wie: 'Training per group and level, with regular members.',
        kop: 'Every group on the mat on time, every member in view.',
        punten: [
          'Classes per group and room, with a waiting list',
          'A member card with visits and notes from the trainers',
          'Challenges and badges in the app',
        ],
      },
      bootcamp: {
        naam: 'Bootcamp and HIIT',
        wie: 'Short, intense group sessions with a full schedule.',
        kop: 'Full groups and members who come back.',
        punten: [
          'A waiting list that moves up by itself',
          'Follow-up rules for trial members and anyone dropping out',
          'Attendance and no-shows per calendar month',
        ],
      },
    },
    pastBij: 'Usually a good fit for',
    basisPlus: 'the core plus',
    alleenBasis: 'the core',
    beeld: {
      zelfstandig: 'Check-in showing the members who just arrived and their status',
      boutique: 'A week of the timetable with attendance per class and full classes with a waiting list',
      'pt-studio': 'An exercise with numbered coaching cues, breathing and tempo, as shown in Club',
      keten: 'The staff rota with shifts and the status of the hours',
      yoga: 'The member app on a phone with today’s classes, free spots and buttons to book or join the waiting list',
      vechtsport: 'Today’s follow-up list with members and the reason to speak to them',
      bootcamp: 'The figures for a calendar month with tiles and a bar chart',
    },
    aanpassenLabel: 'Fully adjustable',
    aanpassenTitel: 'Our base as the start. Your club as the result.',
    aanpassenTekst: 'In the set-up wizard you choose everything yourself. Then you make it entirely your own.',
    aanpassen: [
      { titel: 'Modules on or off', tekst: 'What you don’t use, nobody sees.' },
      { titel: 'Your own exercises and coaching', tekst: 'Our library as the base, your texts on top.' },
      { titel: 'Classes, rules and branding', tekst: 'Your rooms, hours, rules, logo and colours.' },
    ],
    band: 'Whatever kind of gym you run: bring it on board today.',
  },
})
