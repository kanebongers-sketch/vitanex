/**
 * Metriek-catalogus voor het gezondheidsoverzicht.
 * Eén plek voor label, eenheid, opmaak, groep en de highlight-zin per metriek —
 * samenvatting, detailweergave en highlights lezen allemaal hieruit.
 *
 * Teksten staan in het woordenboek (lichaam.metriek.*). De velden `label`,
 * `eenheid` en `uitleg` zijn de Nederlandse versie; voor de UI gebruik je
 * metriekLabel/metriekEenheid/metriekUitleg met de taalset van de gebruiker.
 *
 * Toon: leefstijltaal, geen diagnoses en geen verzonnen cijfers.
 */

import type { MetriekSleutel } from '@/lib/gezondheid/types'
import { NL_LICHAAM } from '@/lib/gezondheid/taal'
import type { Taalset } from '@/lib/i18n/taalset'
import type { Params } from '@/lib/i18n/vertaal'

export type MetriekGroep = 'activiteit' | 'slaap' | 'hart' | 'lichaam' | 'ademhaling'

export const GROEP_VOLGORDE: MetriekGroep[] = ['activiteit', 'slaap', 'hart', 'lichaam', 'ademhaling']

export function groepLabel(groep: MetriekGroep, ts: Taalset = NL_LICHAAM): string {
  return ts.t(`lichaam.groep.${groep}`)
}

/** Vanaf welk verschil met je normaal een highlight het noemen waard is. */
export type Drempel =
  | { soort: 'relatief'; waarde: number }
  | { soort: 'absoluut'; waarde: number }

export interface MetriekConfig {
  sleutel: MetriekSleutel
  /** Nederlands label; in de UI metriekLabel(sleutel, ts). */
  label: string
  groep: MetriekGroep
  /** Eenheid achter de waarde (Nederlands); leeg als `formatteer` hem al bevat. */
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
  formatteer: (waarde: number, ts?: Taalset) => string
  /** Null = deze metriek krijgt nooit een highlight. */
  highlight: HighlightRegel | null
  /** Nederlandse uitleg; in de UI metriekUitleg(sleutel, ts). */
  uitleg: string
}

export interface HighlightRegel {
  drempel: Drempel
  /** Verschil als tekst, bv. "34 min" of "1.240 stappen per dag". */
  formatVerschil: (verschil: number, ts?: Taalset) => string
  /** Volledige highlight-zin; `omhoog` = recent hoger dan normaal. */
  beschrijf: (verschilTekst: string, omhoog: boolean, ts?: Taalset) => string
}

/** 'actieve-kcal' → 'actieveKcal' (sleutels in het woordenboek zijn camelCase). */
function woordSleutel(sleutel: MetriekSleutel): string {
  return sleutel.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())
}

function tekst(sleutel: MetriekSleutel, deel: string, ts: Taalset = NL_LICHAAM, params?: Params): string {
  return ts.t(`lichaam.metriek.${woordSleutel(sleutel)}.${deel}`, params)
}

function getal(waarde: number, decimalen = 0, ts: Taalset = NL_LICHAAM): string {
  return waarde.toLocaleString(ts.locale, { minimumFractionDigits: decimalen, maximumFractionDigits: decimalen })
}

/** 444 → "7 u 24 min", 45 → "45 min", 480 → "8 u". */
export function formatDuur(minuten: number, ts: Taalset = NL_LICHAAM): string {
  const totaal = Math.round(minuten)
  if (totaal < 60) return ts.t('lichaam.duur.min', { min: totaal })
  const uur = Math.floor(totaal / 60)
  const min = totaal % 60
  return min === 0 ? ts.t('lichaam.duur.uur', { uur }) : ts.t('lichaam.duur.uurMin', { uur, min })
}

/** Minuten na een ankeruur → "HH:MM". */
function klok(minuten: number, ankerUur: number): string {
  const totaal = (((Math.round(minuten) + ankerUur * 60) % 1440) + 1440) % 1440
  const uu = String(Math.floor(totaal / 60)).padStart(2, '0')
  const mm = String(totaal % 60).padStart(2, '0')
  return `${uu}:${mm}`
}

/** Highlight-regel: de zin komt uit het woordenboek (omhoog/omlaag), het verschil uit `verschil`. */
function regel(
  sleutel: MetriekSleutel, drempel: Drempel, verschil: (waarde: number, ts: Taalset) => string,
): HighlightRegel {
  return {
    drempel,
    formatVerschil: (v, ts = NL_LICHAAM) => verschil(v, ts),
    beschrijf: (t, omhoog, ts = NL_LICHAAM) => tekst(sleutel, omhoog ? 'omhoog' : 'omlaag', ts, { verschil: t }),
  }
}

/** Verschil als "{waarde} …" uit het woordenboek. */
function verschilMet(sleutel: MetriekSleutel, decimalen = 0, deler = 1) {
  return (v: number, ts: Taalset): string => tekst(sleutel, 'verschil', ts, { waarde: getal(v / deler, decimalen, ts) })
}

const duurVerschil = (v: number, ts: Taalset): string => formatDuur(v, ts)

/** Metrieken waarvan `formatteer` de eenheid al bevat (duur, kloktijd). */
const ZONDER_EENHEID: ReadonlySet<MetriekSleutel> = new Set<MetriekSleutel>(['slaap', 'bedtijd', 'wektijd'])

function teksten(sleutel: MetriekSleutel): Pick<MetriekConfig, 'sleutel' | 'label' | 'eenheid' | 'uitleg'> {
  return {
    sleutel,
    label: tekst(sleutel, 'label'),
    eenheid: ZONDER_EENHEID.has(sleutel) ? '' : tekst(sleutel, 'eenheid'),
    uitleg: tekst(sleutel, 'uitleg'),
  }
}

const OPTEL = { cumulatief: true, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2 } as const
const LIJN = { cumulatief: false, grafiek: 'lijn', aggregatie: 'gemiddelde', heeftNormaal: true } as const

export const METRIEKEN: Record<MetriekSleutel, MetriekConfig> = {
  stappen: {
    ...teksten('stappen'), groep: 'activiteit', ...OPTEL,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('stappen', { soort: 'relatief', waarde: 0.1 }, verschilMet('stappen')),
  },
  afstand: {
    ...teksten('afstand'), groep: 'activiteit', ...OPTEL,
    formatteer: (v, ts) => getal(v / 1000, 1, ts),
    highlight: regel('afstand', { soort: 'relatief', waarde: 0.1 }, verschilMet('afstand', 1, 1000)),
  },
  'actieve-kcal': {
    ...teksten('actieve-kcal'), groep: 'activiteit', ...OPTEL,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('actieve-kcal', { soort: 'relatief', waarde: 0.1 }, verschilMet('actieve-kcal')),
  },
  beweegminuten: {
    ...teksten('beweegminuten'), groep: 'activiteit', ...OPTEL,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('beweegminuten', { soort: 'relatief', waarde: 0.15 }, verschilMet('beweegminuten')),
  },
  verdiepingen: {
    ...teksten('verdiepingen'), groep: 'activiteit', ...OPTEL,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('verdiepingen', { soort: 'relatief', waarde: 0.2 }, (v, ts) =>
      tekst('verdiepingen', Math.round(v) === 1 ? 'verschilEen' : 'verschil', ts, { waarde: getal(v, 0, ts) })),
  },
  workouts: {
    ...teksten('workouts'), groep: 'activiteit',
    cumulatief: true, grafiek: 'staaf', aggregatie: 'totaal', heeftNormaal: false, actueelDagen: 7,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: null,
  },
  slaap: {
    ...teksten('slaap'), groep: 'slaap',
    cumulatief: false, grafiek: 'staaf', aggregatie: 'gemiddelde', heeftNormaal: true, actueelDagen: 2,
    formatteer: (v, ts) => formatDuur(v, ts),
    highlight: regel('slaap', { soort: 'absoluut', waarde: 20 }, duurVerschil),
  },
  bedtijd: {
    ...teksten('bedtijd'), groep: 'slaap', ...LIJN, actueelDagen: 2,
    formatteer: (v) => klok(v, 12),
    highlight: regel('bedtijd', { soort: 'absoluut', waarde: 30 }, duurVerschil),
  },
  wektijd: {
    ...teksten('wektijd'), groep: 'slaap', ...LIJN, actueelDagen: 2,
    formatteer: (v) => klok(v, 0),
    highlight: regel('wektijd', { soort: 'absoluut', waarde: 30 }, duurVerschil),
  },
  rusthartslag: {
    ...teksten('rusthartslag'), groep: 'hart', ...LIJN, actueelDagen: 3,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('rusthartslag', { soort: 'absoluut', waarde: 3 }, verschilMet('rusthartslag')),
  },
  hrv: {
    ...teksten('hrv'), groep: 'hart', ...LIJN, actueelDagen: 3,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('hrv', { soort: 'relatief', waarde: 0.1 }, verschilMet('hrv')),
  },
  vo2max: {
    ...teksten('vo2max'), groep: 'hart', ...LIJN, actueelDagen: 30,
    formatteer: (v, ts) => getal(v, 1, ts),
    highlight: regel('vo2max', { soort: 'absoluut', waarde: 1 }, verschilMet('vo2max', 1)),
  },
  gewicht: {
    ...teksten('gewicht'), groep: 'lichaam', ...LIJN, actueelDagen: 30,
    formatteer: (v, ts) => getal(v, 1, ts),
    highlight: regel('gewicht', { soort: 'absoluut', waarde: 0.5 }, verschilMet('gewicht', 1)),
  },
  ademhaling: {
    ...teksten('ademhaling'), groep: 'ademhaling', ...LIJN, actueelDagen: 3,
    formatteer: (v, ts) => getal(v, 1, ts),
    highlight: regel('ademhaling', { soort: 'absoluut', waarde: 1 }, verschilMet('ademhaling', 1)),
  },
  zuurstof: {
    ...teksten('zuurstof'), groep: 'ademhaling', ...LIJN, actueelDagen: 3,
    formatteer: (v, ts) => getal(v, 0, ts),
    highlight: regel('zuurstof', { soort: 'absoluut', waarde: 1 }, verschilMet('zuurstof', 1)),
  },
}

export function metriekLabel(sleutel: MetriekSleutel, ts: Taalset = NL_LICHAAM): string {
  return tekst(sleutel, 'label', ts)
}

export function metriekEenheid(sleutel: MetriekSleutel, ts: Taalset = NL_LICHAAM): string {
  return ZONDER_EENHEID.has(sleutel) ? '' : tekst(sleutel, 'eenheid', ts)
}

export function metriekUitleg(sleutel: MetriekSleutel, ts: Taalset = NL_LICHAAM): string {
  return tekst(sleutel, 'uitleg', ts)
}

/** Waarde plus eenheid, bv. "8.547 stappen" of "7 u 24 min". */
export function formatMetWaarde(sleutel: MetriekSleutel, waarde: number, ts: Taalset = NL_LICHAAM): string {
  const waardeTekst = METRIEKEN[sleutel].formatteer(waarde, ts)
  const eenheid = metriekEenheid(sleutel, ts)
  return eenheid ? `${waardeTekst} ${eenheid}` : waardeTekst
}

/** Metrieken in een groep, in catalogusvolgorde. */
export function metriekenInGroep(groep: MetriekGroep): MetriekSleutel[] {
  return (Object.keys(METRIEKEN) as MetriekSleutel[]).filter((s) => METRIEKEN[s].groep === groep)
}
