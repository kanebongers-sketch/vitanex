// ─── Fit Factory Club, training: de regels achter het schemavoorstel (PUUR) ─
// Vakkennis in tabellen, zoals een personal trainer een startschema opbouwt:
// welke split bij hoeveel dagen, welke bewegingspatronen per dag, in welke
// volgorde, en welke sets, herhalingen, rust en reserve bij welk doel. Geen AI,
// geen kosten: vaste regels die je hier kunt nalezen.

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
  /** Welk deel van het lichaam deze dag traint (voor de explosieve oefening). */
  regio: 'heel' | 'boven' | 'onder'
}

const s = (patroon: Patroon, ...spieren: Spier[]): Slot => (spieren.length > 0 ? { patroon, spieren } : { patroon })

// Regel 1, balans: elke full body dag heeft een squat of lunge, een
// heupscharnier, een duw- en een trekoefening. Over de week evenveel trekken
// als duwen (of meer): de meeste mensen zitten veel en hebben een sterke
// voorkant en een zwakke achterkant. De slots staan in volgorde van belang:
// bij weinig tijd vallen de laatste slots af, nooit de basis.
// Het voorstel kiest binnen een slot de oefening die op deze dag de meeste nog
// niet geraakte hoofdspieren toevoegt (zie voorstel.ts).
const FULL_A: DagSjabloon = {
  regio: 'heel',
  titel: 'Full body A',
  slots: [s('squat'), s('duwen_horizontaal'), s('trekken_verticaal'), s('heupscharnier'), s('trekken_horizontaal'), s('duwen_verticaal'), s('core'), s('isolatie', 'biceps', 'triceps')],
}
const FULL_B: DagSjabloon = {
  regio: 'heel',
  titel: 'Full body B',
  slots: [s('heupscharnier'), s('duwen_verticaal'), s('trekken_horizontaal'), s('lunge'), s('trekken_verticaal'), s('duwen_horizontaal'), s('core'), s('isolatie', 'middelste_schouder', 'achterste_schouder')],
}
const FULL_C: DagSjabloon = {
  regio: 'heel',
  titel: 'Full body C',
  slots: [s('lunge'), s('trekken_verticaal'), s('duwen_horizontaal'), s('heupscharnier'), s('trekken_horizontaal'), s('core'), s('isolatie', 'hamstrings', 'bilspieren', 'abductoren'), s('duwen_verticaal')],
}
const BOVEN: DagSjabloon = {
  regio: 'boven',
  titel: 'Bovenlichaam',
  slots: [s('duwen_horizontaal'), s('trekken_horizontaal'), s('trekken_verticaal'), s('duwen_verticaal'), s('isolatie', 'achterste_schouder', 'middelste_schouder'), s('isolatie', 'biceps'), s('isolatie', 'triceps'), s('core')],
}
const ONDER: DagSjabloon = {
  regio: 'onder',
  titel: 'Onderlichaam',
  slots: [s('squat'), s('heupscharnier'), s('lunge'), s('isolatie', 'hamstrings'), s('core'), s('isolatie', 'quadriceps'), s('isolatie', 'kuiten'), s('isolatie', 'bilspieren', 'abductoren', 'adductoren')],
}
const DUWEN: DagSjabloon = {
  regio: 'boven',
  titel: 'Duwen',
  slots: [s('duwen_horizontaal'), s('duwen_verticaal'), s('duwen_horizontaal'), s('isolatie', 'middelste_schouder'), s('isolatie', 'triceps'), s('core'), s('isolatie', 'borstspieren'), s('isolatie', 'triceps')],
}
const TREKKEN: DagSjabloon = {
  regio: 'boven',
  titel: 'Trekken',
  slots: [s('trekken_verticaal'), s('trekken_horizontaal'), s('trekken_horizontaal'), s('isolatie', 'achterste_schouder', 'rhomboideus', 'trapezius'), s('isolatie', 'biceps'), s('core'), s('trekken_verticaal'), s('isolatie', 'biceps')],
}
const BENEN: DagSjabloon = { ...ONDER, titel: 'Benen' }

export interface Split {
  naam: string
  dagen: readonly DagSjabloon[]
  uitleg: string
}

/**
 * Regel 2, de split bij het aantal dagen. Elke spiergroep wil minstens twee
 * keer per week een prikkel. Tot drie dagen: full body (elke dag alles). Vier
 * dagen: boven en onder, elk twee keer. Vijf of meer: duwen, trekken, benen,
 * boven, onder. Een beginner herstelt nog niet van meer dan drie zware
 * trainingen: dan blijft het full body en zijn de andere dagen voor cardio of
 * groepslessen.
 */
export function kiesSplit(dagenPerWeek: number, niveau: Niveau): Split {
  const d = Math.min(Math.max(Math.round(dagenPerWeek), 1), 7)
  if (d === 1) return { naam: 'Full body', dagen: [FULL_A], uitleg: 'Je traint een keer per week, daarom een full body training die alle grote spiergroepen raakt.' }
  if (d === 2) return { naam: 'Full body', dagen: [FULL_A, FULL_B], uitleg: 'Je traint twee keer per week, daarom full body A en B om en om: elke spiergroep twee keer per week.' }
  if (d === 3 || niveau === 1) {
    const uitleg = d > 3
      ? `Je wilt ${d} keer per week trainen. Als beginner hooguit drie krachttrainingen: full body A, B en C, de andere dagen cardio of een groepsles.`
      : 'Je traint drie keer per week, daarom full body A, B en C: elke spiergroep drie keer per week.'
    return { naam: 'Full body', dagen: [FULL_A, FULL_B, FULL_C], uitleg }
  }
  if (d === 4) {
    return {
      naam: 'Boven en onder',
      dagen: [BOVEN, ONDER, { ...BOVEN, titel: 'Bovenlichaam 2' }, { ...ONDER, titel: 'Onderlichaam 2' }],
      uitleg: 'Je traint vier keer per week, daarom boven en onder om en om: elke spiergroep twee keer per week en genoeg herstel ertussen.',
    }
  }
  const extra = d > 5 ? ' Meer dan vijf krachtdagen is zelden nodig: gebruik de andere dagen voor cardio of herstel.' : ''
  return { naam: 'Duwen, trekken, benen', dagen: [DUWEN, TREKKEN, BENEN, BOVEN, ONDER], uitleg: `Je traint ${d} keer per week, daarom duwen, trekken, benen, boven en onder: elke spiergroep twee keer per week.${extra}` }
}

/** Regel 3, sportspecifiek: een explosieve oefening vooraan, als het zenuwstelsel nog fris is. Niet voor beginners. */
const EXPLOSIEF_SLOT: Record<DagSjabloon['regio'], Slot> = {
  heel: s('explosief'),
  boven: s('explosief', 'borstspieren', 'latissimus', 'voorste_schouder', 'triceps', 'rechte_buikspier'),
  onder: s('explosief', 'quadriceps', 'bilspieren', 'hamstrings', 'kuiten'),
}

export function metExplosief(split: Split, doel: Doel, niveau: Niveau): Split {
  if (doel !== 'sport' || niveau === 1) return split
  // Op een bovendag een worp of slam, op een benendag een sprong.
  return { ...split, dagen: split.dagen.map((d) => ({ ...d, slots: [EXPLOSIEF_SLOT[d.regio], ...d.slots] })) }
}

/**
 * Regel 4, volgorde: van groot naar klein. Eerst explosief, dan de oefeningen
 * met meerdere gewrichten (squat, heupscharnier, duwen, trekken), dan isolatie,
 * dan de romp (een vermoeide romp onder een zware squat is onveilig) en cardio
 * als afsluiter.
 */
export function volgordeRang(patroon: Patroon | null): number {
  if (patroon === 'explosief') return 0
  if (patroon === 'isolatie' || patroon === null) return 2
  if (patroon === 'core') return 3
  if (patroon === 'cardio') return 4
  return 1
}

export interface Dosering {
  sets: number
  herhalingen: string
  rustSec: number
}

/**
 * Regel 5, dosering per doel (hoofdoefeningen). Kracht: zwaar en weinig
 * herhalingen met lange rust. Spiermassa: 8 tot 12 herhalingen, genoeg volume.
 * Afvallen en conditie: meer herhalingen en korte rust, zodat de hartslag
 * hoog blijft. Gezond en fit: het midden. Sport: kracht met snelheid.
 */
const HOOFD: Record<Doel, Dosering> = {
  kracht: { sets: 4, herhalingen: '4-6', rustSec: 150 },
  spiermassa: { sets: 3, herhalingen: '8-12', rustSec: 90 },
  afvallen: { sets: 3, herhalingen: '10-15', rustSec: 60 },
  conditie: { sets: 3, herhalingen: '12-15', rustSec: 45 },
  gezondheid: { sets: 3, herhalingen: '10-12', rustSec: 75 },
  revalidatie: { sets: 2, herhalingen: '12-15', rustSec: 60 },
  sport: { sets: 3, herhalingen: '6-10', rustSec: 120 },
}

/** Isolatie: lichter, meer herhalingen en korter rusten. */
const ISOLATIE: Record<Doel, Dosering> = {
  kracht: { sets: 3, herhalingen: '8-10', rustSec: 90 },
  spiermassa: { sets: 3, herhalingen: '10-15', rustSec: 60 },
  afvallen: { sets: 2, herhalingen: '12-15', rustSec: 45 },
  conditie: { sets: 2, herhalingen: '15-20', rustSec: 30 },
  gezondheid: { sets: 2, herhalingen: '12-15', rustSec: 60 },
  revalidatie: { sets: 2, herhalingen: '12-15', rustSec: 60 },
  sport: { sets: 3, herhalingen: '8-12', rustSec: 60 },
}

export interface DoseringOpties {
  /** Het lid heeft een klacht: geen zware lasten (nooit onder 8 herhalingen). */
  klacht?: boolean
  /** Weinig tijd: een set minder (nooit minder dan 2). */
  compact?: boolean
}

function lichter(herhalingen: string): string {
  return herhalingen === '4-6' || herhalingen === '6-8' || herhalingen === '6-10' ? '8-12' : herhalingen
}

export function dosering(doel: Doel, patroon: Patroon | null, niveau: Niveau, opties: DoseringOpties = {}): Dosering {
  if (patroon === 'cardio') return { sets: 1, herhalingen: doel === 'afvallen' ? '20-30 min' : '15-20 min', rustSec: 0 }
  if (patroon === 'core') return { sets: niveau === 1 ? 2 : 3, herhalingen: '30-45 sec', rustSec: 45 }
  if (patroon === 'explosief') return { sets: 3, herhalingen: '3-5', rustSec: 90 }
  let d = patroon === 'isolatie' || patroon === null ? ISOLATIE[doel] : HOOFD[doel]
  // Een beginner start met een set minder en nooit met zware herhalingen: eerst de techniek.
  if (niveau === 1) d = { ...d, sets: Math.max(2, d.sets - 1), herhalingen: d.herhalingen === '4-6' ? '6-8' : d.herhalingen }
  if (opties.klacht) d = { ...d, herhalingen: lichter(d.herhalingen) }
  if (opties.compact) d = { ...d, sets: Math.max(2, d.sets - 1) }
  return d
}

/**
 * Regel 6, reserve (RIR: herhalingen die je nog had gekund). Een beginner
 * stopt ruim voor het falen (3), net als bij een klacht of revalidatie. Voor
 * spiermassa mag het dichter bij het falen (1), kracht houdt 2 over zodat de
 * techniek strak blijft. Romp, cardio en explosief: geen RIR.
 */
export function reserve(doel: Doel, patroon: Patroon | null, niveau: Niveau, klacht = false): number | null {
  if (patroon === 'core' || patroon === 'cardio' || patroon === 'explosief') return null
  if (niveau === 1 || klacht || doel === 'revalidatie') return 3
  if (doel === 'spiermassa') return 1
  if (doel === 'gezondheid') return 3
  return 2
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

export function alleenThuis(voorkeuren: readonly Voorkeur[]): boolean {
  return voorkeuren.includes('thuis') && !voorkeuren.includes('sportschool')
}

/**
 * Regel 7, materiaal per niveau: een beginner leert eerst op machines en aan
 * de kabel (vaste baan, veilig, snel te leren), daarna dumbbells. Gemiddeld:
 * dumbbells en barbell. Gevorderd: vrije gewichten als basis.
 */
export const MATERIAAL_VOORKEUR: Record<Niveau, readonly Materiaal[]> = {
  1: ['machine', 'kabel', 'dumbbell', 'geen', 'bank', 'cardio_apparaat', 'band', 'kettlebell', 'barbell', 'overig'],
  2: ['dumbbell', 'barbell', 'kabel', 'machine', 'geen', 'kettlebell', 'bank', 'cardio_apparaat', 'band', 'overig'],
  3: ['barbell', 'dumbbell', 'kettlebell', 'geen', 'kabel', 'machine', 'bank', 'cardio_apparaat', 'band', 'overig'],
}

// ── Tijd ────────────────────────────────────────────────────────────────────

/** Warming-up voor elke training (minuten). */
export const WARMING_UP_MIN = 10
/** Werktijd van een set (seconden) en wisselen en opbouwen per oefening (minuten). */
const SET_SEC = 40
const WISSEL_MIN = 1

/**
 * Regel 8, het aantal oefeningen volgt uit de tijd. Een oefening kost sets x
 * (werk + rust) plus een minuut wisselen. Kracht met lange rust past dus minder
 * vaak in een uur dan een schema voor conditie.
 */
export function minutenVoor(d: Dosering, patroon: Patroon | null): number {
  if (patroon === 'cardio') return Number(/^(\d+)/.exec(d.herhalingen)?.[1] ?? 15)
  return (d.sets * (SET_SEC + d.rustSec)) / 60 + WISSEL_MIN
}

/** Cardio als afsluiter bij afvallen of conditie, korter als de training kort is. */
export function cardioDosering(doel: Doel, minuten: number): Dosering {
  // Krachttraining houdt de spieren op peil tijdens het afvallen: bij een korte training gaat de tijd daar eerst naartoe.
  if (minuten < 45) return { sets: 1, herhalingen: '10-15 min', rustSec: 0 }
  if (minuten < 60) return { sets: 1, herhalingen: '15-20 min', rustSec: 0 }
  return dosering(doel, 'cardio', 2)
}

export const MIN_OEFENINGEN = 3
export const MAX_OEFENINGEN = 8
