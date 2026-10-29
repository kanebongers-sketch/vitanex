import { woordenboek } from '../../woordenboek'

// De schemaweergave van Club en de ledenapp (29-10-2026): de tempocurve, het
// zijpaneel met de gekozen oefening in de editor, de week en het overzicht van
// de training van vandaag in de ledenapp. Oefennamen blijven zoals ze zijn.

export const SCHEMA_WEERGAVE = woordenboek({
  nl: {
    tempo: {
      kop: 'Tempo',
      fase: { omlaag: 'Omlaag', onder: 'Onder', omhoog: 'Omhoog', boven: 'Boven' },
      label: (omlaag: string, onder: string, omhoog: string, boven: string) =>
        `Tempo per herhaling: ${omlaag} omlaag, ${onder} stil onder, ${omhoog} omhoog, ${boven} stil boven`,
      sec: (n: string) => `${n} sec`,
      explosief: 'explosief',
      perHerhaling: (sec: string) => `${sec} sec per herhaling`,
    },
    regel: {
      kies: (naam: string) => `${naam} bekijken in het zijpaneel`,
      gekozen: 'In beeld',
    },
    gekozen: {
      kop: 'Gekozen oefening',
      leeg: 'Kies een oefening in het schema. Hier zie je het beeld, de kernpunten en het verloop.',
      kernpunten: 'Kernpunten',
      geenKernpunten: 'Voor deze oefening staan nog geen kernpunten in de coaching.',
      voorschrift: 'In dit schema',
      sets: 'Sets',
      herhalingen: 'Herh.',
      tijd: 'Tijd',
      kg: 'Kg',
      rust: 'Rust',
      zwaarste: 'Zwaarste set',
      beste: 'Beste set',
      eenheid: { kg: 'kg', herh: 'herh.', sec: 'sec' },
      verloop: (naam: string) => `Verloop van ${naam} per training`,
      keer: (n: number) => (n === 1 ? '1 training gelogd' : `${n} trainingen gelogd`),
      nogNiets: 'Nog niets gelogd. Zodra het lid deze oefening in de app logt, staat hier het verloop.',
      volgende: 'Volgende stap',
      regelNaam: 'Vaste vakregel: dubbele progressie',
    },
    week: {
      kop: 'Deze week',
      ring: (gedaan: number, totaal: number) => `Deze week ${gedaan} van ${totaal} trainingsdagen gedaan`,
      dagen: (gedaan: number, totaal: number) => `${gedaan} van ${totaal} dagen`,
      dag: (letter: string) => `Dag ${letter}`,
      gedaan: 'gedaan',
      open: 'nog open',
    },
    app: {
      vandaag: 'Vandaag',
      volgende: 'Volgende training',
      stappen: (n: number) => (n === 1 ? '1 oefening' : `${n} oefeningen`),
      sets: (n: number) => (n === 1 ? '1 set' : `${n} sets`),
      week: (gedaan: number, totaal: number) => `Deze week ${gedaan} van ${totaal} gedaan`,
      blok: { superset: 'Superset', circuit: 'Circuit' },
      omEnOm: 'om en om',
    },
  },
  en: {
    tempo: {
      kop: 'Tempo',
      fase: { omlaag: 'Down', onder: 'Bottom', omhoog: 'Up', boven: 'Top' },
      label: (omlaag: string, onder: string, omhoog: string, boven: string) =>
        `Tempo per rep: ${omlaag} down, ${onder} pause at the bottom, ${omhoog} up, ${boven} pause at the top`,
      sec: (n: string) => `${n} sec`,
      explosief: 'explosive',
      perHerhaling: (sec: string) => `${sec} sec per rep`,
    },
    regel: {
      kies: (naam: string) => `Show ${naam} in the side panel`,
      gekozen: 'In view',
    },
    gekozen: {
      kop: 'Selected exercise',
      leeg: 'Pick an exercise in the programme. Here you see the visual, the key points and the progress.',
      kernpunten: 'Key points',
      geenKernpunten: 'This exercise has no key points in the coaching yet.',
      voorschrift: 'In this programme',
      sets: 'Sets',
      herhalingen: 'Reps',
      tijd: 'Time',
      kg: 'Kg',
      rust: 'Rest',
      zwaarste: 'Heaviest set',
      beste: 'Best set',
      eenheid: { kg: 'kg', herh: 'reps', sec: 'sec' },
      verloop: (naam: string) => `Progress of ${naam} per session`,
      keer: (n: number) => (n === 1 ? '1 session logged' : `${n} sessions logged`),
      nogNiets: 'Nothing logged yet. As soon as the member logs this exercise in the app, the progress shows here.',
      volgende: 'Next step',
      regelNaam: 'Fixed coaching rule: double progression',
    },
    week: {
      kop: 'This week',
      ring: (gedaan: number, totaal: number) => `This week ${gedaan} of ${totaal} training days done`,
      dagen: (gedaan: number, totaal: number) => `${gedaan} of ${totaal} days`,
      dag: (letter: string) => `Day ${letter}`,
      gedaan: 'done',
      open: 'still open',
    },
    app: {
      vandaag: 'Today',
      volgende: 'Next session',
      stappen: (n: number) => (n === 1 ? '1 exercise' : `${n} exercises`),
      sets: (n: number) => (n === 1 ? '1 set' : `${n} sets`),
      week: (gedaan: number, totaal: number) => `This week ${gedaan} of ${totaal} done`,
      blok: { superset: 'Superset', circuit: 'Circuit' },
      omEnOm: 'alternating',
    },
  },
})
