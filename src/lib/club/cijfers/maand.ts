// ─── Fit Factory Club: kalendermaanden (PUUR) ───────────────────────────────
// Fit Factory rapporteert per kalendermaand: van de 1e 00:00 tot en met de
// laatste dag 23:59, in Nederlandse tijd. Een maand is een sleutel "YYYY-MM";
// een venster is een reeks hele dagen "YYYY-MM-DD" met begin en eind inbegrepen.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { dagenTussen, dagStart, plusDagen } from './tijd'

export type Maand = string

const MAAND_PATROON = /^(\d{4})-(0[1-9]|1[0-2])$/
const MAAND_NAAM: Record<Taal, readonly string[]> = {
  nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
const MAAND_KORT: Record<Taal, readonly string[]> = {
  nl: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

/** De vroegste maand die je in de URL kunt kiezen. */
export const VROEGSTE_MAAND: Maand = '2015-01'

export function isMaand(v: unknown): v is Maand {
  return typeof v === 'string' && MAAND_PATROON.test(v)
}

function delen(m: Maand): [number, number] {
  return [Number(m.slice(0, 4)), Number(m.slice(5, 7))]
}

function twee(n: number): string {
  return String(n).padStart(2, '0')
}

export function maandVan(dag: string): Maand {
  return dag.slice(0, 7)
}

export function isSchrikkeljaar(jaar: number): boolean {
  return (jaar % 4 === 0 && jaar % 100 !== 0) || jaar % 400 === 0
}

/** 28, 29, 30 of 31. */
export function dagenInMaand(m: Maand): number {
  const [j, mm] = delen(m)
  return new Date(Date.UTC(j, mm, 0)).getUTCDate()
}

export function eersteDag(m: Maand): string {
  return `${m}-01`
}

export function laatsteDag(m: Maand): string {
  return `${m}-${twee(dagenInMaand(m))}`
}

export function plusMaanden(m: Maand, n: number): Maand {
  const [j, mm] = delen(m)
  const totaal = j * 12 + (mm - 1) + n
  return `${Math.floor(totaal / 12)}-${twee((((totaal % 12) + 12) % 12) + 1)}`
}

/** "oktober 2026" */
export function maandNaam(m: Maand, taal: Taal = 'nl'): string {
  const [j, mm] = delen(m)
  return `${MAAND_NAAM[taal][mm - 1]} ${j}`
}

/** "okt" */
export function maandKort(m: Maand, taal: Taal = 'nl'): string {
  return MAAND_KORT[taal][delen(m)[1] - 1]
}

/** Het begin van de maand en het begin van de volgende maand (exclusief), in Nederlandse tijd. */
export function maandGrenzen(m: Maand): { van: Date; tot: Date } {
  return { van: dagStart(eersteDag(m)), tot: dagStart(eersteDag(plusMaanden(m, 1))) }
}

/** `n` maanden die eindigen bij `eind`, oudste eerst. */
export function maandenReeks(eind: Maand, n: number): Maand[] {
  return Array.from({ length: n }, (_, i) => plusMaanden(eind, i - n + 1))
}

/** Maand uit de URL (?maand=2026-10). Onbekend, te oud of in de toekomst: de lopende maand. */
export function kiesMaand(ruw: string | string[] | undefined | null, vandaag: string): Maand {
  const waarde = Array.isArray(ruw) ? ruw[0] : ruw
  const nu = maandVan(vandaag)
  if (!isMaand(waarde) || waarde > nu || waarde < VROEGSTE_MAAND) return nu
  return waarde
}

/** Hele dagen, begin en eind inbegrepen. */
export interface Venster {
  van: string
  tot: string
}

export interface MaandVenster extends Venster {
  maand: Maand
  /** Aantal dagen in het venster. */
  dagen: number
  /** Aantal dagen in de hele maand. */
  maandDagen: number
  /** De maand loopt nog: het venster eindigt vandaag. */
  lopend: boolean
  /** Het venster beslaat de hele maand. */
  heel: boolean
}

export function dagenIn(v: Venster): number {
  return dagenTussen(v.van, v.tot) + 1
}

export function inVenster(dag: string, v: Venster): boolean {
  return dag >= v.van && dag <= v.tot
}

/** Alle dagen van het venster, oudste eerst. */
export function dagenVan(v: Venster): string[] {
  return Array.from({ length: Math.max(0, dagenIn(v)) }, (_, i) => plusDagen(v.van, i))
}

function venster(m: Maand, dagen: number, lopend: boolean): MaandVenster {
  const maandDagen = dagenInMaand(m)
  const n = Math.max(1, Math.min(dagen, maandDagen))
  return { maand: m, van: eersteDag(m), tot: plusDagen(eersteDag(m), n - 1), dagen: n, maandDagen, lopend, heel: n === maandDagen }
}

/** De gekozen maand: helemaal, of tot en met vandaag als hij nog loopt. */
export function maandVenster(m: Maand, vandaag: string): MaandVenster {
  const lopend = maandVan(vandaag) === m
  return venster(m, lopend ? dagenTussen(eersteDag(m), vandaag) + 1 : dagenInMaand(m), lopend)
}

/**
 * Het venster om mee te vergelijken. Loopt de gekozen maand nog, dan dezelfde
 * eerste dagen van de andere maand (hoogstens die hele maand); anders de hele
 * andere maand.
 */
export function vergelijkVenster(basis: Maand, huidig: MaandVenster): MaandVenster {
  return venster(basis, huidig.lopend ? huidig.dagen : dagenInMaand(basis), false)
}

/** "september 2026" of "1 tot en met 14 september 2026". */
export function vensterNaam(v: MaandVenster, taal: Taal = 'nl'): string {
  if (v.heel && !v.lopend) return maandNaam(v.maand, taal)
  const eind = Number(v.tot.slice(8, 10))
  const naam = maandNaam(v.maand, taal)
  if (eind === 1) return `1 ${naam}`
  return taal === 'en' ? `1 to ${eind} ${naam}` : `1 tot en met ${eind} ${naam}`
}
