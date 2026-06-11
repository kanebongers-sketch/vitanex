/**
 * Metriek-configuratie voor de gezondheidspagina.
 * Eén plek voor kleuren, labels, formattering en uitleg per metriek —
 * tegels, hoogtepunten en detailweergaven lezen allemaal hieruit.
 */

export interface TrendPunt {
  datum: string
  stappen?: number
  slaap?: number
  hartslag?: number
  welzijn?: number
  stemming?: string
  calorieen?: number
}

export type MetricKey = 'stappen' | 'slaap' | 'hartslag' | 'welzijn' | 'stemming' | 'calorieen'

export interface StemmingInfo {
  score: number
  emoji: string
  label: string
}

export const STEMMING_INFO: Record<string, StemmingInfo> = {
  moe:      { score: 1, emoji: '😴', label: 'Moe' },
  gestrest: { score: 2, emoji: '😰', label: 'Gestrest' },
  ok:       { score: 3, emoji: '😐', label: 'Oké' },
  blij:     { score: 4, emoji: '😊', label: 'Blij' },
  energiek: { score: 5, emoji: '⚡', label: 'Energiek' },
}

export interface MetricConfig {
  key: MetricKey
  label: string
  emoji: string
  kleur: string
  kleurLicht: string
  eenheid: string
  /** True als formatWaarde de eenheid al bevat (zoals "7u 24m") */
  eenheidInWaarde?: boolean
  grafiek: 'staaf' | 'lijn'
  /** Y-as domein voor de detailgrafiek, undefined = automatisch */
  domein?: [number, number]
  uitleg: string
  formatWaarde: (v: number) => string
}

const formatGeheel = (v: number) => Math.round(v).toLocaleString('nl-BE')
const formatUren = (v: number) => {
  const heel = Math.floor(v)
  const minuten = Math.round((v - heel) * 60)
  return minuten > 0 ? `${heel}u ${minuten}m` : `${heel}u`
}

export const METRICS: Record<MetricKey, MetricConfig> = {
  stappen: {
    key: 'stappen', label: 'Stappen', emoji: '👟',
    kleur: '#1D9E75', kleurLicht: '#E1F5EE',
    eenheid: 'stappen', grafiek: 'staaf',
    uitleg: 'Dagelijkse stappen zijn een betrouwbare graadmeter voor je algehele beweging. Vanaf zo’n 7.000 stappen per dag zien onderzoekers duidelijke gezondheidsvoordelen — meer energie, betere slaap en minder stress.',
    formatWaarde: formatGeheel,
  },
  slaap: {
    key: 'slaap', label: 'Slaap', emoji: '🌙',
    kleur: '#8B5CF6', kleurLicht: '#EDE9FE',
    eenheid: 'uur', eenheidInWaarde: true, grafiek: 'staaf', domein: [0, 10],
    uitleg: 'Slaap is de basis van herstel. Volwassenen functioneren het best met 7 tot 9 uur per nacht. Structureel minder dan 6 uur verhoogt het risico op stressklachten en verminderde concentratie.',
    formatWaarde: formatUren,
  },
  hartslag: {
    key: 'hartslag', label: 'Hartslag', emoji: '❤️',
    kleur: '#E24B4A', kleurLicht: '#FCEBEB',
    eenheid: 'bpm', grafiek: 'lijn', domein: [40, 110],
    uitleg: 'Je gemiddelde hartslag in rust zegt veel over je conditie en stressniveau. Een dalende rustpols over weken is meestal een teken van betere fitheid; een stijgende lijn kan op overbelasting wijzen.',
    formatWaarde: formatGeheel,
  },
  welzijn: {
    key: 'welzijn', label: 'Welzijn', emoji: '🍀',
    kleur: '#BA7517', kleurLicht: '#FAEEDA',
    eenheid: '/100', grafiek: 'lijn', domein: [0, 100],
    uitleg: 'Je welzijnsscore komt uit je wekelijkse check-ins: energie, stress, slaapkwaliteit en motivatie samen in één getal. Het gaat niet om één meting, maar om de trend over weken.',
    formatWaarde: formatGeheel,
  },
  stemming: {
    key: 'stemming', label: 'Stemming', emoji: '😊',
    kleur: '#185FA5', kleurLicht: '#E6F1FB',
    eenheid: '', grafiek: 'lijn', domein: [0.5, 5.5],
    uitleg: 'Je dagelijkse stemming-logs maken patronen zichtbaar: welke dagen voelen zwaar, en wat ging eraan vooraf? Samen met je slaap- en beweegdata ontdek je wat jou energie geeft of kost.',
    formatWaarde: formatGeheel,
  },
  calorieen: {
    key: 'calorieen', label: 'Verbranding', emoji: '🔥',
    kleur: '#E8590C', kleurLicht: '#FDEEE3',
    eenheid: 'kcal', grafiek: 'staaf',
    uitleg: 'Je actieve verbranding laat zien hoeveel energie je per dag verbruikt door te bewegen. Meer is niet altijd beter — consistentie over de week telt zwaarder dan één topdag.',
    formatWaarde: formatGeheel,
  },
}

export const METRIC_VOLGORDE: MetricKey[] = ['stappen', 'slaap', 'hartslag', 'welzijn', 'stemming', 'calorieen']

/** Numerieke waarde van een trendpunt voor een metriek (stemming → score 1-5). */
export function metricWaarde(punt: TrendPunt, key: MetricKey): number | undefined {
  if (key === 'stemming') {
    return punt.stemming ? STEMMING_INFO[punt.stemming]?.score : undefined
  }
  return punt[key]
}

export function dagKort(datum: string): string {
  const d = new Date(datum + 'T12:00:00')
  return d.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric' }).replace('.', '')
}

export function datumLang(datum: string): string {
  const d = new Date(datum + 'T12:00:00')
  const vandaag = new Date().toISOString().split('T')[0]
  const gisteren = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (datum === vandaag) return 'Vandaag'
  if (datum === gisteren) return 'Gisteren'
  return d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export interface MetricSamenvatting {
  laatste: number
  laatsteDatum: string
  spark: (number | null)[]
}

/** Laatste waarde + sparkline-reeks (14 dagen) per metriek. */
export function vatMetricSamen(trend: TrendPunt[], key: MetricKey): MetricSamenvatting | null {
  let laatste: number | undefined
  let laatsteDatum = ''
  for (let i = trend.length - 1; i >= 0; i--) {
    const w = metricWaarde(trend[i], key)
    if (w !== undefined) { laatste = w; laatsteDatum = trend[i].datum; break }
  }
  if (laatste === undefined) return null

  const spark = trend.slice(-14).map(p => metricWaarde(p, key) ?? null)
  return { laatste, laatsteDatum, spark }
}

export interface Vergelijking {
  titel: string
  tekst: string
  key: MetricKey
  recent: { label: string; waarde: number }
  vorig: { label: string; waarde: number }
}

function gemiddelde(waarden: number[]): number | null {
  if (waarden.length === 0) return null
  return waarden.reduce((a, b) => a + b, 0) / waarden.length
}

/**
 * Hoogtepunten: vergelijkt de afgelopen 7 dagen met de 7 dagen ervoor
 * voor stappen en slaap (minimaal 3 metingen per periode).
 */
export function berekenVergelijkingen(trend: TrendPunt[]): Vergelijking[] {
  const resultaat: Vergelijking[] = []
  const recent = trend.slice(-7)
  const vorig = trend.slice(-14, -7)

  const paren: { key: MetricKey; titel: string; stijgGoed: boolean }[] = [
    { key: 'stappen', titel: 'Stappen deze week', stijgGoed: true },
    { key: 'slaap',   titel: 'Slaap deze week',   stijgGoed: true },
  ]

  for (const { key, titel, stijgGoed } of paren) {
    const cfg = METRICS[key]
    const recentW = recent.map(p => metricWaarde(p, key)).filter((v): v is number => v !== undefined)
    const vorigW = vorig.map(p => metricWaarde(p, key)).filter((v): v is number => v !== undefined)
    const gemRecent = gemiddelde(recentW)
    const gemVorig = gemiddelde(vorigW)
    if (gemRecent === null || gemVorig === null || recentW.length < 3 || vorigW.length < 3 || gemVorig === 0) continue

    const verschilPct = Math.round(((gemRecent - gemVorig) / gemVorig) * 100)
    if (Math.abs(verschilPct) < 3) continue

    const beterOfMinder = (verschilPct > 0) === stijgGoed ? 'Lekker bezig!' : 'Iets om op te letten.'
    const eenheidTekst = cfg.eenheidInWaarde ? '' : ` ${cfg.eenheid}`
    resultaat.push({
      titel, key,
      tekst: `Gemiddeld ${cfg.formatWaarde(gemRecent)}${eenheidTekst} per dag — ${Math.abs(verschilPct)}% ${verschilPct > 0 ? 'meer' : 'minder'} dan vorige week. ${beterOfMinder}`,
      recent: { label: 'Deze week', waarde: gemRecent },
      vorig:  { label: 'Vorige week', waarde: gemVorig },
    })
  }

  return resultaat
}
