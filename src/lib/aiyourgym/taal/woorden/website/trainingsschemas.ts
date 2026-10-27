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
      'Trainingsschema’s in AI Your Gym: van intake en schemavoorstel tot editor, een bibliotheek met coaching per oefening, eigen coachteksten, het schema in de ledenapp en voortgang.',
    label: 'Trainingsschema’s',
    titel: 'Schema’s zoals een trainer ze geeft.',
    tekst: 'Van de intake tot de voortgang: een route die je trainers kennen van de vloer. Met coaching bij elke oefening, voor het lid altijd bij de hand in de app.',
    routeLabel: 'De route van een schema',
    probeer: {
      label: 'Probeer het zelf',
      titel: 'Een oefening met de coaching erbij.',
      tekst: 'Kies een oefening en lees wat een trainer erbij zegt: kernpunten, fouten met correctie, uitvoering en ademhaling. De tekst is de echte coaching uit de bibliotheek. In Club en de ledenapp staat bij elke oefening ook een beeld van de beweging.',
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
        antwoord:
          'Nee. Het voorstel volgt vaste vakregels: welke indeling bij hoeveel dagen past, welke sets en herhalingen bij welk doel, en welke oefeningen weg moeten bij een blessure. Daardoor is het voorspelbaar en kost het niets extra. De trainer past het daarna aan.',
      },
      {
        vraag: 'Kan ik eigen oefeningen toevoegen?',
        antwoord: 'Ja. Je voegt eigen oefeningen toe aan de bibliotheek van je sportschool en schrijft er zelf de coaching bij, met dezelfde opbouw als de standaard.',
      },
      {
        vraag: 'Moeten mijn trainers de standaardteksten gebruiken?',
        antwoord: 'Nee. De standaard is een start. Je herschrijft kernpunten, stappen en fouten in de taal van je eigen trainers, en kunt altijd terug naar de standaardtekst.',
      },
      {
        vraag: 'En leden zonder smartphone?',
        antwoord: 'Elk schema is te printen. Het lid traint dan met papier, de trainer houdt het schema en de metingen bij in AI Your Gym.',
      },
      {
        vraag: 'Wat ziet een lid van de intake?',
        antwoord: 'Het eigen schema met coaching en de eigen lichaamsmaten en trainingen. Gezondheidsgegevens, bloeddruk en notities van de trainer blijven bij het team.',
      },
    ],
    vragenActie: 'Laat je trainers het zelf proberen.',
    band: 'Geef je leden een trainer in hun broekzak.',
  },
  en: {
    metaTitel: 'Training programmes',
    metaOmschrijving:
      'Training programmes in AI Your Gym: from intake and draft programme to the editor, a library with coaching for every exercise, your own coaching texts, the programme in the member app and progress.',
    label: 'Training programmes',
    titel: 'Programmes the way a trainer delivers them.',
    tekst: 'From intake to progress: a route your trainers know from the gym floor. With coaching for every exercise, always at hand for the member in the app.',
    routeLabel: 'The route of a programme',
    probeer: {
      label: 'Try it yourself',
      titel: 'An exercise with the coaching built in.',
      tekst: 'Pick an exercise and read what a trainer says about it: cues, mistakes with corrections, set-up and breathing. The text is the real coaching from the library. In Club and the member app every exercise also has an image of the movement.',
      voorbeeld: 'Example screen with sample data',
    },
    stappen: {
      intake: {
        naam: 'Intake',
        kop: 'Start with the member, not a template.',
        tekst: 'The trainer runs the intake on the gym floor or at a table. Goals, level, how many days and minutes someone can train, and any injuries or health concerns.',
        punten: [
          'Measurements: weight, height, body fat, waist, resting heart rate and blood pressure',
          'Seven health questions and injuries per body part',
          'Health data is only stored if the member gives consent',
          'Add your own questions to your gym’s intake form',
        ],
      },
      voorstel: {
        naam: 'Draft programme',
        kop: 'A starting programme in one click.',
        tekst: 'From the intake, AI Your Gym drafts a starting programme on fixed coaching rules, with no guesswork and no extra cost. A starting point, not a verdict: the trainer decides.',
        punten: [
          'The split fits the number of days and the level: full body, upper and lower, or push, pull, legs',
          'Sets, reps and rest to suit the goal, with a lighter start for beginners',
          'Exercises that load an injury are left out',
          'A clear warning if any health question was answered yes',
        ],
      },
      editor: {
        naam: 'Programme editor',
        kop: 'Adjust it the way you train.',
        tekst: 'In the editor the trainer shapes the programme to suit. Up to seven training days, and for each exercise everything you want to agree on the gym floor.',
        punten: [
          'Supersets and circuits, and for each exercise sets, reps or time, weight, RPE or RIR, rest, tempo and a note',
          'Drag to set the order, and undo if it was a slip',
          'Start from a base programme or your own template, and copy a programme to another member',
          'Print it for anyone who prefers to train with paper',
        ],
      },
      bibliotheek: {
        naam: 'Library with coaching',
        kop: 'Every exercise with a trainer inside.',
        tekst: 'Every exercise comes with the coaching a good trainer gives on the gym floor. First the cues you say out loud, then the rest.',
        punten: [
          '3 to 5 numbered coaching cues, the most important first',
          'Set-up, step-by-step execution and common mistakes with the correction',
          'Breathing, tempo and an easier and harder variation',
          'A moving illustration of the start and end position, and which muscles you train',
        ],
      },
      eigen: {
        naam: 'Your own coaching texts',
        kop: 'Your trainers, your words.',
        tekst: 'The base is a starting point, not a straitjacket. Every gym adapts the coaching in its own words and adds its own exercises to the library.',
        punten: [
          'Rewrite cues, steps, mistakes and corrections yourself',
          'The same checks as the standard, so it stays short and readable',
          'Back to the standard text in one click',
          'Your own text applies only to your gym',
        ],
      },
      ledenapp: {
        naam: 'In the member app',
        kop: 'The programme in their pocket, the trainer alongside.',
        tekst: 'Members see the programme in their gym’s app. Under each exercise, the first two coaching cues, so they’re in view while training.',
        punten: [
          'Day A, B and C, with the next workout already marked',
          'Tap an exercise for the moving illustration and all the coaching',
          'The trainer’s note with the exercise',
          'Log each set the member did, or simply tick off the workout',
        ],
      },
      voortgang: {
        naam: 'Progress',
        kop: 'See what it delivers.',
        tekst: 'Every completed workout and every measurement goes on a timeline. The trainer sees whether the programme is being followed, the member sees their own progress.',
        punten: [
          'Workouts per week and how many weeks in a row, with milestones',
          'The logged sets per exercise, with a fixed rule for when to go heavier',
          'Body measurements in a chart: weight, circumference, body fat and muscle mass',
          'Members see only their own measurements and workouts, never the trainer’s notes',
        ],
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
        antwoord:
          'No. The draft follows fixed coaching rules: which split suits how many days, which sets and reps suit which goal, and which exercises to drop for an injury. That makes it predictable and it costs nothing extra. The trainer then adjusts it.',
      },
      {
        vraag: 'Can I add my own exercises?',
        antwoord: 'Yes. You add your own exercises to your gym’s library and write the coaching yourself, with the same structure as the standard.',
      },
      {
        vraag: 'Do my trainers have to use the standard texts?',
        antwoord: 'No. The standard is a starting point. You rewrite cues, steps and mistakes in your own trainers’ words, and can always go back to the standard text.',
      },
      {
        vraag: 'What about members without a smartphone?',
        antwoord: 'Every programme can be printed. The member trains from paper, and the trainer keeps the programme and measurements up to date in AI Your Gym.',
      },
      {
        vraag: 'What does a member see from the intake?',
        antwoord: 'Their own programme with coaching, and their own body measurements and workouts. Health data, blood pressure and the trainer’s notes stay with the team.',
      },
    ],
    vragenActie: 'Let your trainers try it for themselves.',
    band: 'Give your members a trainer in their pocket.',
  },
})
