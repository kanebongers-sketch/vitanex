// ─── Club, afspraken: indeling voor het scherm (PUUR) ───────────────────────
// Per dag groeperen, de plek in het dagraster en de tellers bovenaan.

import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import { dagenVanWeek, nlDelen, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { AfspraakStatus, AfspraakWeergave } from './model'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'

export const WEERGAVEN = ['week', 'dag'] as const
export type Weergave = (typeof WEERGAVEN)[number]

export function isWeergave(v: unknown): v is Weergave {
  return v === 'week' || v === 'dag'
}

/** Datum en kloktijd van een ISO-tijdstip in Nederland. */
export function nlDatumTijd(iso: string): { datum: string; tijd: string; minuten: number } {
  const d = nlDelen(new Date(iso))
  return { datum: d.datum, tijd: d.tijd, minuten: d.minuten }
}

/** "09:00 tot 09:45" | "09:00 to 09:45" */
export function tijdvak(a: Pick<AfspraakWeergave, 'start' | 'eind'>, taal: Taal = 'nl'): string {
  return AFSPRAKEN[taal].tijdvak(nlDatumTijd(a.start).tijd, nlDatumTijd(a.eind).tijd)
}

/** De zeven dagen van de week, elk met zijn afspraken op begintijd. */
export function perDag<T extends Pick<AfspraakWeergave, 'start'>>(lijst: readonly T[], maandag: string): { datum: string; afspraken: T[] }[] {
  const gesorteerd = [...lijst].sort((a, b) => a.start.localeCompare(b.start))
  return dagenVanWeek(maandag).map((datum) => ({ datum, afspraken: gesorteerd.filter((a) => nlDatumTijd(a.start).datum === datum) }))
}

export interface Raster {
  /** Minuten sinds middernacht. */
  van: number
  tot: number
}

/** Het dagraster: de openingstijd van die dag op hele uren, of 07:00 tot 22:00. */
export function rasterVoorDag(opening: Openingstijden | null, weekdag: number): Raster {
  const dag = opening?.[weekdag - 1] ?? null
  if (!dag) return { van: 7 * 60, tot: 22 * 60 }
  return { van: Math.floor(tijdNaarMinuten(dag.van) / 60) * 60, tot: Math.ceil(tijdNaarMinuten(dag.tot) / 60) * 60 }
}

/** De hele uren in het raster, voor de lijnen en labels. */
export function urenIn(r: Raster): number[] {
  const uit: number[] = []
  for (let m = r.van; m <= r.tot; m += 60) uit.push(m)
  return uit
}

/** Plek van een afspraak in het dagraster, in procenten (boven en hoogte); buiten de dag = null. */
export function plekInRaster(a: Pick<AfspraakWeergave, 'start' | 'eind'>, datum: string, r: Raster): { boven: number; hoogte: number } | null {
  const s = nlDatumTijd(a.start)
  if (s.datum !== datum) return null
  const e = nlDatumTijd(a.eind)
  const eind = e.datum === datum ? e.minuten : 24 * 60
  const van = Math.max(r.van, s.minuten)
  const tot = Math.min(r.tot, eind)
  if (tot <= van) return null
  const lengte = r.tot - r.van
  return { boven: ((van - r.van) / lengte) * 100, hoogte: ((tot - van) / lengte) * 100 }
}

export type Tellers = Record<AfspraakStatus, number> & { opkomst: number | null }

/**
 * Tellers voor bovenaan. Opkomst = geweest / (geweest + niet gekomen), alleen
 * als er al afgeronde afspraken zijn (anders null, geen verzonnen percentage).
 */
export function tel(lijst: readonly Pick<AfspraakWeergave, 'status'>[]): Tellers {
  const uit = { gepland: 0, geweest: 0, niet_gekomen: 0, geannuleerd: 0 }
  for (const a of lijst) uit[a.status] += 1
  const afgerond = uit.geweest + uit.niet_gekomen
  return { ...uit, opkomst: afgerond > 0 ? Math.round((uit.geweest / afgerond) * 100) : null }
}
