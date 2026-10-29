import { BLOK_LABEL } from '@/lib/club/training/blokken'
import { PARQ_VRAGEN } from '@/lib/club/training/intake'
import { SPIER_GROEP_LABEL, SPIER_INFO, type Spier } from '@/lib/club/training/spieren'
import {
  DOEL_LABEL,
  MATERIAAL_LABEL,
  NIVEAU_LABEL,
  PATROON_LABEL,
  SCHEMA_STATUS_LABEL,
  SPIERGROEP_LABEL,
  VOORKEUR_LABEL,
  ZONE_LABEL,
} from '@/lib/club/training/typen'
import { SOORT_LABEL as VRAAG_SOORT_LABEL } from '@/lib/club/intakevragen/soorten'
import type { Taal } from '../../taal'
import { woordenboek } from '../../woordenboek'

// De vaste labels van Training in Club: spiergroepen, materiaal, bewegingspatronen,
// doelen, niveaus, blokken, spieren, gezondheidsvragen en vraagsoorten. Het
// Nederlands is de bron in src/lib/club/training (en intakevragen/soorten.ts); het
// Engels staat ernaast met precies dezelfde sleutels.

const spierNaamNl = Object.fromEntries(Object.entries(SPIER_INFO).map(([s, i]) => [s, i.naam])) as Record<Spier, string>
const spierOokNl = Object.fromEntries(Object.entries(SPIER_INFO).map(([s, i]) => [s, i.ook])) as Record<Spier, string>
const parqNl = Object.fromEntries(PARQ_VRAGEN.map((v) => [v.sleutel, v.vraag])) as Record<(typeof PARQ_VRAGEN)[number]['sleutel'], string>

export const TRAINING_LABELS = woordenboek({
  nl: {
    spiergroep: SPIERGROEP_LABEL,
    materiaal: MATERIAAL_LABEL,
    patroon: PATROON_LABEL,
    zone: ZONE_LABEL,
    doel: DOEL_LABEL,
    niveau: NIVEAU_LABEL,
    voorkeur: VOORKEUR_LABEL,
    schemaStatus: SCHEMA_STATUS_LABEL,
    blok: BLOK_LABEL,
    spierGroep: SPIER_GROEP_LABEL,
    spier: spierNaamNl,
    spierOok: spierOokNl,
    parq: parqNl,
    vraagSoort: VRAAG_SOORT_LABEL,
    opsommingEn: 'en',
    werktVooral: (spieren: string) => `Werkt vooral op ${spieren}.`,
    werktMee: (spieren: string) => `Werkt mee: ${spieren}.`,
  },
  en: {
    spiergroep: {
      borst: 'Chest',
      rug: 'Back',
      schouders: 'Shoulders',
      biceps: 'Biceps',
      triceps: 'Triceps',
      benen: 'Legs',
      billen: 'Glutes',
      buik: 'Abs',
      onderrug: 'Lower back',
      kuiten: 'Calves',
      hele_lichaam: 'Full body',
      cardio: 'Cardio',
    },
    materiaal: {
      geen: 'Bodyweight',
      dumbbell: 'Dumbbell',
      barbell: 'Barbell',
      kettlebell: 'Kettlebell',
      machine: 'Machine',
      kabel: 'Cable',
      band: 'Resistance band',
      bank: 'Bench',
      cardio_apparaat: 'Cardio machine',
      overig: 'Other',
    },
    patroon: {
      squat: 'Squat',
      heupscharnier: 'Hip hinge',
      lunge: 'Lunge',
      duwen_horizontaal: 'Push (forward)',
      duwen_verticaal: 'Push (overhead)',
      trekken_horizontaal: 'Pull (towards you)',
      trekken_verticaal: 'Pull (down)',
      isolatie: 'Isolation',
      core: 'Core',
      cardio: 'Cardio',
      explosief: 'Explosive',
    },
    zone: {
      knie: 'Knee',
      rug: 'Back',
      schouder: 'Shoulder',
      pols: 'Wrist',
      elleboog: 'Elbow',
      heup: 'Hip',
      enkel: 'Ankle',
      nek: 'Neck',
    },
    doel: {
      afvallen: 'Weight loss',
      spiermassa: 'Muscle gain',
      kracht: 'Strength',
      conditie: 'Fitness',
      gezondheid: 'Healthy and fit',
      revalidatie: 'Rehabilitation',
      sport: 'Sports performance',
    },
    niveau: { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' },
    voorkeur: {
      sportschool: 'Training freely in the gym',
      groepslessen: 'Group classes',
      thuis: 'At home too',
    },
    schemaStatus: {
      concept: 'Draft',
      actief: 'Active',
      afgerond: 'Completed',
    },
    blok: { los: 'Single', superset: 'Superset', circuit: 'Circuit' },
    spierGroep: {
      borst: 'Chest',
      rug: 'Back',
      schouders: 'Shoulders',
      armen: 'Arms',
      romp: 'Core',
      benen: 'Legs and glutes',
      conditie: 'Cardio',
    },
    spier: {
      borstspieren: 'Chest',
      voorste_schouder: 'Front shoulder',
      middelste_schouder: 'Side shoulder',
      achterste_schouder: 'Rear shoulder',
      trapezius: 'Trapezius',
      latissimus: 'Latissimus',
      rhomboideus: 'Rhomboids',
      onderrug: 'Lower back',
      biceps: 'Biceps',
      triceps: 'Triceps',
      onderarmen: 'Forearms',
      rechte_buikspier: 'Rectus abdominis',
      schuine_buikspieren: 'Obliques',
      diepe_buikspier: 'Deep core',
      heupbuigers: 'Hip flexors',
      bilspieren: 'Glutes',
      quadriceps: 'Quadriceps',
      hamstrings: 'Hamstrings',
      adductoren: 'Adductors',
      abductoren: 'Abductors',
      kuiten: 'Calves',
      scheenbeenspier: 'Shin muscle',
      hart_longen: 'Heart and lungs',
    },
    spierOok: {
      borstspieren: 'pectoralis',
      voorste_schouder: 'anterior deltoid',
      middelste_schouder: 'lateral deltoid',
      achterste_schouder: 'posterior deltoid',
      trapezius: 'upper back and neck',
      latissimus: 'lats',
      rhomboideus: 'between the shoulder blades',
      onderrug: 'spinal erectors',
      biceps: 'biceps brachii',
      triceps: 'triceps brachii',
      onderarmen: 'grip and wrist',
      rechte_buikspier: 'six pack',
      schuine_buikspieren: 'obliquus',
      diepe_buikspier: 'transversus abdominis',
      heupbuigers: 'iliopsoas',
      bilspieren: 'gluteus',
      quadriceps: 'front of the thigh',
      hamstrings: 'back of the thigh',
      adductoren: 'inner thigh',
      abductoren: 'outer hip',
      kuiten: 'gastrocnemius and soleus',
      scheenbeenspier: 'tibialis anterior',
      hart_longen: 'cardio',
    },
    parq: {
      hart: 'Has a doctor ever said that you have a heart condition, or that you should only exercise under supervision?',
      borstpijn: 'Do you have pain or pressure in your chest during exertion or at rest?',
      duizelig: 'Do you ever feel dizzy or faint?',
      gewricht: 'Do you have problems with bones or joints that could get worse with exercise?',
      bloeddruk: 'Do you take medication for your blood pressure or heart?',
      zwanger: 'Are you pregnant or have you recently given birth?',
      anders: 'Is there any other reason why you need to be careful with exercise?',
    },
    vraagSoort: {
      kort: 'Short answer',
      lang: 'Long answer',
      keuze: 'Single choice',
      meerkeuze: 'Multiple choice',
      ja_nee: 'Yes or no',
      schaal_1_10: 'Scale of 1 to 10',
      getal: 'Number',
    },
    opsommingEn: 'and',
    werktVooral: (spieren: string) => `Works mainly the ${spieren}.`,
    werktMee: (spieren: string) => `Also works: ${spieren}.`,
  },
})

export type TrainingLabels = (typeof TRAINING_LABELS)['nl']

/** "a", "a en b", "a, b en c" in de gekozen taal. */
export function opsommingIn(delen: readonly string[], taal: Taal): string {
  if (delen.length <= 1) return delen[0] ?? ''
  return `${delen.slice(0, -1).join(', ')} ${TRAINING_LABELS[taal].opsommingEn} ${delen[delen.length - 1]}`
}

/** "Werkt vooral op quadriceps en bilspieren. Werkt mee: ..." in de gekozen taal. */
export function spierUitlegIn(primair: readonly Spier[], secundair: readonly Spier[], taal: Taal): string {
  if (primair.length === 0) return ''
  const t = TRAINING_LABELS[taal]
  const klein = (s: Spier) => t.spier[s].toLowerCase()
  const hoofd = t.werktVooral(opsommingIn(primair.map(klein), taal))
  return secundair.length === 0 ? hoofd : `${hoofd} ${t.werktMee(opsommingIn(secundair.map(klein), taal))}`
}
