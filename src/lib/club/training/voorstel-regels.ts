// ─── Fit Factory Club, training: de regels achter het schemavoorstel (PUUR) ─
// Vakkennis in tabellen: welke split bij hoeveel dagen, welke patronen per dag
// en welke sets, herhalingen en rust bij welk doel. Geen AI, geen kosten.

import type { Spier } from './spieren'
import type { Doel, Materiaal, Niveau, Patroon, Voorkeur } from './typen'

export interface Slot {
  patroon: Patroon
  /** Alleen oefeningen die vooral op een van deze spieren werken (voor isolatie: quadriceps, hamstrings, ...). */
  spieren?: readonly Spier[]
}

export interface DagSjabloon {
  titel: string
  slots: readonly Slot[]
}

const s = (patroon: Patroon, ...spieren: Spier[]): Slot => (spieren.length > 0 ? { patroon, spieren } : { patroon })

// Elke dag raakt de grote spieren van dat deel van het lichaam: een benendag
// heeft quadriceps, hamstrings en bilspieren, een trekdag ook de achterste
// schouder. Het voorstel kiest binnen een slot de oefening die op deze dag
// de meeste nog niet geraakte hoofdspieren toevoegt (zie voorstel.ts).
const FULL_A: DagSjabloon = {
  titel: 'Full body A',
  slots: [s('squat'), s('duwen_horizontaal'), s('trekken_verticaal'), s('heupscharnier'), s('duwen_verticaal'), s('core'), s('isolatie', 'biceps', 'triceps'), s('trekken_horizontaal')],
}
const FULL_B: DagSjabloon = {
  titel: 'Full body B',
  slots: [s('heupscharnier'), s('duwen_verticaal'), s('trekken_horizontaal'), s('lunge'), s('duwen_horizontaal'), s('core'), s('isolatie', 'middelste_schouder', 'achterste_schouder'), s('trekken_verticaal')],
}
const FULL_C: DagSjabloon = {
  titel: 'Full body C',
  slots: [s('lunge'), s('trekken_verticaal'), s('duwen_horizontaal'), s('heupscharnier'), s('trekken_horizontaal'), s('core'), s('isolatie', 'hamstrings', 'bilspieren', 'abductoren'), s('duwen_verticaal')],
}
const BOVEN: DagSjabloon = {
  titel: 'Bovenlichaam',
  slots: [s('duwen_horizontaal'), s('trekken_horizontaal'), s('duwen_verticaal'), s('trekken_verticaal'), s('isolatie', 'biceps'), s('isolatie', 'triceps'), s('core'), s('isolatie', 'middelste_schouder', 'achterste_schouder')],
}
const ONDER: DagSjabloon = {
  titel: 'Onderlichaam',
  slots: [s('squat'), s('heupscharnier'), s('lunge'), s('isolatie', 'hamstrings'), s('isolatie', 'quadriceps'), s('core'), s('isolatie', 'kuiten'), s('isolatie', 'bilspieren', 'abductoren', 'adductoren')],
}
const DUWEN: DagSjabloon = {
  titel: 'Duwen',
  slots: [s('duwen_horizontaal'), s('duwen_verticaal'), s('duwen_horizontaal'), s('isolatie', 'middelste_schouder'), s('isolatie', 'triceps'), s('core'), s('isolatie', 'borstspieren'), s('isolatie', 'triceps')],
}
const TREKKEN: DagSjabloon = {
  titel: 'Trekken',
  slots: [s('trekken_verticaal'), s('trekken_horizontaal'), s('trekken_horizontaal'), s('isolatie', 'biceps'), s('isolatie', 'achterste_schouder', 'rhomboideus', 'trapezius'), s('core'), s('isolatie', 'biceps'), s('trekken_verticaal')],
}
const BENEN: DagSjabloon = { ...ONDER, titel: 'Benen' }

export interface Split {
  naam: string
  dagen: readonly DagSjabloon[]
  uitleg: string
}

/** De split bij het aantal trainingsdagen en het niveau. */
export function kiesSplit(dagenPerWeek: number, niveau: Niveau): Split {
  const d = Math.min(Math.max(Math.round(dagenPerWeek), 1), 7)
  if (d === 1) return { naam: 'Full body', dagen: [FULL_A], uitleg: 'Een keer per week: een full body training die alles raakt.' }
  if (d === 2) return { naam: 'Full body', dagen: [FULL_A, FULL_B], uitleg: 'Twee keer per week full body, A en B om en om.' }
  if (d === 3 || niveau === 1) {
    const extra = d > 3 ? ' Als beginner: maximaal drie krachttrainingen, de andere dagen een groepsles of cardio.' : ''
    return { naam: 'Full body', dagen: [FULL_A, FULL_B, FULL_C], uitleg: `Drie keer per week full body, A, B en C.${extra}` }
  }
  if (d === 4) {
    return { naam: 'Boven en onder', dagen: [BOVEN, ONDER, { ...BOVEN, titel: 'Bovenlichaam 2' }, { ...ONDER, titel: 'Onderlichaam 2' }], uitleg: 'Vier keer per week: boven en onder om en om, elke spiergroep twee keer.' }
  }
  const extra = d > 5 ? ' Meer dan vijf krachtdagen is zelden nodig: gebruik de rest voor cardio of herstel.' : ''
  return { naam: 'Duwen, trekken, benen', dagen: [DUWEN, TREKKEN, BENEN, BOVEN, ONDER], uitleg: `Vijf keer per week: duwen, trekken, benen, boven en onder.${extra}` }
}

export interface Dosering {
  sets: number
  herhalingen: string
  rustSec: number
}

/** Sets, herhalingen en rust voor de hoofdoefeningen per doel. */
const HOOFD: Record<Doel, Dosering> = {
  kracht: { sets: 4, herhalingen: '4-6', rustSec: 150 },
  spiermassa: { sets: 3, herhalingen: '8-12', rustSec: 90 },
  afvallen: { sets: 3, herhalingen: '10-15', rustSec: 60 },
  conditie: { sets: 3, herhalingen: '12-15', rustSec: 45 },
  gezondheid: { sets: 3, herhalingen: '10-12', rustSec: 75 },
  revalidatie: { sets: 2, herhalingen: '12-15', rustSec: 60 },
  sport: { sets: 3, herhalingen: '6-10', rustSec: 120 },
}

/** Voor isolatie: wat lichter en korter rusten. */
const ISOLATIE: Record<Doel, Dosering> = {
  kracht: { sets: 3, herhalingen: '8-10', rustSec: 90 },
  spiermassa: { sets: 3, herhalingen: '10-15', rustSec: 60 },
  afvallen: { sets: 2, herhalingen: '12-15', rustSec: 45 },
  conditie: { sets: 2, herhalingen: '15-20', rustSec: 30 },
  gezondheid: { sets: 2, herhalingen: '12-15', rustSec: 60 },
  revalidatie: { sets: 2, herhalingen: '12-15', rustSec: 60 },
  sport: { sets: 3, herhalingen: '8-12', rustSec: 60 },
}

export function dosering(doel: Doel, patroon: Patroon | null, niveau: Niveau): Dosering {
  if (patroon === 'cardio') return { sets: 1, herhalingen: doel === 'afvallen' ? '20-30 min' : '15-20 min', rustSec: 0 }
  if (patroon === 'core') return { sets: niveau === 1 ? 2 : 3, herhalingen: '30-45 sec', rustSec: 45 }
  const basis = patroon === 'isolatie' || patroon === null ? ISOLATIE[doel] : HOOFD[doel]
  // Een beginner start met een set minder en nooit met zware herhalingen.
  if (niveau === 1) {
    const herhalingen = doel === 'kracht' && basis.herhalingen === '4-6' ? '6-8' : basis.herhalingen
    return { ...basis, sets: Math.max(2, basis.sets - 1), herhalingen }
  }
  return basis
}

/** Het hoofddoel: veiligheid eerst, daarna het meest specifieke doel. */
const PRIORITEIT: readonly Doel[] = ['revalidatie', 'kracht', 'spiermassa', 'sport', 'afvallen', 'conditie', 'gezondheid']

export function hoofddoel(doelen: readonly Doel[]): Doel {
  return PRIORITEIT.find((d) => doelen.includes(d)) ?? 'gezondheid'
}

const ALLE_MATERIAAL: readonly Materiaal[] = ['geen', 'dumbbell', 'barbell', 'kettlebell', 'machine', 'kabel', 'band', 'bank', 'cardio_apparaat', 'overig']
const THUIS_MATERIAAL: readonly Materiaal[] = ['geen', 'band', 'dumbbell', 'kettlebell']

/** Welk materiaal er is: in de club alles, alleen thuis wat je thuis hebt. */
export function beschikbaarMateriaal(voorkeuren: readonly Voorkeur[]): readonly Materiaal[] {
  if (voorkeuren.includes('thuis') && !voorkeuren.includes('sportschool')) return THUIS_MATERIAAL
  return ALLE_MATERIAAL
}

/** Voorkeur voor materiaal per niveau: een beginner leert eerst op machines. */
export const MATERIAAL_VOORKEUR: Record<Niveau, readonly Materiaal[]> = {
  1: ['machine', 'kabel', 'dumbbell', 'geen', 'bank', 'cardio_apparaat', 'band', 'kettlebell', 'barbell', 'overig'],
  2: ['dumbbell', 'barbell', 'kabel', 'machine', 'geen', 'kettlebell', 'bank', 'cardio_apparaat', 'band', 'overig'],
  3: ['barbell', 'dumbbell', 'kettlebell', 'geen', 'kabel', 'machine', 'bank', 'cardio_apparaat', 'band', 'overig'],
}

/** Aantal oefeningen per training uit de beschikbare tijd (10 minuten warming-up eraf). */
export function aantalOefeningen(minuten: number): number {
  return Math.min(Math.max(Math.floor((minuten - 10) / 8), 3), 8)
}
