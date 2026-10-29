// De schemabouw op /trainingsschemas (src/components/aiyourgym/dag/SchemaBouw.tsx).
// Oefenbeelden staan niet op de website (besluit Kane 27-10-2026); het schemaverhaal
// loopt via de schermen zelf.

import { woordenboek } from '../../woordenboek'

/** De schemabouw: een schema bouwt zich op terwijl je scrolt en landt in de ledenapp. */
export const DAG_SCHEMA = woordenboek({
  nl: {
    label: 'Trainingsschema’s',
    titel: { voor: 'De trainer schrijft het. ', accent: 'Het lid heeft het.' },
    lead: 'Van intake tot ledenapp in vier stappen.',
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
    onder: 'Echte kernpunten uit de oefenbibliotheek, aan te passen in de woorden van je trainers.',
  },
  en: {
    label: 'Training programmes',
    titel: { voor: 'The trainer writes it. ', accent: 'The member has it.' },
    lead: 'From intake to member app in four steps.',
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
    onder: 'Real cues from the exercise library, ready to adapt to your trainers’ words.',
  },
})
