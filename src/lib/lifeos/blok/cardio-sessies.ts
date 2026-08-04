// ─── LifeOS — cardio + rustdag van het 4-weken blok ─────────────────────────
// Twee cardiosessies per week, met een expres heel verschillend doel:
//
// WOENSDAG — ZONE 2 is de saaie sessie, en dat is het punt. Hij zit tussen twee
// zware krachtdagen en moet je conditie opbouwen ZONDER herstel te kosten. Daarom
// een hartslag- en RPE-plafond in plaats van een minimum: te hard gaan maakt hem
// niet beter maar slechter, want dan vreet hij van je squat op zaterdag.
//
// ZONDAG — HYROX is de enige sessie waar het mag branden. Werkcapaciteit en
// atletisch vermogen, in een format dat je conditie test zonder de dag erna te
// verpesten (maandag is Upper A). Vandaar RPE 7-8 en niet 10: dit is training, geen
// wedstrijd. Het aantal rondes loopt per week op — zie `week-modulatie.ts`.
//
// VRIJDAG — RUST is een echte rustdag: geen "actieve herstel"-sessie die stiekem
// training is. Alleen stappen, en desgewenst tien minuten mobiliteit.

import type { CardioSessie, RustDag, WeekProfiel } from './types'

/**
 * WOENSDAG — Zone 2.
 *
 * "Conversational pace": je kunt praten in hele zinnen. Kun je dat niet meer, dan
 * ga je te hard — ook al voelt het goed. De hartslagzone (60-70% van je max) is de
 * harde bovengrens; RPE 3-4 is de check als je geen hartslagmeter draagt.
 */
export const ZONE2: CardioSessie = {
  code: 'zone2',
  soort: 'cardio',
  dag: 3,
  titel: 'Zone 2 cardio',
  focus: 'Conditie opbouwen zonder herstel te kosten',
  duurBereik: [35, 45],
  rpeDoel: [3, 4],
  hartslagZone: [60, 70],
  toelichting: [
    'Kies wat je volhoudt: fietsen, wandelen op helling, roeien of crosstrainer.',
    'Praattempo. Kun je geen hele zin meer zeggen, ga dan langzamer.',
    'Dit is geen intervalsessie. Constant tempo, geen sprintjes.',
    'Voelt het te makkelijk? Goed. Zo hoort zone 2 te voelen.',
  ],
}

/**
 * ZONDAG — Hyrox-conditioning.
 *
 * Eén compacte ronde bevat alle acht bewegingspatronen uit een Hyrox-race, maar op
 * ~40% van de race-afstanden. Zo krijg je de volledige prikkel (duwen, trekken,
 * dragen, lopen, roeien, springen) in 12-15 minuten per ronde — herhaalbaar naast
 * vier krachtsessies.
 *
 * Elk station heeft een `substituut` waar de sled of sandbag kan ontbreken: een
 * sessie die je niet kunt uitvoeren omdat de gym geen slee heeft, is geen sessie.
 * De belastingen zijn RICHTLIJNEN (geen verzonnen exacte kilo's): begin week 1
 * conservatief en houd het daarna gelijk, zodat je tijden vergelijkbaar zijn.
 */
export const HYROX: CardioSessie = {
  code: 'hyrox',
  soort: 'cardio',
  dag: 0,
  titel: 'Hyrox conditioning',
  focus: 'Werkcapaciteit en atletisch vermogen',
  duurBereik: [30, 50],
  rpeDoel: [7, 8],
  rondes: 2,
  stations: [
    { naam: 'Run', meet: 'afstand', doelWaarde: 600, eenheid: 'm', substituut: '3 min crosstrainer' },
    { naam: 'SkiErg', meet: 'calorieen', doelWaarde: 20, eenheid: 'cal', substituut: '250 m roeien' },
    {
      naam: 'Sled push',
      meet: 'afstand',
      doelWaarde: 20,
      eenheid: 'm',
      belasting: 'zwaar maar continu lopend',
      substituut: '15 reps leg press',
    },
    {
      naam: 'Sled pull',
      meet: 'afstand',
      doelWaarde: 20,
      eenheid: 'm',
      belasting: 'iets lichter dan de push',
      substituut: '15 reps seated row zwaar',
    },
    { naam: 'Burpee broad jumps', meet: 'reps', doelWaarde: 10, eenheid: 'reps' },
    { naam: 'Row', meet: 'afstand', doelWaarde: 400, eenheid: 'm' },
    {
      naam: 'Farmers carry',
      meet: 'afstand',
      doelWaarde: 80,
      eenheid: 'm',
      belasting: '2×24 kg of wat je 80 m kunt dragen zonder neerzetten',
    },
    {
      naam: 'Sandbag lunges',
      meet: 'reps',
      doelWaarde: 15,
      eenheid: 'reps',
      belasting: '20 kg zak of dumbbells',
      substituut: '15 walking lunges met dumbbells',
    },
  ],
  toelichting: [
    'Doorlopend werken; rust alleen tussen de rondes (2-3 minuten).',
    'Doel is een gelijkmatig tempo — niet ronde 1 stukrennen.',
    'RPE 7-8: zwaar, maar je kunt morgen weer benen trainen.',
    'Log per station je tijd of aantal, dan zie je over de weken je progressie.',
  ],
}

/**
 * VRIJDAG — volledige rustdag.
 *
 * Bewust geen geplande training. In een tekort is de rustdag het moment waarop je
 * de vier krachtsessies daadwerkelijk verwerkt; hem opvullen met "een rondje
 * cardio" maakt het blok niet beter, alleen langzamer herstellend.
 */
export const RUSTDAG: RustDag = {
  code: 'rust',
  soort: 'rust',
  dag: 5,
  titel: 'Rustdag',
  focus: 'Herstellen — dit is waar je sterker wordt',
  toelichting: [
    'Geen geplande training. Wel je 8.000-12.000 stappen.',
    'Optioneel: 10 minuten mobiliteit voor heupen en schouders.',
    'Trek de rustdag naar voren als je jezelf uitgeblust voelt — je mist niets.',
  ],
}

/**
 * De vier weken.
 *
 * `rirOffset` telt bij het RIR-doel op: hoger = verder van falen. Week 1 en 4 staan
 * daarom op +1 — in week 1 omdat je je gewichten nog zoekt (en een mislukte set
 * niets oplevert), in week 4 omdat je het blok wilt afsluiten met behouden kracht,
 * niet met een lege tank. Week 2 en 3 zijn de weken waarin je écht duwt.
 *
 * `isolatieSetsDelta` haalt in week 4 één set van elke ISOLATIE-oefening af. De
 * compounds blijven staan: die houden je kracht vast — het volume dat je in een
 * consolidatieweek kunt missen, zit in het isolatiewerk.
 */
export const WEEK_PROFIELEN: readonly WeekProfiel[] = [
  {
    week: 1,
    naam: 'Baseline',
    doel: 'Werkgewichten vinden en techniek vastzetten',
    rirOffset: 1,
    isolatieSetsDelta: 0,
    advies:
      'Kies gewichten waarbij je de bovenkant van de rep-range haalt met 1 rep over. Deze week is je nulmeting — niet je piek.',
  },
  {
    week: 2,
    naam: 'Progressie',
    doel: 'Reps of gewicht verbeteren t.o.v. week 1',
    rirOffset: 0,
    isolatieSetsDelta: 0,
    advies:
      'Nu duwen: elke oefening wil één rep of één stap meer dan vorige week. Haal je alle sets op de bovengrens, dan gaat het gewicht omhoog.',
  },
  {
    week: 3,
    naam: 'Piek',
    doel: 'Hoogste belasting van het blok — herstel bewaken',
    rirOffset: 0,
    isolatieSetsDelta: 0,
    advies:
      'De zwaarste week. Houd je slaap en eiwit strak; zakt je prestatie twee sessies op rij, neem dan een set minder in plaats van door te bijten.',
  },
  {
    week: 4,
    naam: 'Consolidatie',
    doel: 'Kracht behouden, vermoeidheid afbouwen',
    rirOffset: 1,
    isolatieSetsDelta: -1,
    advies:
      'Zelfde gewichten, één set minder isolatie en één rep verder van falen. Je forceert geen PR — je legt vast wat je hebt opgebouwd.',
  },
]

/** De Hyrox-rondes per week: opbouwen, dan in week 4 kwaliteit boven kwantiteit. */
export const HYROX_RONDES_PER_WEEK: Readonly<Record<1 | 2 | 3 | 4, number>> = {
  1: 2,
  2: 2,
  3: 3,
  4: 2,
}
