// De schermen bij de trainingsschema's (src/components/aiyourgym/schemas/**).
// Wat uit de code van Club zelf komt is de Nederlandse bron: de gezondheidsvragen
// (PARQ_VRAGEN) en wat stelSchemaVoor bij de voorbeeldintake teruggeeft (naam, dagen,
// waarschuwingen); het Engels staat ernaast. De coaching staat in coaching.ts. Doelen
// en niveaus zijn korte labels; die staan hier zodat de schermen in het Engels kloppen.

import { VOORBEELD_INTAKE } from '@/components/aiyourgym/schemas/voorbeeld-intake'
import { PARQ_VRAGEN, type ParqSleutel } from '@/lib/club/training/intake'
import { DOEL_LABEL, NIVEAU_LABEL } from '@/lib/club/training/typen'
import { stelSchemaVoor } from '@/lib/club/training/voorstel'
import { woordenboek } from '../../woordenboek'

/** Het voorschrift uit voorbeeldschema.ts ("3 x 8 tot 12, 90 sec rust") in het Engels. */
function voorschriftEn(v: string): string {
  return String(v).replace(/ tot /g, ' to ').replace(/sec rust/g, 'sec rest')
}

/** Het voorstel bij de voorbeeldintake, zoals Club het maakt (Nederlands). */
const VOORSTEL = stelSchemaVoor(VOORBEELD_INTAKE, [])

const PARQ_NL = Object.fromEntries(PARQ_VRAGEN.map((v) => [v.sleutel, v.vraag])) as Record<ParqSleutel, string>

export const SCHEMA_SCHERMEN = woordenboek({
  nl: {
    doel: DOEL_LABEL,
    niveau: NIVEAU_LABEL,
    voorschrift: (v: string) => String(v),
    demo: {
      kiesOefening: 'Kies een oefening',
      oefeningVan: (nr: number, van: number) => `Oefening ${nr} van ${van}`,
      kernpunten: 'Kernpunten',
      meerCoaching: 'Meer coaching',
      panelen: { fouten: 'Fouten en correctie', uitvoering: 'Opstelling en stappen', adem: 'Ademhaling en tempo' },
      fout: 'Fout: ',
      beter: 'Beter: ',
      ademhaling: 'Ademhaling',
      tempo: 'Tempo',
      makkelijker: 'Makkelijker',
      zwaarder: 'Zwaarder',
    },
    app: {
      schema: 'Schema',
      naam: 'Full body · Spiermassa',
      weken: (n: number) => `${n} weken`,
      dagen: ['Dag A', 'Dag B', 'Dag C'],
      gedaan: 'Training dag A gedaan',
      uitleg: 'In de ledenapp: de eerste twee kernpunten onder elke oefening, tik voor de beweging en alle coaching.',
    },
    bibliotheek: {
      oefeningen: 'Oefeningen',
      metCoaching: (n: number) => `${n} met coaching`,
      eigenOefening: 'Eigen oefening',
      zoeken: 'Naam van de oefening',
      filters: ['Alle spieren', 'Materiaal', 'Niveau'],
      kernpunten: (n: number) => `${n} kernpunten`,
    },
    coachtekst: {
      eigenTekst: 'Eigen tekst van Kernhal',
      kernpunten: 'Kernpunten',
      voorbeeldPunt: 'Kettlebell tegen je borstbeen',
      opslaan: 'Opslaan',
      annuleren: 'Annuleren',
      standaard: 'Terug naar de standaard',
    },
    oefening: {
      notitie: 'Van je trainer: hielen op de grond',
    },
    voortgang: {
      titel: 'Voortgang',
      wekenOpRij: 'weken op rij',
      trainingen: 'trainingen',
      perWeek: 'Trainingen per week',
      gewicht: 'Gewicht',
      opWeg: (doel: number) => `Op weg naar ${doel} trainingen`,
      nogTeGaan: (n: number) => `Nog ${n} te gaan`,
    },
    intake: {
      kop: 'Intake · Sanne de Vries',
      voorbeeld: 'Voorbeeld',
      doelen: 'Doelen',
      niveau: 'Niveau',
      dagenPerWeek: 'Dagen per week',
      minuten: 'Minuten',
      metingen: 'Metingen',
      meting: { gewicht: 'Gewicht', lengte: 'Lengte', vet: 'Vetpercentage', buik: 'Buikomtrek' },
      gezondheidsvragen: 'Gezondheidsvragen',
      ja: 'Ja',
      nee: 'Nee',
      toestemming: 'Het lid geeft toestemming om deze gezondheidsgegevens te bewaren',
      parq: PARQ_NL,
      voorstelMaken: 'Voorstel maken',
    },
    voorstel: {
      voorstel: 'Voorstel',
      openen: 'Openen in de editor',
      weken: (n: number) => `${n} weken`,
      // Wat Club bij de voorbeeldintake voorstelt (stelSchemaVoor)
      naam: VOORSTEL.naam,
      dagen: VOORSTEL.dagen.map((d) => d.titel),
      waarschuwingen: VOORSTEL.waarschuwingen,
    },
    editor: {
      naam: 'Full body · Spiermassa',
      actief: 'Actief',
      opslaan: 'Opslaan',
      ongedaan: 'Ongedaan maken',
      printen: 'Printen',
      sjabloon: 'Opslaan als sjabloon',
      dagen: ['Dag A', 'Dag B', 'Dag C'],
      dag: 'Dag',
      kolommen: ['Oefening', 'Sets', 'Herh.', 'Kg', 'Rust', 'Notitie'],
      notities: ['Hielen op de grond', '', 'Rustig zakken', ''],
      toevoegen: 'Oefening toevoegen',
    },
    stap: {
      bekijk: (naam: string) => `Bekijk ${naam}`,
      verberg: (naam: string) => `Verberg ${naam}`,
    },
  },
  en: {
    doel: {
      afvallen: 'Weight loss',
      spiermassa: 'Muscle gain',
      kracht: 'Strength',
      conditie: 'Fitness',
      gezondheid: 'Health and fitness',
      revalidatie: 'Rehabilitation',
      sport: 'Sports performance',
    },
    niveau: { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' },
    voorschrift: voorschriftEn,
    demo: {
      kiesOefening: 'Choose an exercise',
      oefeningVan: (nr: number, van: number) => `Exercise ${nr} of ${van}`,
      kernpunten: 'Coaching cues',
      meerCoaching: 'More coaching',
      panelen: { fouten: 'Mistakes and corrections', uitvoering: 'Set-up and steps', adem: 'Breathing and tempo' },
      fout: 'Mistake: ',
      beter: 'Better: ',
      ademhaling: 'Breathing',
      tempo: 'Tempo',
      makkelijker: 'Easier',
      zwaarder: 'Harder',
    },
    app: {
      schema: 'Programme',
      naam: 'Full body · Muscle gain',
      weken: (n: number) => `${n} weeks`,
      dagen: ['Day A', 'Day B', 'Day C'],
      gedaan: 'Day A workout done',
      uitleg: 'In the member app: the first two coaching cues under each exercise, tap for the movement and all the coaching.',
    },
    bibliotheek: {
      oefeningen: 'Exercises',
      metCoaching: (n: number) => `${n} with coaching`,
      eigenOefening: 'Own exercise',
      zoeken: 'Exercise name',
      filters: ['All muscles', 'Equipment', 'Level'],
      kernpunten: (n: number) => `${n} coaching cues`,
    },
    coachtekst: {
      eigenTekst: 'Own text by Kernhal',
      kernpunten: 'Coaching cues',
      voorbeeldPunt: 'Kettlebell against your breastbone',
      opslaan: 'Save',
      annuleren: 'Cancel',
      standaard: 'Back to the standard',
    },
    oefening: {
      notitie: 'From your trainer: heels on the floor',
    },
    voortgang: {
      titel: 'Progress',
      wekenOpRij: 'weeks in a row',
      trainingen: 'workouts',
      perWeek: 'Workouts per week',
      gewicht: 'Weight',
      opWeg: (doel: number) => `Working towards ${doel} workouts`,
      nogTeGaan: (n: number) => `${n} to go`,
    },
    intake: {
      kop: 'Intake · Sanne de Vries',
      voorbeeld: 'Example',
      doelen: 'Goals',
      niveau: 'Level',
      dagenPerWeek: 'Days per week',
      minuten: 'Minutes',
      metingen: 'Measurements',
      meting: { gewicht: 'Weight', lengte: 'Height', vet: 'Body fat', buik: 'Waist' },
      gezondheidsvragen: 'Health questions',
      ja: 'Yes',
      nee: 'No',
      toestemming: 'The member consents to these health details being stored',
      parq: {
        hart: 'Has a doctor ever said that you have a heart condition, or that you should only exercise under supervision?',
        borstpijn: 'Do you have pain or pressure in your chest during exertion or at rest?',
        duizelig: 'Do you ever feel dizzy or faint?',
        gewricht: 'Do you have problems with bones or joints that could get worse with exercise?',
        bloeddruk: 'Do you take medication for your blood pressure or heart?',
        zwanger: 'Are you pregnant or have you recently given birth?',
        anders: 'Is there any other reason why you need to be careful with exercise?',
      },
      voorstelMaken: 'Create draft',
    },
    voorstel: {
      voorstel: 'Draft',
      openen: 'Open in the editor',
      weken: (n: number) => `${n} weeks`,
      naam: 'Full body · Muscle gain',
      dagen: ['Full body A', 'Full body B', 'Full body C'],
      waarschuwingen: ['A health question was answered with yes. Ask the member to check with their GP before the intensity goes up.'],
    },
    editor: {
      naam: 'Full body · Muscle gain',
      actief: 'Active',
      opslaan: 'Save',
      ongedaan: 'Undo',
      printen: 'Print',
      sjabloon: 'Save as template',
      dagen: ['Day A', 'Day B', 'Day C'],
      dag: 'Day',
      kolommen: ['Exercise', 'Sets', 'Reps', 'Kg', 'Rest', 'Note'],
      notities: ['Heels on the floor', '', 'Lower slowly', ''],
      toevoegen: 'Add exercise',
    },
    stap: {
      bekijk: (naam: string) => `Show ${naam}`,
      verberg: (naam: string) => `Hide ${naam}`,
    },
  },
})
