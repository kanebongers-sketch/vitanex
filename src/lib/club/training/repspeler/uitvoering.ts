// ─── Club, rep-speler: het uitvoeringstempo per oefening (PUUR) ─────────────
// Besluit Kane (03-11-2026): "Bij elke oefening gaan kijken welke tijd het
// beste is voor de uitvoering." Dit vervangt de vaste 1 seconde heen en 1
// seconde terug van 29-10-2026. Elke kiesbare Blender-oefening (slug uit
// oefenrenders.data.ts) heeft hier een eigen tempo voor het beeld in de
// rep-speler; de test (uitvoering.test.ts) eist dat elke render er een heeft.
//
// Tempo in seconden, in de gangbare volgorde: excentrisch (remmen, zakken of
// laten zakken), pauze op het gerekte punt, concentrisch (duwen, trekken,
// optillen), pauze op het samengetrokken punt. Welke daarvan de heenweg van de
// render is, regelt heen_is van de render (tijdlijn.ts).
//
// Onderbouwing: gangbare praktijk voor een gemiddeld lid. Gecontroleerd remmen
// in ongeveer 2 tot 3 seconden en duwen of trekken in ongeveer 1 seconde, met
// een korte stilstand waar die techniek helpt (onderin zonder te veren,
// bovenin even knijpen). Sprongen en de kettlebell swing zijn explosief.
// Richtlijnen: ACSM Position Stand "Progression Models in Resistance Training
// for Healthy Adults" (2009: langzaam tot gemiddeld tempo voor beginners en
// gevorderden) en NSCA Essentials of Strength Training and Conditioning
// (excentrisch gecontroleerd, concentrisch beheerst tot snel). De tellen uit de
// coaching van elke oefening (src/lib/club/training/coaching) zijn de maat: het
// beeld doet precies wat de coaching zegt (1 tel is 1 seconde, "kort stil" is
// een halve seconde, "2 tot 3 tellen" is 2,5 seconden).
//
// Houdoefeningen (plank, zijplank, hollow hold) en de farmer walk hebben geen
// herhalingen: hun lus speelt op eigen snelheid en de speler telt seconden.
//
// `labels` vervangt het woord van een fase waar "vast" niet klopt omdat de
// render daar beweegt (de sprong van de squat jump en de burpee).

import type { Tempo } from './typen'

export interface Uitvoering {
  tempo: Tempo
  /** Ander fasewoord voor het vasthouden (verste punt) of de rust (eindpunt), alleen als de render daar beweegt. */
  labels?: { houden?: string; rust?: string }
  /** Waarom dit tempo: kort, voor wie de tabel bijwerkt. */
  waarom: string
}

export interface Houdregel {
  soort: 'vasthouden'
  waarom: string
}

export type UitvoeringRegel = Uitvoering | Houdregel

/** Grenzen voor een realistisch tempo (test). */
export const UITVOERING_GRENZEN = {
  minBeweging: 0.3,
  maxBeweging: 4,
  maxPauze: 3,
  minHerhaling: 0.6,
  maxHerhaling: 8,
} as const

/** Tempo in de volgorde excentrisch, pauze gerekt, concentrisch, pauze samen. */
function t(excentrisch: number, pauzeGerekt: number, concentrisch: number, pauzeSamen: number, waarom: string, labels?: Uitvoering['labels']): Uitvoering {
  return { tempo: { excentrisch, pauzeGerekt, concentrisch, pauzeSamen }, waarom, ...(labels ? { labels } : {}) }
}

const HOUDEN = (waarom: string): Houdregel => ({ soort: 'vasthouden', waarom })

const SQUAT_LOS = 'Squat met los gewicht: 3 sec gecontroleerd zakken, kort stil zonder te veren, 1 sec omhoog.'
const CURL = 'Curl: 1 sec omhoog, kort knijpen, 2,5 sec laten zakken; remmen geeft de meeste prikkel.'
const SCHOUDER_TIL = 'Heffen met losse gewichten: 1 sec omhoog, kort stil, 2 sec rustig omlaag zonder zwaaien.'
const ROW = 'Roeien: 1 sec trekken, kort vasthouden, 2 sec gecontroleerd laten zakken.'
const LUNGE = 'Lunge: 2 sec zakken, 1 sec terug; elke kant telt als een herhaling.'
const OPTREK = 'Optrekken: 1 sec omhoog tot de kin boven de stang, kort stil, 2,5 sec gecontroleerd zakken tot gestrekte armen.'
const FLY = 'Fly: 3 sec open (rek op de borst), kort stil, 2 sec terug.'

export const UITVOERING: Readonly<Record<string, UitvoeringRegel>> = {
  // Squat en benen
  'back-squat': t(2.5, 0.5, 1, 0, 'Squat met stang: 2 tot 3 sec zakken, kort stil zonder te veren, krachtig omhoog in 1 sec.'),
  'front-squat': t(2.5, 0.5, 1, 0, 'Front squat: 2 tot 3 sec zakken met rechte romp, kort stil, krachtig omhoog.'),
  'goblet-squat': t(3, 0.5, 1, 0, SQUAT_LOS),
  'squat-met-dumbbells': t(3, 0.5, 1, 0, SQUAT_LOS),
  'sumo-squat-met-dumbbell': t(3, 0.5, 1, 0, SQUAT_LOS),
  'squat-met-lichaamsgewicht': t(3, 0.5, 1, 0, 'Squat zonder gewicht: langzaam zakken maakt hem zwaarder en leert de houding; 3 sec omlaag, 1 sec omhoog.'),
  'squat-naar-een-bank': t(3, 0.3, 1, 0, 'Squat naar een bank: 3 sec zakken, de bank alleen aantikken, 1 sec omhoog.'),
  'thruster-met-barbell': t(2, 0, 1, 0.5, 'Thruster: 2 sec front squat omlaag, in een beweging explosief omhoog en drukken, stang terug op de schouders.'),
  'achterwaartse-lunge': t(2, 0.5, 1, 0, LUNGE),
  'achterwaartse-lunge-met-dumbbells': t(2, 0, 1, 0, LUNGE),
  'lunge-met-barbell': t(2, 0, 1, 0, LUNGE),
  'lunge-met-dumbbells': t(2, 0, 1, 0, LUNGE),
  'zijwaartse-lunge': t(2, 0, 1, 0, 'Zijwaartse lunge: 2 sec zakken in de heup, 1 sec terug naar het midden.'),
  'walking-lunge-met-lichaamsgewicht': t(2, 0, 1.2, 0, 'Walking lunge: 2 sec zakken, iets langer omhoog omdat je doorstapt.'),
  'split-squat': t(2, 0.5, 1, 0, 'Split squat: 2 sec zakken, kort stil, 1 sec omhoog.'),
  'split-squat-met-dumbbells': t(2, 0.5, 1, 0, 'Split squat: 2 sec zakken, kort stil, 1 sec omhoog.'),
  'bulgarian-split-squat': t(3, 0.5, 1, 0, 'Bulgarian split squat: 3 sec zakken voor balans en controle, kort stil, 1 sec omhoog.'),
  'step-up': t(2, 0, 1, 0.5, 'Step-up: 1 sec opstappen via het voorste been, kort rechtop, 2 sec gecontroleerd afstappen; elke kant telt als een herhaling.'),
  'calf-raise-met-lichaamsgewicht': t(3, 0, 1, 1, 'Kuit: 1 sec omhoog, 1 sec vast bovenop, 3 sec langzaam zakken (kuiten veren anders mee).'),

  // Heupscharnier en billen
  deadlift: t(2, 1, 1.5, 0, 'Deadlift: gecontroleerd omhoog in 1,5 sec, 2 sec terug, 1 sec op de vloer om opnieuw op te bouwen.'),
  'sumo-deadlift': t(2, 0, 1, 0.5, 'Sumo deadlift: 1 sec omhoog, kort stil, 2 sec terug naar de vloer.'),
  'deadlift-met-kettlebell': t(2, 0, 1, 0.5, 'Kettlebell deadlift: 1 sec omhoog, kort stil, 2 sec terug.'),
  'roemeense-deadlift-met-barbell': t(3, 0.5, 1, 0, 'RDL: 3 sec zakken met de heupen naar achteren voor rek op de hamstrings, kort stil, 1 sec omhoog.'),
  'roemeense-deadlift-met-dumbbells': t(3, 0.5, 1, 0, 'RDL: 3 sec zakken met de heupen naar achteren voor rek op de hamstrings, kort stil, 1 sec omhoog.'),
  'good-morning': t(3, 0.5, 1.5, 0, 'Good morning: 3 sec voorover, kort stil, 1,5 sec rustig omhoog (stang op de rug).'),
  'kettlebell-swing': t(0.7, 0, 0.6, 0.2, 'Swing: explosief uit de heupen omhoog, bel even laten zweven en vrij terug laten vallen; ongeveer 1,5 sec per swing.'),
  'glute-bridge': t(2, 0, 1, 2, 'Glute bridge: 1 sec omhoog, 2 sec vasthouden met de billen aan, 2 sec omlaag.'),
  'glute-bridge-op-een-been': t(2, 0, 1, 2, 'Glute bridge op een been: 1 sec omhoog, 2 sec vast, 2 sec omlaag per kant.'),
  superman: t(2, 0, 1, 2, 'Superman: 1 sec optillen, 2 sec vasthouden voor de rugstrekkers, 2 sec omlaag.'),

  'nordic-hamstring-curl': t(3.5, 0.5, 1.5, 0.5, 'Nordic: 3 tot 4 sec remmend voorover zakken, opvangen op de handen, in 1,5 sec terug omhoog.'),

  // Duwen
  'dips-voor-de-borst': t(2.5, 0.5, 1, 0, 'Dips: 2 tot 3 sec zakken met de romp voorover, kort stil zonder te veren, 1 sec omhoog duwen.'),
  'push-up': t(2, 0.5, 1, 0, 'Push-up: 2 sec zakken, kort stil, 1 sec omhoog duwen.'),
  'push-up-met-smalle-handen': t(2, 0.5, 1, 0, 'Push-up: 2 sec zakken, kort stil, 1 sec omhoog duwen.'),
  'push-up-op-knieen': t(2, 0, 1, 0, 'Push-up op knieen: 2 sec zakken, 1 sec omhoog.'),
  'pike-push-up': t(2, 0, 1, 0, 'Pike push-up: 2 sec gecontroleerd met het hoofd omlaag, 1 sec terug.'),
  'overhead-press': t(2, 0, 1, 0, 'Overhead press: 1 sec omhoog drukken, 2 sec gecontroleerd terug.'),
  'dumbbell-shoulder-press': t(2, 0.5, 1, 0, 'Schouderdruk: 2 sec omlaag, kort stil onderin, 1 sec omhoog.'),
  'arnold-press': t(2, 0, 1, 0.5, 'Arnold press: 1 sec draaiend omhoog, kort stil, 2 sec terug.'),
  'dumbbell-fly': t(3, 0.5, 2, 0, FLY),
  'schuine-dumbbell-fly': t(3, 0.5, 2, 0, FLY),
  'pullover-met-dumbbell': t(3, 0.5, 2, 0, 'Pullover: 3 sec achter het hoofd zakken, kort stil, 2 sec terug.'),
  'skull-crusher': t(3, 0.5, 1, 0, 'Triceps liggend: 3 sec gecontroleerd zakken (elleboog), kort stil, 1 sec strekken.'),
  'triceps-extension-liggend-met-dumbbell': t(3, 0.5, 1, 0, 'Triceps liggend: 3 sec gecontroleerd zakken (elleboog), kort stil, 1 sec strekken.'),
  'triceps-extension-boven-het-hoofd': t(3, 0.5, 1, 0, 'Triceps boven het hoofd: 3 sec zakken in de rek, kort stil, 1 sec strekken.'),
  'triceps-kickback': t(2, 0, 1, 1, 'Kickback: 1 sec strekken, 1 sec vast met de arm gestrekt, 2 sec terug.'),

  // Trekken en armen
  'pull-up': t(2.5, 0, 1, 0.5, OPTREK),
  'chin-up': t(2.5, 0, 1, 0.5, OPTREK),
  'pull-up-met-neutrale-greep': t(2.5, 0, 1, 0.5, OPTREK),
  'negatieve-pull-up': t(4, 0, 1.5, 0.5, 'Negatieve pull-up: 4 sec zo langzaam mogelijk zakken, daarna in 1,5 sec via de box terug naar de bovenstand.'),
  'inverted-row': t(2, 0, 1, 0.5, 'Inverted row: 1 sec de borst naar de stang, kort vasthouden, 2 sec zakken tot gestrekte armen.'),
  'barbell-row': t(2, 0, 1, 0.5, ROW),
  'barbell-row-met-onderhandse-greep': t(2, 0, 1, 0.5, ROW),
  'voorovergebogen-row-met-dumbbells': t(2, 0, 1, 0.5, ROW),
  'row-op-een-schuine-bank': t(2, 0, 1, 1, 'Row op de bank: 1 sec trekken, 1 sec vast met de schouderbladen bij elkaar, 2 sec omlaag.'),
  'reverse-fly': t(2, 0, 1, 0.5, 'Reverse fly: 1 sec heffen, kort vasthouden, 2 sec omlaag; licht gewicht, geen zwaai.'),
  'upright-row-met-dumbbells': t(2, 0, 1, 0.5, SCHOUDER_TIL),
  'lateral-raise': t(2.5, 0, 1, 0.5, 'Zijwaarts heffen: 1 sec omhoog, kort stil, 2 tot 3 sec omlaag zonder zwaaien.'),
  'front-raise-met-dumbbells': t(2, 0, 1, 0.5, SCHOUDER_TIL),
  'schouders-ophalen-met-barbell': t(2, 0, 1, 1, 'Shrug: 1 sec optrekken, 1 sec vast bovenin, 2 sec omlaag.'),
  'schouders-ophalen-met-dumbbells': t(2, 0, 1, 1, 'Shrug: 1 sec optrekken, 1 sec vast bovenin, 2 sec omlaag.'),
  'barbell-curl': t(2.5, 0, 1, 0.5, CURL),
  'curl-met-ez-stang': t(2.5, 0, 1, 0.5, CURL),
  'dumbbell-curl': t(2.5, 0, 1, 0.5, CURL),
  'curl-op-een-schuine-bank': t(3, 0, 1, 0.5, 'Curl op de schuine bank: 1 sec omhoog, kort stil, 3 sec omlaag in de rek.'),
  'hammer-curl': t(3, 0, 1, 0.5, 'Hammer curl: 1 sec omhoog, kort stil, 3 sec omlaag.'),

  // Buik en romp
  crunch: t(2, 0, 1, 0.5, 'Crunch: 1 sec oprollen, kort stil, 2 sec terug zonder te ploffen.'),
  'reverse-crunch': t(2, 0, 1, 0.5, 'Reverse crunch: 1 sec bekken optillen, kort stil, 2 sec terug.'),
  'crunch-met-draai': t(2, 0, 1, 0.5, 'Crunch met draai: 1 sec op en draaien, kort stil, 2 sec terug; elke kant een herhaling.'),
  'fietsende-crunch': t(1, 0, 1, 1, 'Fietsende crunch: 1 sec draaien, 1 sec vast, rustig wisselen; elke kant een herhaling.'),
  'russian-twist': t(1, 0, 1, 0.5, 'Russian twist: 1 sec draaien, kort stil, 1 sec terug; elke kant een herhaling.'),
  'leg-raise-liggend': t(3, 0, 2, 0, 'Leg raise: 2 sec omhoog, 3 sec langzaam omlaag met de onderrug op de vloer.'),
  'dead-bug': t(3, 0.5, 2, 0, 'Dead bug: 3 sec arm en been uitstrekken, kort stil, 2 sec terug; elke kant een herhaling.'),
  'bird-dog': t(2, 0, 2, 2, 'Bird dog: 2 sec strekken, 2 sec vasthouden voor balans, 2 sec terug; elke kant een herhaling.'),
  'hanging-knee-raise': t(3, 0, 1, 0.5, 'Hanging knee raise: 1 sec knieen op en bekken oprollen, kort stil, 3 sec rustig laten zakken zonder zwaai.'),
  'mountain-climber': t(0.35, 0, 0.35, 0, 'Mountain climber: vlot, ongeveer 0,7 sec per knie; elke knie telt als een herhaling.'),

  // Sprongen en conditie
  'squat-jump': t(0.8, 0, 0.4, 1.2, 'Squat jump: snel inzakken, explosief afzetten, zacht landen en beheerst opnieuw; ongeveer 2,4 sec per sprong.', { rust: 'springen' }),
  'box-jump': t(1.2, 0.4, 0.6, 0.8, 'Box jump: kort inzakken, explosief springen en zacht landen op de box (0,6 sec), kort rechtop, in 1,2 sec rustig afstappen; ongeveer 3 sec per sprong.'),
  burpee: t(0.7, 2, 0.6, 1, 'Burpee: vlot naar de grond, voeten naar achteren en terug, explosief omhoog in de sprong; ongeveer 4 sec per herhaling.', { houden: 'omlaag', rust: 'springen' }),

  // Houdoefeningen en dragen: lus op eigen snelheid, de speler telt seconden.
  plank: HOUDEN('Houdoefening: de speler telt seconden, de lus is alleen ademen.'),
  zijplank: HOUDEN('Houdoefening per kant: de speler telt seconden.'),
  'hollow-hold': HOUDEN('Houdoefening: de speler telt seconden.'),
  'wall-sit': HOUDEN('Houdoefening tegen de muur: de speler telt seconden, de lus is alleen ademen.'),
  'farmer-walk': HOUDEN('Dragen op tijd: rustig wandeltempo, twee passen per lus, de speler telt seconden.'),
}

export function isHoudregel(r: UitvoeringRegel): r is Houdregel {
  return 'soort' in r && r.soort === 'vasthouden'
}

/** Het uitvoeringstempo van een render (slug), of null bij een houdoefening of een onbekende slug. */
export function uitvoeringVoor(slug: string): Uitvoering | null {
  const r = UITVOERING[slug]
  return r && !isHoudregel(r) ? r : null
}

/** Duur van een herhaling met dit tempo, in seconden. */
export function herhalingDuur(tempo: Tempo): number {
  return tempo.excentrisch + tempo.pauzeGerekt + tempo.concentrisch + tempo.pauzeSamen
}
