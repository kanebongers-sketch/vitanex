// De schermfragmenten op de pagina Functies (src/components/aiyourgym/functies-pagina).
// Alle namen en getallen zijn voorbeeldgegevens van Kernhal, een verzonnen sportschool
// in Utrecht, en elk fragment zegt dat ook. Het Engels zegt precies hetzelfde.

import { woordenboek } from '../../woordenboek'

export const FUNCTIES_SCHERMEN = woordenboek({
  nl: {
    index: 'Hoofdstukken op deze pagina',
    functiesLabel: (naam: string) => `Functies in ${naam}`,
    beheer: {
      kop: 'Check-in',
      waar: 'Kernhal Utrecht · voorbeeld',
      rijen: [
        { naam: 'Sanne Bakker', tijd: '06:02', status: 'Binnen', goed: true },
        { naam: 'Daan Visser', tijd: '06:14', status: 'Binnen', goed: true },
        { naam: 'Noor de Wit', tijd: '06:31', status: 'Proefles', goed: true },
        { naam: 'Ilse Mertens', tijd: '06:40', status: 'Geen toegang in deze vestiging', goed: false },
      ],
    },
    coaching: {
      kop: 'Back squat',
      waar: 'Oefenbibliotheek · Kernhal (voorbeeld)',
      kernpuntenKop: 'Kernpunten',
      kernpunten: ['Borst omhoog, blik vooruit', 'Knieen in de lijn van de tenen', 'Hielen blijven aan de grond'],
      tempoKop: 'Tempo',
      tempo: '3 tellen omlaag, 1 omhoog',
      ademKop: 'Ademhaling',
      adem: 'Inademen voor je zakt, uitademen boven',
    },
    planning: {
      kop: 'Lesrooster · week 44',
      waar: 'Kernhal Utrecht · voorbeeld',
      dagen: [
        { dag: 'Ma', lessen: [{ tijd: '07:00', naam: 'Kracht', bezet: '12/14', vol: false }, { tijd: '18:30', naam: 'Circuit', bezet: '16/16', vol: true }] },
        { dag: 'Di', lessen: [{ tijd: '09:30', naam: 'Mobiliteit', bezet: '8/12', vol: false }, { tijd: '19:00', naam: 'Small group', bezet: '6/8', vol: false }] },
        { dag: 'Wo', lessen: [{ tijd: '07:00', naam: 'Kracht', bezet: '14/14', vol: true }, { tijd: '18:30', naam: 'Circuit', bezet: '11/16', vol: false }] },
        { dag: 'Do', lessen: [{ tijd: '12:15', naam: 'Circuit', bezet: '9/16', vol: false }, { tijd: '19:00', naam: 'Small group', bezet: '8/8', vol: true }] },
        { dag: 'Vr', lessen: [{ tijd: '07:00', naam: 'Kracht', bezet: '10/14', vol: false }] },
      ],
      volUitleg: 'Vol, met wachtlijst',
    },
    groei: {
      kop: 'Nieuwe leden per maand',
      waar: 'Kernhal · voorbeeld, mei tot en met oktober',
      maanden: [
        { maand: 'mei', waarde: 9 },
        { maand: 'jun', waarde: 11 },
        { maand: 'jul', waarde: 8 },
        { maand: 'aug', waarde: 12 },
        { maand: 'sep', waarde: 10 },
        { maand: 'okt', waarde: 14 },
      ],
      grafiekLabel: 'Nieuwe leden per maand bij Kernhal (voorbeeld): mei 9, juni 11, juli 8, augustus 12, september 10, oktober 14',
      vondst: 'Oktober: 14 nieuwe leden, de beste maand van het halfjaar.',
    },
    betrokkenheid: {
      groet: 'Hoi Sanne',
      waar: 'Ledenapp · Kernhal (voorbeeld)',
      volgendeKop: 'Volgende les',
      volgende: 'Kracht in de groep · morgen 07:00',
      challengeKop: 'Challenge oktober',
      challenge: '12 trainingen',
      stand: '9 van 12',
      inchecken: 'Inchecken met QR',
    },
  },
  en: {
    index: 'Chapters on this page',
    functiesLabel: (naam: string) => `Features in ${naam}`,
    beheer: {
      kop: 'Check-in',
      waar: 'Kernhal Utrecht · example',
      rijen: [
        { naam: 'Sanne Bakker', tijd: '06:02', status: 'In', goed: true },
        { naam: 'Daan Visser', tijd: '06:14', status: 'In', goed: true },
        { naam: 'Noor de Wit', tijd: '06:31', status: 'Trial class', goed: true },
        { naam: 'Ilse Mertens', tijd: '06:40', status: 'No access at this location', goed: false },
      ],
    },
    coaching: {
      kop: 'Back squat',
      waar: 'Exercise library · Kernhal (example)',
      kernpuntenKop: 'Coaching cues',
      kernpunten: ['Chest up, eyes forward', 'Knees in line with the toes', 'Heels stay on the floor'],
      tempoKop: 'Tempo',
      tempo: '3 counts down, 1 up',
      ademKop: 'Breathing',
      adem: 'Breathe in before you lower, breathe out at the top',
    },
    planning: {
      kop: 'Class timetable · week 44',
      waar: 'Kernhal Utrecht · example',
      dagen: [
        { dag: 'Mon', lessen: [{ tijd: '07:00', naam: 'Strength', bezet: '12/14', vol: false }, { tijd: '18:30', naam: 'Circuit', bezet: '16/16', vol: true }] },
        { dag: 'Tue', lessen: [{ tijd: '09:30', naam: 'Mobility', bezet: '8/12', vol: false }, { tijd: '19:00', naam: 'Small group', bezet: '6/8', vol: false }] },
        { dag: 'Wed', lessen: [{ tijd: '07:00', naam: 'Strength', bezet: '14/14', vol: true }, { tijd: '18:30', naam: 'Circuit', bezet: '11/16', vol: false }] },
        { dag: 'Thu', lessen: [{ tijd: '12:15', naam: 'Circuit', bezet: '9/16', vol: false }, { tijd: '19:00', naam: 'Small group', bezet: '8/8', vol: true }] },
        { dag: 'Fri', lessen: [{ tijd: '07:00', naam: 'Strength', bezet: '10/14', vol: false }] },
      ],
      volUitleg: 'Full, with a waiting list',
    },
    groei: {
      kop: 'New members per month',
      waar: 'Kernhal · example, May to October',
      maanden: [
        { maand: 'May', waarde: 9 },
        { maand: 'Jun', waarde: 11 },
        { maand: 'Jul', waarde: 8 },
        { maand: 'Aug', waarde: 12 },
        { maand: 'Sep', waarde: 10 },
        { maand: 'Oct', waarde: 14 },
      ],
      grafiekLabel: 'New members per month at Kernhal (example): May 9, June 11, July 8, August 12, September 10, October 14',
      vondst: 'October: 14 new members, the best month of the half year.',
    },
    betrokkenheid: {
      groet: 'Hi Sanne',
      waar: 'Member app · Kernhal (example)',
      volgendeKop: 'Next class',
      volgende: 'Strength in a group · tomorrow 07:00',
      challengeKop: 'October challenge',
      challenge: '12 workouts',
      stand: '9 of 12',
      inchecken: 'Check in with QR',
    },
  },
})
