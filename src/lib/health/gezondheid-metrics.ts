/**
 * Metriek-catalogus voor het gezondheidsoverzicht.
 * Eén plek voor label, eenheid, opmaak, groep en de highlight-zin per metriek —
 * samenvatting, detailweergave en highlights lezen allemaal hieruit.
 *
 * Toon: leefstijltaal, geen diagnoses en geen verzonnen cijfers.
 */

import type { MetriekSleutel } from '@/lib/gezondheid/types'

export type MetriekGroep = 'activiteit' | 'slaap' | 'hart' | 'lichaam' | 'ademhaling'

export const GROEP_LABELS: Record<MetriekGroep, string> = {
  activiteit: 'Activiteit',
  slaap: 'Slaap',
  hart: 'Hart',
  lichaam: 'Lichaam',
  ademhaling: 'Ademhaling',
}

export const GROEP_VOLGORDE: MetriekGroep[] = ['activiteit', 'slaap', 'hart', 'lichaam', 'ademhaling']

/** Vanaf welk verschil met je normaal een highlight het noemen waard is. */
export type Drempel =
  | { soort: 'relatief'; waarde: number }
  | { soort: 'absoluut'; waarde: number }

export interface MetriekConfig {
  sleutel: MetriekSleutel
  label: string
  groep: MetriekGroep
  /** Eenheid achter de waarde; leeg als `formatteer` hem al bevat. */
  eenheid: string
  /** True als de dag pas af is als hij voorbij is (stappen, kcal …): vandaag telt dan niet mee in gemiddelden. */
  cumulatief: boolean
  grafiek: 'staaf' | 'lijn'
  /** Hoe weken/maanden een dagwaarde samenvatten: gemiddelde per dag, of opgeteld (trainingstijd). */
  aggregatie: 'gemiddelde' | 'totaal'
  /** False voor metrieken waar een mediaan niets zegt (trainingen: geen meting ≠ 0). */
  heeftNormaal: boolean
  /** Hoeveel dagen een laatste meting nog als actueel geldt. */
  actueelDagen: number
  formatteer: (waarde: number) => string
  /** Null = deze metriek krijgt nooit een highlight. */
  highlight: HighlightRegel | null
  uitleg: string
}

export interface HighlightRegel {
  drempel: Drempel
  /** Verschil als tekst, bv. "34 min" of "1.240 stappen per dag". */
  formatVerschil: (verschil: number) => string
  /** Volledige highlight-zin; `omhoog` = recent hoger dan normaal. */
  beschrijf: (verschilTekst: string, omhoog: boolean) => string
}

const LOCALE = 'nl-NL'

function getal(waarde: number, decimalen = 0): string {
  return waarde.toLocaleString(LOCALE, { minimumFractionDigits: decimalen, maximumFractionDigits: decimalen })
}

/** 444 → "7 u 24 min", 45 → "45 min", 480 → "8 u". */
export function formatDuur(minuten: number): string {
  const totaal = Math.round(minuten)
  if (totaal < 60) return `${totaal} min`
  const uren = Math.floor(totaal / 60)
  const rest = totaal % 60
  return rest === 0 ? `${uren} u` : `${uren} u ${rest} min`
}

/** Minuten na een ankeruur → "HH:MM". */
function klok(minuten: number, ankerUur: number): string {
  const totaal = (((Math.round(minuten) + ankerUur * 60) % 1440) + 1440) % 1440
  const uu = String(Math.floor(totaal / 60)).padStart(2, '0')
  const mm = String(totaal % 60).padStart(2, '0')
  return `${uu}:${mm}`
}

const meerMinder = (omhoog: boolean) => (omhoog ? 'meer' : 'minder')
const hogerLager = (omhoog: boolean) => (omhoog ? 'hoger' : 'lager')
const laterEerder = (omhoog: boolean) => (omhoog ? 'later' : 'eerder')

const WEEK = 'de afgelopen 7 dagen'
const NACHTEN = 'de afgelopen 7 nachten'

export const METRIEKEN: Record<MetriekSleutel, MetriekConfig> = {
  stappen: {
    sleutel: 'stappen', label: 'Stappen', groep: 'activiteit', eenheid: 'stappen',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'relatief', waarde: 0.1 },
      formatVerschil: (v) => `${getal(v)} stappen per dag`,
      beschrijf: (t, op) => `Je zette ${WEEK} gemiddeld ${t} ${meerMinder(op)} dan je normaal.`,
    },
    uitleg: 'Alle stappen die je telefoon of horloge op een dag telt. Een handige graadmeter voor hoeveel je op een gewone dag beweegt.',
  },
  afstand: {
    sleutel: 'afstand', label: 'Afstand', groep: 'activiteit', eenheid: 'km',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => getal(v / 1000, 1),
    highlight: {
      drempel: { soort: 'relatief', waarde: 0.1 },
      formatVerschil: (v) => `${getal(v / 1000, 1)} km per dag`,
      beschrijf: (t, op) => `Je legde ${WEEK} gemiddeld ${t} ${meerMinder(op)} af dan je normaal.`,
    },
    uitleg: 'De afstand die je lopend en hardlopend aflegt, zoals je bron die meet. Fietsen telt alleen mee als je bron dat doorgeeft.',
  },
  'actieve-kcal': {
    sleutel: 'actieve-kcal', label: 'Actieve energie', groep: 'activiteit', eenheid: 'kcal',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'relatief', waarde: 0.1 },
      formatVerschil: (v) => `${getal(v)} kcal per dag`,
      beschrijf: (t, op) => `Je verbruikte ${WEEK} gemiddeld ${t} ${meerMinder(op)} door te bewegen dan je normaal.`,
    },
    uitleg: 'De energie die je verbruikt door te bewegen, bovenop wat je lichaam in rust al verbruikt. Het is een schatting van je apparaat, geen exacte meting.',
  },
  beweegminuten: {
    sleutel: 'beweegminuten', label: 'Beweegminuten', groep: 'activiteit', eenheid: 'min',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'relatief', waarde: 0.15 },
      formatVerschil: (v) => `${getal(v)} min per dag`,
      beschrijf: (t, op) => `Je bewoog ${WEEK} gemiddeld ${t} ${meerMinder(op)} dan je normaal.`,
    },
    uitleg: 'Minuten waarin je minstens stevig wandelt, zoals je bron ze telt. Elke bron hanteert een eigen grens voor wat als beweging telt.',
  },
  verdiepingen: {
    sleutel: 'verdiepingen', label: 'Verdiepingen', groep: 'activiteit', eenheid: 'verdiepingen',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'relatief', waarde: 0.2 },
      formatVerschil: (v) => `${getal(v)} ${Math.round(v) === 1 ? 'verdieping' : 'verdiepingen'} per dag`,
      beschrijf: (t, op) => `Je klom ${WEEK} gemiddeld ${t} ${meerMinder(op)} dan je normaal.`,
    },
    uitleg: 'Het aantal verdiepingen (ongeveer drie meter hoogte) dat je te voet omhoog gaat, gemeten met de hoogtemeter van je apparaat.',
  },
  workouts: {
    sleutel: 'workouts', label: 'Trainingen', groep: 'activiteit', eenheid: 'min',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'totaal', heeftNormaal: false, actueelDagen: 7,
    formatteer: (v) => getal(v),
    highlight: null,
    uitleg: 'Trainingen die je in je horloge of sport-app hebt gestart. We tonen de totale trainingstijd per dag; dagen zonder training blijven leeg.',
  },
  slaap: {
    sleutel: 'slaap', label: 'Slaap', groep: 'slaap', eenheid: '',
    cumulatief: false, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: formatDuur,
    highlight: {
      drempel: { soort: 'absoluut', waarde: 20 },
      formatVerschil: formatDuur,
      beschrijf: (t, op) => `Je sliep ${NACHTEN} gemiddeld ${t} ${meerMinder(op)} dan je normaal.`,
    },
    uitleg: 'Je totale slaaptijd per nacht, zonder de momenten dat je wakker lag. Een nacht hoort bij de dag waarop je wakker wordt.',
  },
  bedtijd: {
    sleutel: 'bedtijd', label: 'Bedtijd', groep: 'slaap', eenheid: '',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => klok(v, 12),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 30 },
      formatVerschil: formatDuur,
      beschrijf: (t, op) => `Je viel ${NACHTEN} gemiddeld ${t} ${laterEerder(op)} in slaap dan je normaal.`,
    },
    uitleg: 'Het moment waarop je slaap begon. Een vast ritme helpt veel mensen om makkelijker in slaap te vallen.',
  },
  wektijd: {
    sleutel: 'wektijd', label: 'Wektijd', groep: 'slaap', eenheid: '',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v) => klok(v, 0),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 30 },
      formatVerschil: formatDuur,
      beschrijf: (t, op) => `Je werd ${NACHTEN} gemiddeld ${t} ${laterEerder(op)} wakker dan je normaal.`,
    },
    uitleg: 'Het moment waarop je slaap eindigde.',
  },
  rusthartslag: {
    sleutel: 'rusthartslag', label: 'Rusthartslag', groep: 'hart', eenheid: 'slagen/min',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 3,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 3 },
      formatVerschil: (v) => `${getal(v)} slagen per minuut`,
      beschrijf: (t, op) => `Je rusthartslag lag ${WEEK} gemiddeld ${t} ${hogerLager(op)} dan je normaal.`,
    },
    uitleg: 'Je hartslag als je een tijd stil zit of slaapt. Hij schommelt met slaap, stress, ziekte, alcohol en training; de trend over weken zegt meer dan één dag.',
  },
  hrv: {
    sleutel: 'hrv', label: 'Hartslagvariabiliteit', groep: 'hart', eenheid: 'ms',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 3,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'relatief', waarde: 0.1 },
      formatVerschil: (v) => `${getal(v)} ms`,
      beschrijf: (t, op) => `Je hartslagvariabiliteit lag ${WEEK} gemiddeld ${t} ${hogerLager(op)} dan je normaal.`,
    },
    uitleg: 'De variatie in tijd tussen je hartslagen (HRV). Hij verschilt sterk per persoon, dus vergelijk vooral met je eigen normaal, niet met die van een ander.',
  },
  vo2max: {
    sleutel: 'vo2max', label: 'VO2max', groep: 'hart', eenheid: 'ml/kg/min',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 30,
    formatteer: (v) => getal(v, 1),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 1 },
      formatVerschil: (v) => `${getal(v, 1)} ml/kg/min`,
      beschrijf: (t, op) => `Je VO2max lag ${WEEK} gemiddeld ${t} ${hogerLager(op)} dan je normaal.`,
    },
    uitleg: 'Een schatting van je uithoudingsvermogen door je horloge, meestal na een stevige wandeling of loop buiten. Hij verandert langzaam, over weken tot maanden.',
  },
  gewicht: {
    sleutel: 'gewicht', label: 'Gewicht', groep: 'lichaam', eenheid: 'kg',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 30,
    formatteer: (v) => getal(v, 1),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 0.5 },
      formatVerschil: (v) => `${getal(v, 1)} kg`,
      beschrijf: (t, op) => `Je gewicht lag ${WEEK} gemiddeld ${t} ${hogerLager(op)} dan je normaal.`,
    },
    uitleg: 'Je gewicht uit je weegschaal-app of eigen invoer. Het schommelt van dag tot dag door vocht en eten; kijk naar de lijn over weken.',
  },
  ademhaling: {
    sleutel: 'ademhaling', label: 'Ademfrequentie', groep: 'ademhaling', eenheid: 'per min',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 3,
    formatteer: (v) => getal(v, 1),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 1 },
      formatVerschil: (v) => `${getal(v, 1)} ademhalingen per minuut`,
      beschrijf: (t, op) => `Je ademfrequentie lag ${WEEK} gemiddeld ${t} ${hogerLager(op)} dan je normaal.`,
    },
    uitleg: 'Het aantal ademhalingen per minuut, meestal gemeten tijdens je slaap.',
  },
  zuurstof: {
    sleutel: 'zuurstof', label: 'Zuurstof in bloed', groep: 'ademhaling', eenheid: '%',
    cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 3,
    formatteer: (v) => getal(v),
    highlight: {
      drempel: { soort: 'absoluut', waarde: 1 },
      formatVerschil: (v) => `${getal(v, 1)} procentpunt`,
      beschrijf: (t, op) => `Je zuurstofwaarde lag ${WEEK} gemiddeld ${t} ${hogerLager(op)} dan je normaal.`,
    },
    uitleg: 'Het zuurstofgehalte in je bloed zoals je horloge het schat. Dit is geen medische meting; heb je klachten, overleg dan met je huisarts.',
  },
}

/** Waarde plus eenheid, bv. "8.547 stappen" of "7 u 24 min". */
export function formatMetWaarde(sleutel: MetriekSleutel, waarde: number): string {
  const cfg = METRIEKEN[sleutel]
  const tekst = cfg.formatteer(waarde)
  return cfg.eenheid ? `${tekst} ${cfg.eenheid}` : tekst
}

/** Metrieken in een groep, in catalogusvolgorde. */
export function metriekenInGroep(groep: MetriekGroep): MetriekSleutel[] {
  return (Object.keys(METRIEKEN) as MetriekSleutel[]).filter((s) => METRIEKEN[s].groep === groep)
}
