// De voorpagina als werkdag (src/components/aiyourgym/dag): de dagklok, de namen van
// de momenten, het check-inkaartje in de held en de schemabouw (de piek). Zie
// docs/aiyourgym/scroll-craft/BRIEF.md. Oefenbeelden staan niet op de website
// (besluit Kane 27-10-2026); het schemaverhaal loopt via de schermen zelf.

import { woordenboek } from '../../woordenboek'

export const DAG = woordenboek({
  nl: {
    klokLabel: 'De dag van een sportschool, op deze pagina',
    klokNu: 'Tijd op deze pagina',
    momenten: { open: 'Open', dag: 'De dag', schema: 'Schema', wie: 'Wie het bouwt', dicht: 'Dicht' },
    checkin: {
      kop: 'Ingecheckt',
      waar: (club: string, vestiging: string) => `${club} ${vestiging} · eerste van de dag`,
    },
    bandTitel: 'Vanavond aanmelden, morgen rondkijken in je eigen Club.',
  },
  en: {
    klokLabel: 'A day at a gym, on this page',
    klokNu: 'Time on this page',
    momenten: { open: 'Open', dag: 'The day', schema: 'Programme', wie: 'Who builds it', dicht: 'Closed' },
    checkin: {
      kop: 'Checked in',
      waar: (club: string, vestiging: string) => `${club} ${vestiging} · first of the day`,
    },
    bandTitel: 'Sign up tonight, look around your own Club tomorrow.',
  },
})

/** De schemabouw: een schema bouwt zich op terwijl je scrolt en landt in de ledenapp. */
export const DAG_SCHEMA = woordenboek({
  nl: {
    label: 'Trainingsschema’s',
    titel: { voor: 'De trainer schrijft het. ', accent: 'Het lid heeft het.' },
    lead: 'Een intake, een voorstel volgens de regels van Club, coaching bij elke oefening in de woorden van een trainer. En het schema staat in de ledenapp.',
    fasen: {
      intake: { naam: 'Intake', zin: 'Doel, niveau en dagen per week, met de gezondheidsvragen erbij.' },
      oefeningen: { naam: 'Voorstel', zin: 'Club zet oefeningen klaar met sets, herhalingen en rust. Jij past aan.' },
      coaching: { naam: 'Coaching', zin: 'Bij elke oefening genummerde kernpunten, zoals een trainer ze zegt.' },
      app: { naam: 'In de app', zin: 'Het lid ziet het schema op de telefoon, met de kernpunten onder elke oefening.' },
    },
    fasenLabel: 'Zo ontstaat een schema',
    editor: 'Nieuw schema',
    uitIntake: 'Uit de intake',
    dagA: 'Dag A',
    kernpunten: 'Kernpunten',
    verstuurd: 'In de ledenapp gezet',
    dagen: (n: number) => `${n} dagen per week`,
    minuten: (n: number) => `${n} minuten`,
    beeldLabel:
      'Een trainingsschema in Club van Kernhal (voorbeeld): de intake met doel en niveau, vier oefeningen met sets, herhalingen en rust, de kernpunten bij de eerste oefening, en hetzelfde schema in de ledenapp op een telefoon',
    onder: 'De kernpunten zijn de echte tekst uit de oefenbibliotheek, aan te passen in de woorden van je eigen trainers.',
    link: 'Zo werken trainingsschema’s',
  },
  en: {
    label: 'Training programmes',
    titel: { voor: 'The trainer writes it. ', accent: 'The member has it.' },
    lead: 'An intake, a proposal built on the rules in Club, coaching for every exercise in a trainer’s words. And the programme is in the member app.',
    fasen: {
      intake: { naam: 'Intake', zin: 'Goal, level and days per week, with the health questions included.' },
      oefeningen: { naam: 'Proposal', zin: 'Club lines up exercises with sets, reps and rest. You adjust.' },
      coaching: { naam: 'Coaching', zin: 'Numbered cues for every exercise, the way a trainer says them.' },
      app: { naam: 'In the app', zin: 'The member sees the programme on their phone, with the cues under every exercise.' },
    },
    fasenLabel: 'How a programme comes together',
    editor: 'New programme',
    uitIntake: 'From the intake',
    dagA: 'Day A',
    kernpunten: 'Coaching cues',
    verstuurd: 'Sent to the member app',
    dagen: (n: number) => `${n} days a week`,
    minuten: (n: number) => `${n} minutes`,
    beeldLabel:
      'A training programme in Club for Kernhal (example): the intake with goal and level, four exercises with sets, reps and rest, the cues for the first exercise, and the same programme in the member app on a phone',
    onder: 'The cues are the real text from the exercise library. Adapt them to the words your own trainers use.',
    link: 'How training programmes work',
  },
})
