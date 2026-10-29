// De pagina Trainingsschema's ((site)/trainingsschemas/page.tsx).
// Het Nederlands van de stappen is SCHEMA_STAPPEN uit inhoud/trainingsschemas.ts
// (daar staat waarom elke stap klopt en blijft de bron). Het Engels zegt precies
// hetzelfde, niets meer. De teksten in de schermen staan in ./schemas.ts.

import { SCHEMA_STAPPEN, type SchemaStapSleutel } from '@/components/aiyourgym/inhoud/trainingsschemas'
import { woordenboek } from '../../woordenboek'

interface StapTekst {
  naam: string
  kop: string
  tekst: string
  punten: readonly string[]
}

function perSleutel(): Record<SchemaStapSleutel, StapTekst> {
  return Object.fromEntries(SCHEMA_STAPPEN.map(({ sleutel, ...rest }) => [sleutel, rest])) as Record<SchemaStapSleutel, StapTekst>
}

const NL_STAPPEN: Record<SchemaStapSleutel, StapTekst> = perSleutel()

export const SCHEMAS_PAGINA = woordenboek({
  nl: {
    metaTitel: 'Trainingsschema’s',
    metaOmschrijving:
      'Trainingsschema’s in AI Your Gym: van intake en voorstel tot editor, coaching per oefening, eigen coachteksten, de ledenapp en voortgang.',
    label: 'Trainingsschema’s',
    titel: 'Schema’s zoals een trainer ze geeft.',
    tekst: 'Van intake tot voortgang, met coaching bij elke oefening.',
    routeLabel: 'De route van een schema',
    probeer: {
      label: 'Probeer het zelf',
      titel: 'Een oefening met de coaching erbij.',
      tekst: 'Kies een oefening en lees de echte coaching uit de bibliotheek.',
      voorbeeld: 'Schermvoorbeeld met voorbeeldgegevens',
    },
    stappen: NL_STAPPEN,
    beeldLabel: {
      intake: 'Het intakescherm: doelen, niveau, dagen en minuten, metingen en drie gezondheidsvragen met toestemming',
      voorstel: 'Het schemavoorstel: full body in drie dagen, een waarschuwing over de gezondheidsvragen en de oefeningen van dag A',
      editor: 'De schema-editor: dag A met per oefening sets, herhalingen, gewicht, rust en notitie, en knoppen voor opslaan, ongedaan maken, printen en sjabloon',
      bibliotheek: 'De oefenbibliotheek met zoeken, filters en oefeningen met het aantal kernpunten',
      eigen: 'De coaching van een oefening aanpassen: eigen kernpunten, opslaan of terug naar de standaard',
      ledenapp: 'De ledenapp: het schema van dag A en een geopende oefening met het voorschrift en de kernpunten',
      voortgang: 'De voortgang in de ledenapp: weken op rij, trainingen per week, gewicht in een lijn en de volgende mijlpaal',
    },
    // Voor de knop op de telefoon ("Bekijk het intakescherm").
    schermNaam: {
      intake: 'het intakescherm',
      voorstel: 'het voorstel',
      editor: 'de editor',
      bibliotheek: 'de bibliotheek',
      eigen: 'het aanpassen',
      ledenapp: 'de ledenapp',
      voortgang: 'de voortgang',
    },
    vragenLabel: 'Vragen',
    vragenTitel: 'Wat trainers vaak vragen.',
    vragen: [
      {
        vraag: 'Is het schemavoorstel AI?',
        antwoord: 'Nee. Het volgt vaste vakregels voor indeling, sets en blessures. Voorspelbaar, zonder extra kosten, en de trainer past het aan.',
      },
      {
        vraag: 'Kan ik eigen oefeningen en teksten gebruiken?',
        antwoord: 'Ja. Eigen oefeningen met eigen coaching, en de standaardteksten herschrijf je in de woorden van je trainers.',
      },
      {
        vraag: 'Wat ziet een lid van de intake?',
        antwoord: 'Het eigen schema, de eigen maten en trainingen. Gezondheidsgegevens en notities van de trainer blijven bij het team.',
      },
    ],
    vragenActie: 'Laat je trainers het zelf proberen.',
    band: 'Geef je leden een trainer in hun broekzak.',
  },
  en: {
    metaTitel: 'Training programmes',
    metaOmschrijving:
      'Training programmes in AI Your Gym: from intake and draft to the editor, coaching for every exercise, your own coaching texts, the member app and progress.',
    label: 'Training programmes',
    titel: 'Programmes the way a trainer delivers them.',
    tekst: 'From intake to progress, with coaching for every exercise.',
    routeLabel: 'The route of a programme',
    probeer: {
      label: 'Try it yourself',
      titel: 'An exercise with the coaching built in.',
      tekst: 'Pick an exercise and read the real coaching from the library.',
      voorbeeld: 'Example screen with sample data',
    },
    stappen: {
      intake: {
        naam: 'Intake',
        kop: 'Start with the member, not a template.',
        tekst: 'Goals, level, available time and injuries, on the gym floor or at a table.',
        punten: ['Measurements from weight to blood pressure', 'Health questions, only stored with consent', 'Your own questions in your own intake form'],
      },
      voorstel: {
        naam: 'Draft programme',
        kop: 'A starting programme in one click.',
        tekst: 'Fixed coaching rules turn the intake into a starting programme. The trainer decides.',
        punten: ['A split that fits days and level', 'Exercises that load an injury are left out', 'A warning when a health question is answered yes'],
      },
      editor: {
        naam: 'Programme editor',
        kop: 'Adjust it the way you train.',
        tekst: 'Up to seven training days, with everything you agree on the gym floor for each exercise.',
        punten: ['Supersets, RPE or RIR, rest and tempo', 'Drag, undo and copy to another member', 'Print it for anyone who prefers paper'],
      },
      bibliotheek: {
        naam: 'Library with coaching',
        kop: 'Every exercise with a trainer inside.',
        tekst: 'First the cues you say out loud, then the rest.',
        punten: ['3 to 5 numbered coaching cues', 'Common mistakes with the correction', 'Breathing, tempo and an easier and harder variation'],
      },
      eigen: {
        naam: 'Your own coaching texts',
        kop: 'Your trainers, your words.',
        tekst: 'Rewrite the coaching and add your own exercises to the library.',
        punten: ['Applies only to your gym', 'The same checks as the standard', 'Back to the standard text in one click'],
      },
      ledenapp: {
        naam: 'In the member app',
        kop: 'The programme in their pocket, the trainer alongside.',
        tekst: 'The first two cues under every exercise, in view while training.',
        punten: ['The next workout already marked', 'All the coaching and the trainer’s note in one tap', 'Log each set or tick off the workout'],
      },
      voortgang: {
        naam: 'Progress',
        kop: 'See what it delivers.',
        tekst: 'Every workout and every measurement on a timeline, for trainer and member.',
        punten: ['Weeks in a row, with milestones', 'See per exercise when to go heavier', 'Members never see the trainer’s notes'],
      },
    },
    beeldLabel: {
      intake: 'The intake screen: goals, level, days and minutes, measurements and three health questions with consent',
      voorstel: 'The draft programme: full body over three days, a warning about the health questions and the exercises for day A',
      editor: 'The programme editor: day A with sets, reps, weight, rest and a note per exercise, and buttons to save, undo, print and save as template',
      bibliotheek: 'The exercise library with search, filters and exercises showing their number of coaching cues',
      eigen: 'Editing the coaching of an exercise: your own cues, save or back to the standard',
      ledenapp: 'The member app: the programme for day A and an open exercise with the prescription and the coaching cues',
      voortgang: 'Progress in the member app: weeks in a row, workouts per week, weight as a line and the next milestone',
    },
    schermNaam: {
      intake: 'the intake screen',
      voorstel: 'the draft',
      editor: 'the editor',
      bibliotheek: 'the library',
      eigen: 'the editing screen',
      ledenapp: 'the member app',
      voortgang: 'progress',
    },
    vragenLabel: 'Questions',
    vragenTitel: 'What trainers often ask.',
    vragen: [
      {
        vraag: 'Is the draft programme AI?',
        antwoord: 'No. It follows fixed coaching rules for split, sets and injuries. Predictable, no extra cost, and the trainer adjusts it.',
      },
      {
        vraag: 'Can I use my own exercises and texts?',
        antwoord: 'Yes. Your own exercises with your own coaching, and you rewrite the standard texts in your trainers’ words.',
      },
      {
        vraag: 'What does a member see from the intake?',
        antwoord: 'Their own programme, measurements and workouts. Health data and the trainer’s notes stay with the team.',
      },
    ],
    vragenActie: 'Let your trainers try it for themselves.',
    band: 'Give your members a trainer in their pocket.',
  },
})
