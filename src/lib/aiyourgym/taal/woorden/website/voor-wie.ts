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
      'AI Your Gym voor een zelfstandige sportschool, boutique studio, PT-studio, keten, yoga- of pilatesstudio, vechtsportschool of bootcamp: wat elk soort sportschool aan de software heeft.',
    label: 'Voor wie',
    titel: 'Voor elke sportschool die het goed wil regelen.',
    tekst: 'Een zelfstandige gym, een boutique studio, een PT-studio, een keten, een yogastudio, een vechtsportschool of een bootcamp: dezelfde software, ingericht op jouw manier.',
    soortenLabel: 'Soorten sportscholen op deze pagina',
    doelgroepen: NL_DOELGROEPEN,
    pastBij: 'Past meestal bij',
    probeerPakket: (pakket: string) => `Probeer ${pakket} gratis`,
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
    aanpassenTekst:
      'Je begint niet met een leeg scherm. In de startwizard kies je je soort sportschool, en die zet onderdelen, lestypen, openingstijden en rechten alvast klaar. Daarna maak je het helemaal van jezelf.',
    aanpassen: [
      { titel: 'Onderdelen aan of uit', tekst: 'Wat je niet gebruikt zet je uit. Dan zien je team en je leden het nergens.' },
      { titel: 'Eigen oefeningen en coaching', tekst: 'Begin met onze bibliotheek en voeg je eigen oefeningen en coachteksten toe.' },
      { titel: 'Lessen, zalen en regels', tekst: 'Jouw lestypen, zalen, openingstijden en regels voor reserveren en annuleren.' },
      { titel: 'Jouw huisstijl', tekst: 'Naam, logo en accentkleur in de software en in de ledenapp.' },
    ],
    band: 'Welke sportschool je ook hebt: probeer het zelf.',
  },
  en: {
    metaTitel: 'Who it’s for',
    metaOmschrijving:
      'AI Your Gym for an independent gym, boutique studio, PT studio, chain, yoga or Pilates studio, martial arts school or bootcamp: what each kind of gym gets from the software.',
    label: 'Who it’s for',
    titel: 'For every gym that wants to get it right.',
    tekst: 'An independent gym, a boutique studio, a PT studio, a chain, a yoga studio, a martial arts school or a bootcamp: the same software, set up your way.',
    soortenLabel: 'Types of gym on this page',
    doelgroepen: {
      zelfstandig: {
        naam: 'Independent gym',
        wie: 'One location, a small team that runs the floor and the front desk together.',
        kop: 'One system for the whole shift, from opening to closing.',
        punten: [
          'Check-in with the QR code on the phone, and see straight away whether the membership gives access',
          'Daily tasks, closing round and cleaning rota in one table per day or per week',
          'A follow-up list with new members, trial members and members you haven’t seen in a while',
          'A member app with your name, logo and colours',
        ],
      },
      boutique: {
        naam: 'Boutique studio',
        wie: 'Classes come first: spinning, yoga, HIIT or strength in small groups.',
        kop: 'Full classes, fewer empty spots and no fuss with lists.',
        punten: [
          'A timetable per room with spots, a waiting list and your rules for cancellations and no-shows',
          'Members book in the app themselves and move up from the waiting list automatically',
          'Confirmations and reminders by email',
          'Challenges such as weeks in a row, with progress in the app',
          'Attendance per class and per calendar month in the figures',
        ],
      },
      'pt-studio': {
        naam: 'PT studio',
        wie: 'Personal training and small groups, where guidance makes the difference.',
        kop: 'Every member a programme with a trainer inside.',
        punten: [
          'Intakes with measurements and health questions, only with the member’s consent',
          'A draft programme from the intake, which the trainer adjusts',
          'Coaching for every exercise: cues, mistakes with the correction, breathing and tempo',
          'A nutrition plan per member with a calculator and templates',
          'Booking appointments with a trainer and progress on a timeline',
        ],
      },
      keten: {
        naam: 'Chain',
        wie: 'Several locations, club managers per location and central administration.',
        kop: 'Every location its own rules, one place for the overview.',
        punten: [
          'Each location with its own rooms, classes, opening hours and rules',
          'Memberships that decide at which locations a member can train',
          'Permissions per role: the owner decides what a club manager sees',
          'Staff rota with hours you approve and export for payroll',
          'Reports per calendar month, exportable as CSV',
        ],
      },
      yoga: {
        naam: 'Yoga, Pilates and dance',
        wie: 'A studio with regular classes and small groups, where calm and a good atmosphere count.',
        kop: 'Your classes full, without lists or messages back and forth.',
        punten: [
          'A timetable per room with a maximum number of spots and a waiting list',
          'Members book and cancel in the app themselves, following your rules',
          'A member app with your studio’s name, logo and colours',
          'Challenges such as weeks in a row, with progress in the app',
          'Attendance per class and per calendar month in the figures',
        ],
      },
      vechtsport: {
        naam: 'Martial arts and boxing',
        wie: 'Training per group and level, with regular members who turn up week after week.',
        kop: 'Every group on the mat on time, every member in view.',
        punten: [
          'Classes per group and room, with a maximum number of spots and a waiting list',
          'Check-in with the QR code and see whether the membership gives access',
          'A member card with visits, labels and notes from the trainers',
          'A follow-up list for members you haven’t seen in a while',
          'Challenges and badges that members see in the app',
        ],
      },
      bootcamp: {
        naam: 'Bootcamp and HIIT',
        wie: 'Short, intense group sessions with a full schedule and plenty of energy.',
        kop: 'Full groups, steady rhythms and members who come back.',
        punten: [
          'A timetable with spots per session and a waiting list that moves up by itself',
          'Members book in the app and get a confirmation',
          'Challenges such as a number of workouts per month',
          'Automations for trial members and members dropping out, with your thresholds',
          'Attendance and no-shows per calendar month in the figures and reports',
        ],
      },
    },
    pastBij: 'Usually a good fit for',
    probeerPakket: (pakket: string) => `Try ${pakket} for free`,
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
    aanpassenTekst:
      'You don’t start with a blank screen. In the set-up wizard you choose your type of gym, and it prepares modules, class types, opening hours and permissions for you. Then you make it entirely your own.',
    aanpassen: [
      { titel: 'Modules on or off', tekst: 'Switch off what you don’t use. Then your team and members won’t see it anywhere.' },
      { titel: 'Your own exercises and coaching', tekst: 'Start with our library and add your own exercises and coaching texts.' },
      { titel: 'Classes, rooms and rules', tekst: 'Your class types, rooms, opening hours and rules for booking and cancelling.' },
      { titel: 'Your branding', tekst: 'Name, logo and accent colour in the software and in the member app.' },
    ],
    band: 'Whatever kind of gym you run: try it for yourself.',
  },
})
