// De voorpagina in kleurhoofdstukken (src/components/aiyourgym/voorpagina, richting
// "Kleurhoofdstukken" 28-10-2026). Kort (besluit Kane 21-10-2026): held, vier
// productblokken, een band met feiten, wie het bouwt en de oproep. Alle schermen
// tonen Kernhal, een verzonnen sportschool in Utrecht, en zeggen dat ook.
// Elk feit in de band staat in de code (zie voorpagina/Feiten.tsx).

import { woordenboek } from '../../woordenboek'

export const VOORPAGINA = woordenboek({
  nl: {
    held: {
      titel: ['Je club,', 'een systeem.'],
      lead: 'Clubsoftware voor sportscholen: check-in, lessen, rooster, trainingsschema’s met coaching en een ledenapp in jouw naam en kleuren.',
      probeer: (dagen: number) => `Probeer ${dagen} dagen gratis`,
      demo: 'Live demo bekijken',
      beeldLabel:
        'Het scherm Vandaag van Club voor Kernhal, een verzonnen sportschool in Utrecht: tegels met de dag, de lessen met bezetting en een ledenkaart, en ervoor de ledenapp op een telefoon',
    },
    producten: {
      werkvloer: {
        kop: 'De hele dag op een scherm.',
        tekst: 'Vandaag laat zien wie er binnen is, hoe vol de lessen zitten en wat er nog moet gebeuren. Balie en vloer kijken naar hetzelfde scherm.',
        punten: ['Inchecken met de QR-code uit de ledenapp', 'Taken en poetslijsten afvinken op de vloer', 'Opvolgen: wie je vandaag belt of aanspreekt'],
        link: 'Alles voor de werkvloer',
        beeldLabel:
          'Het scherm Vandaag van Club voor Kernhal in Utrecht: wie er nu binnen is met het verloop per uur, de taken van vandaag, de bezetting van de lessen, de lessen van de dag en wie er net binnenkwam',
      },
      ledenkaart: {
        kop: 'Alles van een lid op een kaart.',
        tekst: 'Intake, schema, lidmaatschap, bezoek en berichten staan op het profiel van het lid. Je ziet het verloop en past het daar ook aan.',
        punten: ['Bezoek per kalendermaand, met het verloop over 12 weken', 'Intake en schema starten vanaf de kaart', 'Gegevens downloaden of wissen volgens de AVG'],
        link: 'Meer over de ledenkaart',
        beeldLabel:
          'De ledenkaart van Sanne Bakker bij Kernhal: zes tabbladen, het bezoek deze maand, het gemiddelde per week met verloop, no-shows, haar schema van deze week en haar lidmaatschap',
      },
      schemas: {
        kop: 'Schema’s zoals een trainer ze maakt.',
        tekst: 'Supersets, sets, kilo’s, RIR, rust en tempo per oefening. Bij elke oefening staan de kernpunten die je anders op de vloer zou zeggen.',
        punten: ['Coaching per oefening: kernpunten, fouten en ademhaling', 'Het lid logt elke set in de ledenapp', 'Dubbele progressie: je ziet wanneer het zwaarder kan'],
        link: 'Meer over trainingsschema’s',
        beeldLabel:
          'Een trainingsschema in Club: kracht dag A voor Sanne Bakker met supersets, sets, kilo’s, RIR, rust en tempo, en ernaast de kernpunten bij de back squat en het verloop van haar zwaarste set',
      },
      ledenapp: {
        kop: 'Een app in jouw naam en kleuren.',
        tekst: 'Leden zetten de app op hun beginscherm. Ze reserveren lessen, checken in met hun QR-code en zien hun eigen schema en voortgang.',
        punten: ['Jouw logo, naam en kleuren in elk pakket', 'De week in een ring: trainingen gedaan tegen het doel', 'Lessen reserveren, met wachtlijst als het vol is'],
        link: 'Meer over de ledenapp',
        beeldLabel:
          'De ledenapp van Kernhal op twee telefoons: Home met de weekring, de volgende les, bezoeken en de QR-code om in te checken, en daarachter het lesrooster om te reserveren',
      },
    },
    feiten: {
      titel: 'Wat er in zit',
      stappen: 'stappen in de startwizard. Daarna staat je club live.',
      plekken: 'plekken, een systeem: balie, vloer, trainer, eigenaar en lid.',
      talen: 'talen, Nederlands en Engels, voor je team en je leden.',
      eu: 'Database en server in Frankfurt, binnen de EU.',
    },
    kane: {
      titel: ['Gebouwd vanaf', 'de vloer.'],
      citaat: 'Ik bouw AI Your Gym omdat ik elke week zie waar het dagelijkse werk vastloopt.',
      naam: 'Kane Bongers',
      rol: 'Personal trainer sinds 2019 en PT-manager van acht locaties.',
      verwacht: 'Eerlijk wat er wel en niet in zit. Elke maand nieuwe functies. Persoonlijke hulp bij het inrichten in de grotere pakketten.',
      knop: 'Plan een kennismaking',
      fotoAlt: 'Kane Bongers',
    },
    oproep: {
      titel: 'Open je club in AI Your Gym',
      voor: 'Open',
      veldLabel: 'Naam van je club',
      voorbeeld: 'jouw club',
      na: 'in AI Your Gym',
      knop: 'en start.',
      onder: (dagen: number, stappen: number) => `${dagen} dagen gratis, geen opstartkosten. Je kiest een pakket en zet je club live in ${stappen} stappen.`,
    },
  },
  en: {
    held: {
      titel: ['Your club,', 'one system.'],
      lead: 'Club software for gyms: check-in, classes, staff rota, training programmes with coaching and a member app in your name and colours.',
      probeer: (dagen: number) => `Try it free for ${dagen} days`,
      demo: 'See the live demo',
      beeldLabel:
        'The Today screen in Club for Kernhal, a made-up gym in Utrecht: tiles for the day, the classes with attendance and a member card, with the member app on a phone in front',
    },
    producten: {
      werkvloer: {
        kop: 'The whole day on one screen.',
        tekst: 'Today shows who is in, how full the classes are and what still needs doing. Front desk and gym floor look at the same screen.',
        punten: ['Check in with the QR code from the member app', 'Tick off tasks and cleaning lists on the floor', 'Follow-up: who to call or talk to today'],
        link: 'Everything for the gym floor',
        beeldLabel:
          'The Today screen in Club for Kernhal in Utrecht: who is in right now with the trend per hour, today’s tasks, class occupancy, the day’s classes and who just checked in',
      },
      ledenkaart: {
        kop: 'Everything about a member on one card.',
        tekst: 'Intake, programme, membership, visits and messages live on the member’s profile. You see the trend and change things right there.',
        punten: ['Visits per calendar month, with the trend over 12 weeks', 'Start an intake or a programme from the card', 'Download or erase data under the GDPR'],
        link: 'More about the member card',
        beeldLabel:
          'Sanne Bakker’s member card at Kernhal: six tabs, visits this month, the weekly average with its trend, no-shows, her programme this week and her membership',
      },
      schemas: {
        kop: 'Programmes the way a trainer writes them.',
        tekst: 'Supersets, sets, weights, RIR, rest and tempo per exercise. Every exercise carries the cues you would otherwise give on the floor.',
        punten: ['Coaching per exercise: cues, common faults and breathing', 'Members log every set in the member app', 'Double progression: you see when to go heavier'],
        link: 'More about training programmes',
        beeldLabel:
          'A training programme in Club: strength day A for Sanne Bakker with supersets, sets, weights, RIR, rest and tempo, with the cues for the back squat and the trend of her heaviest set alongside',
      },
      ledenapp: {
        kop: 'An app in your name and colours.',
        tekst: 'Members add the app to their home screen. They book classes, check in with their QR code and see their own programme and progress.',
        punten: ['Your logo, name and colours in every plan', 'The week as a ring: sessions done against the goal', 'Book classes, with a waiting list when they are full'],
        link: 'More about the member app',
        beeldLabel:
          'The Kernhal member app on two phones: Home with the week ring, the next class, visits and the QR code to check in, and behind it the class timetable for booking',
      },
    },
    feiten: {
      titel: 'What’s inside',
      stappen: 'steps in the set-up wizard. Then your club is live.',
      plekken: 'places, one system: front desk, gym floor, trainer, owner and member.',
      talen: 'languages, Dutch and English, for your team and your members.',
      eu: 'Database and server in Frankfurt, within the EU.',
    },
    kane: {
      titel: ['Built from', 'the gym floor.'],
      citaat: 'I’m building AI Your Gym because every week I see where the day-to-day gets stuck.',
      naam: 'Kane Bongers',
      rol: 'Personal trainer since 2019 and PT manager across eight locations.',
      verwacht: 'Straight answers on what is and isn’t included. New features every month. Personal help with set-up in the larger plans.',
      knop: 'Book an introduction',
      fotoAlt: 'Kane Bongers',
    },
    oproep: {
      titel: 'Open your club in AI Your Gym',
      voor: 'Open',
      veldLabel: 'Name of your club',
      voorbeeld: 'your club',
      na: 'in AI Your Gym',
      knop: 'and start.',
      onder: (dagen: number, stappen: number) => `${dagen} days free, no set-up fee. You choose a plan and put your club live in ${stappen} steps.`,
    },
  },
})
