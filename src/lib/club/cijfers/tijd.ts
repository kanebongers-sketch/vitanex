// ─── Fit Factory Club: tijd in Nederland (PUUR) ─────────────────────────────
// Alle cijfers rekenen in Europe/Amsterdam: een bezoek om 00:30 's nachts hoort
// bij de nieuwe dag, ook als de server in UTC draait. Dagen zijn sleutels
// "YYYY-MM-DD"; weken beginnen op maandag (ISO).

import type { Taal } from '@/lib/aiyourgym/taal/taal'

const ZONE = 'Europe/Amsterdam'
const DAG_MS = 86_400_000

const DELEN = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export interface NlMoment {
  dag: string
  /** 1 = maandag ... 7 = zondag */
  weekdag: number
  uur: number
  minuut: number
}

/** Waar en wanneer een moment in Nederland valt. */
export function nlMoment(d: Date): NlMoment {
  const p: Record<string, string> = {}
  for (const deel of DELEN.formatToParts(d)) p[deel.type] = deel.value
  const dag = `${p.year}-${p.month}-${p.day}`
  return { dag, weekdag: weekdagVan(dag), uur: Number(p.hour) % 24, minuut: Number(p.minute) }
}

export function dagSleutel(d: Date): string {
  return nlMoment(d).dag
}

function utcVan(dag: string): number {
  const [j, m, d] = dag.split('-').map(Number)
  return Date.UTC(j, m - 1, d)
}

function sleutelVanUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** 1 = maandag ... 7 = zondag, voor een dagsleutel. */
export function weekdagVan(dag: string): number {
  const w = new Date(utcVan(dag)).getUTCDay()
  return w === 0 ? 7 : w
}

export function plusDagen(dag: string, n: number): string {
  return sleutelVanUtc(utcVan(dag) + n * DAG_MS)
}

/** De maandag van de week waarin deze dag valt. */
export function maandagVan(dag: string): string {
  return plusDagen(dag, 1 - weekdagVan(dag))
}

/** Aantal hele dagen van a naar b (b later = positief). */
export function dagenTussen(a: string, b: string): number {
  return Math.round((utcVan(b) - utcVan(a)) / DAG_MS)
}

/** Het moment waarop deze dag in Nederland begint (00:00 lokale tijd). */
export function dagStart(dag: string): Date {
  const gok = utcVan(dag)
  const m = nlMoment(new Date(gok))
  // Om 00:00 UTC is het in Nederland 01:00 of 02:00 op dezelfde dag.
  return new Date(gok - (m.uur * 60 + m.minuut) * 60_000)
}

/** Leeftijd in hele jaren op een dag, of null bij een onbruikbare datum. */
export function leeftijdOp(geboortedatum: string | null, dag: string): number | null {
  if (!geboortedatum || !/^\d{4}-\d{2}-\d{2}/.test(geboortedatum)) return null
  const [gj, gm, gd] = geboortedatum.slice(0, 10).split('-').map(Number)
  const [j, m, d] = dag.split('-').map(Number)
  let jaren = j - gj
  if (m < gm || (m === gm && d < gd)) jaren -= 1
  return jaren >= 0 && jaren < 120 ? jaren : null
}

/** Is het vandaag iemands verjaardag? 29 februari viert in gewone jaren op 28 februari. */
export function jarigOp(geboortedatum: string | null, dag: string): boolean {
  if (!geboortedatum || geboortedatum.length < 10) return false
  const md = geboortedatum.slice(5, 10)
  const vandaag = dag.slice(5, 10)
  if (md === vandaag) return true
  const jaar = Number(dag.slice(0, 4))
  const schrikkel = (jaar % 4 === 0 && jaar % 100 !== 0) || jaar % 400 === 0
  return md === '02-29' && !schrikkel && vandaag === '02-28'
}

export const WEEKDAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const

// Namen van dagen en maanden per taal (Engels: Brits, met hoofdletter).
const NAMEN: Record<Taal, { weekdag: readonly string[]; maand: readonly string[]; maandKort: readonly string[] }> = {
  nl: {
    weekdag: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'],
    maand: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
    maandKort: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
  },
  en: {
    weekdag: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    maand: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    maandKort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
}

export function weekdagNaam(weekdag: number, taal: Taal = 'nl'): string {
  return NAMEN[taal].weekdag[(weekdag - 1 + 7) % 7]
}

/** "dinsdag 14 oktober" | "Tuesday 14 October" */
export function dagLang(dag: string, taal: Taal = 'nl'): string {
  const [, m, d] = dag.split('-').map(Number)
  return `${weekdagNaam(weekdagVan(dag), taal)} ${d} ${NAMEN[taal].maand[m - 1]}`
}

/** "14 okt" | "14 Oct" */
export function dagKort(dag: string, taal: Taal = 'nl'): string {
  const [, m, d] = dag.split('-').map(Number)
  return `${d} ${NAMEN[taal].maandKort[m - 1]}`
}

/** "19:30" in Nederlandse tijd. */
export function tijdNl(d: Date): string {
  const m = nlMoment(d)
  return `${String(m.uur).padStart(2, '0')}:${String(m.minuut).padStart(2, '0')}`
}
