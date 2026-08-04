// ─── LifeOS — de vier krachtsessies van het 4-weken blok ────────────────────
// Ontworpen voor één specifieke situatie: een ERVAREN lifter in een gematigd
// calorietekort die spiermassa en kracht wil behouden terwijl hij vet verliest.
// Dat doel bepaalt elke keuze hieronder:
//
// 1. ZWAAR BLIJVEN TILLEN. Spierbehoud in een tekort komt van INTENSITEIT, niet
//    van volume. Elke sessie opent daarom met een compound in een lage rep-range
//    (4-8) op RIR 2 — het signaal "houd deze spier" is een zware set, en die kost
//    relatief weinig herstel per eenheid effect.
// 2. VOLUME BEHEERST. In een tekort herstel je slechter, dus geen 30-sets-sessies.
//    Per sessie 20-26 werksets, waarvan de meeste op 60-90s rust. Week 4 haalt er
//    per isolatie nog een set af (zie `week-modulatie.ts`).
// 3. FAILURE SPAARZAAM. Compounds op RIR 1-3 (nooit tot falen: dat kost dagen
//    herstel voor één extra rep), isolatie mag op RIR 0-2 — daar is de
//    vermoeidheid lokaal en goedkoop.
// 4. ELKE OEFENING HEEFT EEN GEWICHTSSTAP. Die staat hier omdat de progressie-
//    engine 'm nodig heeft: 2,5 kg op een bench is een sprong van ~2%, op een
//    leg press is 5 kg dat pas. Verkeerde stap = of nooit progressie, of elke
//    week een mislukte sessie.
//
// GEEN KILO'S IN DIT BESTAND. Zie de kop van `types.ts`: je startgewicht is wat
// je in week 1 tilt, daarna rekent `progressie.ts` het voorstel uit je eigen log.

import type { KrachtSessie } from './types'

/** Rust-standaarden, benoemd zodat de bedoeling leesbaar blijft. */
const RUST_ZWAAR = 180
const RUST_COMPOUND = 150
const RUST_SECUNDAIR = 120
const RUST_HYPERTROFIE = 90
const RUST_ISOLATIE = 60
const RUST_KORT = 45

/** RIR-banden. Compounds blijven van falen af; isolatie mag eraan. */
const RIR_COMPOUND: readonly [number, number] = [1, 3]
const RIR_HYPERTROFIE: readonly [number, number] = [1, 2]
const RIR_ISOLATIE: readonly [number, number] = [0, 2]

/** Gewichtsstappen per soort belasting — de kleinste zinvolle sprong. */
const STAP_BARBELL_BOVEN = 2.5
const STAP_BARBELL_ONDER = 5
const STAP_MACHINE = 5
const STAP_DUMBBELL = 2.5
const STAP_KABEL = 2.5
const STAP_KLEIN = 1.25

/** Warming-up voor bovenlichaam. Kort; de eerste compound bouwt zelf op. */
const WARMUP_BOVEN: readonly string[] = [
  '5 min roeien of fietsen, rustig',
  '2×15 band pull-apart + 10 shoulder dislocates',
  'Eerste compound: 2-3 opbouwsets naar je werkgewicht (nooit tot RIR-doel)',
]

/** Warming-up voor onderlichaam. Heupen en knieën eerst, dan opbouwen. */
const WARMUP_ONDER: readonly string[] = [
  '5 min fietsen, rustig',
  '10 leg swings per kant + 2×12 glute bridge + 10 bodyweight squats',
  'Eerste compound: 3 opbouwsets naar je werkgewicht',
]

/**
 * MAANDAG — UPPER A. De zwaarste bovenlichaamssessie van de week.
 *
 * Bench en row als paar op 4 sets in de lage reps: dat is het krachtbehoud-anker.
 * Daarna verticaal duwen/trekken op 3 sets, en pas als laatste de isolatie — in
 * die volgorde omdat het zware werk de verse spier verdient.
 */
export const UPPER_A: KrachtSessie = {
  code: 'upper_a',
  soort: 'kracht',
  dag: 1,
  titel: 'Upper A',
  focus: 'Zware compounds — kracht behouden',
  warmup: WARMUP_BOVEN,
  duurMinuten: 70,
  oefeningen: [
    {
      naam: 'Bench press',
      doel: { sets: 4, repMin: 4, repMax: 6, stap: STAP_BARBELL_BOVEN, rirDoel: RIR_COMPOUND },
      rustSec: RUST_ZWAAR,
      notitie: 'Voeten vast, schouderbladen ingetrokken. Stop de set bij snelheidsverlies.',
    },
    {
      naam: 'Barbell row',
      doel: { sets: 4, repMin: 5, repMax: 7, stap: STAP_BARBELL_BOVEN, rirDoel: RIR_COMPOUND },
      rustSec: RUST_COMPOUND,
      notitie: 'Romp stil; trek naar de onderste ribben, geen zwaai.',
    },
    {
      naam: 'Overhead press',
      doel: { sets: 3, repMin: 6, repMax: 8, stap: STAP_BARBELL_BOVEN, rirDoel: RIR_COMPOUND },
      rustSec: RUST_SECUNDAIR,
      notitie: 'Ribben laag, geen doorgezakte onderrug.',
    },
    {
      naam: 'Lat pulldown',
      doel: { sets: 3, repMin: 6, repMax: 10, stap: STAP_KABEL, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_SECUNDAIR,
      notitie: 'Volledige rek boven, ellebogen naar de heup.',
    },
    {
      naam: 'Incline dumbbell press',
      doel: { sets: 3, repMin: 8, repMax: 12, stap: STAP_DUMBBELL, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_HYPERTROFIE,
      tempo: '2-0-1',
    },
    {
      naam: 'Face pull',
      doel: { sets: 3, repMin: 12, repMax: 20, stap: STAP_KLEIN, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
      notitie: 'Voor je schoudergezondheid — hoge reps, geen ego.',
    },
    {
      naam: 'Triceps rope extension',
      doel: { sets: 2, repMin: 10, repMax: 15, stap: STAP_KABEL, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
    },
    {
      naam: 'EZ-bar curl',
      doel: { sets: 2, repMin: 10, repMax: 15, stap: STAP_KLEIN, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
    },
  ],
}

/**
 * DINSDAG — LOWER A. Zwaar onderlichaam.
 *
 * Squat 4×4-6 als krachtanker, RDL voor de achterkant. De rest is machinewerk:
 * in een tekort wil je het zware vrije werk beperken tot wat écht bijdraagt, en
 * je hamstrings/quads verder belasten zonder je hele systeem te slopen.
 */
export const LOWER_A: KrachtSessie = {
  code: 'lower_a',
  soort: 'kracht',
  dag: 2,
  titel: 'Lower A',
  focus: 'Zwaar onderlichaam — spierbehoud',
  warmup: WARMUP_ONDER,
  duurMinuten: 70,
  oefeningen: [
    {
      naam: 'Back squat',
      doel: { sets: 4, repMin: 4, repMax: 6, stap: STAP_BARBELL_ONDER, rirDoel: RIR_COMPOUND },
      rustSec: RUST_ZWAAR,
      notitie: 'Diepte constant houden — dat is je maatstaf, niet de kilo.',
    },
    {
      naam: 'Romanian deadlift',
      doel: { sets: 3, repMin: 6, repMax: 8, stap: STAP_BARBELL_ONDER, rirDoel: RIR_COMPOUND },
      rustSec: RUST_COMPOUND,
      tempo: '3-0-1',
      notitie: 'Rek in de hamstring leidt, niet de diepte van de stang.',
    },
    {
      naam: 'Leg press',
      doel: { sets: 3, repMin: 8, repMax: 12, stap: STAP_MACHINE, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_SECUNDAIR,
    },
    {
      naam: 'Seated leg curl',
      doel: { sets: 3, repMin: 8, repMax: 12, stap: STAP_KABEL, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_HYPERTROFIE,
    },
    {
      naam: 'Walking lunge',
      doel: { sets: 2, repMin: 10, repMax: 12, stap: STAP_DUMBBELL, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_HYPERTROFIE,
      perKant: true,
      notitie: 'Reps per kant. Rustig neerzetten, geen stuiteren.',
    },
    {
      naam: 'Standing calf raise',
      doel: { sets: 3, repMin: 10, repMax: 15, stap: STAP_MACHINE, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
      tempo: '2-1-1',
      notitie: 'Volledige rek onder, 1 sec knijpen boven.',
    },
    {
      naam: 'Hanging leg raise',
      doel: { sets: 3, repMin: 8, repMax: 15, stap: STAP_KLEIN, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
      notitie: 'Lichaamsgewicht; voeg pas gewicht toe als 15 makkelijk is.',
    },
  ],
}

/**
 * DONDERDAG — UPPER B. Hypertrofie met een krachtbasis.
 *
 * Incline en pull-up openen zwaar (4 sets, 6-10), maar de nadruk verschuift naar
 * de middelste rep-ranges en meer isolatie dan Upper A. Zo krijgt je bovenlichaam
 * twee verschillende prikkels per week zonder dezelfde belasting te herhalen.
 */
export const UPPER_B: KrachtSessie = {
  code: 'upper_b',
  soort: 'kracht',
  dag: 4,
  titel: 'Upper B',
  focus: 'Hypertrofie + krachtbehoud',
  warmup: WARMUP_BOVEN,
  duurMinuten: 75,
  oefeningen: [
    {
      naam: 'Incline barbell press',
      doel: { sets: 4, repMin: 6, repMax: 8, stap: STAP_BARBELL_BOVEN, rirDoel: RIR_COMPOUND },
      rustSec: RUST_COMPOUND,
    },
    {
      naam: 'Pull-up',
      doel: { sets: 4, repMin: 6, repMax: 10, stap: STAP_KLEIN, rirDoel: RIR_COMPOUND },
      rustSec: RUST_COMPOUND,
      notitie: 'Verzwaard zodra 10 lukt; anders lat pulldown met dezelfde reps.',
    },
    {
      naam: 'Seated dumbbell shoulder press',
      doel: { sets: 3, repMin: 8, repMax: 12, stap: STAP_DUMBBELL, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_HYPERTROFIE,
    },
    {
      naam: 'Chest-supported row',
      doel: { sets: 3, repMin: 8, repMax: 12, stap: STAP_MACHINE, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_HYPERTROFIE,
      notitie: 'Borst tegen het kussen; alleen je armen bewegen.',
    },
    {
      naam: 'Cable fly',
      doel: { sets: 3, repMin: 12, repMax: 15, stap: STAP_KABEL, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
      tempo: '2-1-1',
    },
    {
      naam: 'Reverse pec deck',
      doel: { sets: 3, repMin: 12, repMax: 20, stap: STAP_KABEL, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_KORT,
    },
    {
      naam: 'Overhead cable triceps extension',
      doel: { sets: 3, repMin: 10, repMax: 15, stap: STAP_KABEL, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
    },
    {
      naam: 'Incline dumbbell curl',
      doel: { sets: 3, repMin: 10, repMax: 15, stap: STAP_DUMBBELL, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
    },
  ],
}

/**
 * ZATERDAG — LOWER B. Hypertrofie plus een atletische opening.
 *
 * Twee sprongsets vóór het zware werk (in de warming-up): dat houdt explosiviteit
 * vast met bijna geen herstelkosten, en het bereidt je voor op de Hyrox-sessie van
 * zondag. Daarna unilateraal werk — stabiliteit en atletiek waar Lower A puur
 * zwaar was.
 */
export const LOWER_B: KrachtSessie = {
  code: 'lower_b',
  soort: 'kracht',
  dag: 6,
  titel: 'Lower B',
  focus: 'Hypertrofie + atletiek',
  warmup: [
    ...WARMUP_ONDER,
    '2×3 broad jumps — maximale intentie, volledig uitgerust tussen sprongen',
  ],
  duurMinuten: 65,
  oefeningen: [
    {
      naam: 'Hack squat',
      doel: { sets: 3, repMin: 6, repMax: 8, stap: STAP_MACHINE, rirDoel: RIR_COMPOUND },
      rustSec: RUST_COMPOUND,
      notitie: 'Of front squat als je vrij wilt staan — houd de keuze het hele blok gelijk.',
    },
    {
      naam: 'Hip thrust',
      doel: { sets: 3, repMin: 6, repMax: 10, stap: STAP_BARBELL_ONDER, rirDoel: RIR_COMPOUND },
      rustSec: RUST_COMPOUND,
      notitie: 'Kin ingetrokken, 1 sec knijpen bovenaan.',
    },
    {
      naam: 'Bulgarian split squat',
      doel: { sets: 3, repMin: 8, repMax: 10, stap: STAP_DUMBBELL, rirDoel: RIR_HYPERTROFIE },
      rustSec: RUST_HYPERTROFIE,
      perKant: true,
      notitie: 'Reps per kant. Voorste voet plat, romp licht voorover.',
    },
    {
      naam: 'Lying leg curl',
      doel: { sets: 3, repMin: 10, repMax: 15, stap: STAP_KABEL, rirDoel: RIR_ISOLATIE },
      rustSec: 75,
    },
    {
      naam: 'Leg extension',
      doel: { sets: 3, repMin: 12, repMax: 15, stap: STAP_KABEL, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
      tempo: '2-1-1',
    },
    {
      naam: 'Seated calf raise',
      doel: { sets: 3, repMin: 12, repMax: 20, stap: STAP_MACHINE, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_KORT,
    },
    {
      naam: 'Ab wheel rollout',
      doel: { sets: 3, repMin: 8, repMax: 15, stap: STAP_KLEIN, rirDoel: RIR_ISOLATIE },
      rustSec: RUST_ISOLATIE,
      notitie: 'Onderrug neutraal; ga niet verder dan je kunt controleren.',
    },
  ],
}

/** De vier krachtsessies in weekvolgorde. */
export const KRACHT_SESSIES: readonly KrachtSessie[] = [UPPER_A, LOWER_A, UPPER_B, LOWER_B]
