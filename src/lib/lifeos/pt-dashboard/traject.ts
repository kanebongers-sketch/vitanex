// ─── Fit Factory PT — het 13-weekse traject (PUUR) ──────────────────────────
// Opbouw volgens het PT-protocol en de Fit Guide: week 0 intake en nulmeting,
// daarna dertien weken in drie fases, met een check na week 4 en week 8, een
// nieuwe test (en schema) in week 5 en 9, en de eindevaluatie in week 13.
// Week 1 begint op de startdatum van het abonnement (pt_klanten.startdatum);
// alles daarvóór is week 0. Omschrijvingen zijn kort en in eigen woorden.

import { plusDagen } from './abonnementen'

export const TRAJECT_WEKEN = 13

export interface Fase {
  nr: 1 | 2 | 3
  naam: string
  vanWeek: number
  totWeek: number
  focus: string
}

export const FASES: readonly Fase[] = [
  { nr: 1, naam: 'De basis leggen', vanWeek: 0, totWeek: 4, focus: 'Ritme, techniek en gewoontes; opdagen telt het zwaarst.' },
  { nr: 2, naam: 'Opbouwen en consistentie', vanWeek: 5, totWeek: 8, focus: 'Progressie: intensiteit omhoog, voeding verfijnen.' },
  { nr: 3, naam: 'Versterken en vasthouden', vanWeek: 9, totWeek: 13, focus: 'Borgen en zelfstandig leren sturen.' },
]

export type MetingSoort = 'start' | 'tussen' | 'eind'

export interface TrajectMoment {
  week: number
  soort: 'intake' | 'test' | 'check' | 'eind'
  label: string
  /** Welke meting bij dit moment hoort (null = geen weging/omtrekmeting). */
  meting: MetingSoort | null
}

export const MOMENTEN: readonly TrajectMoment[] = [
  { week: 0, soort: 'intake', label: 'Intake, nulmeting en foto’s', meting: 'start' },
  { week: 1, soort: 'test', label: 'Cardio- en krachttest, eerste training', meting: null },
  { week: 4, soort: 'check', label: 'Check 1: weging en metingen, voeding en gedrag', meting: 'tussen' },
  { week: 5, soort: 'test', label: 'Nieuwe test en nieuw schema', meting: null },
  { week: 8, soort: 'check', label: 'Check 2: weging en metingen, voeding en gedrag', meting: 'tussen' },
  { week: 9, soort: 'test', label: 'Nieuwe test en laatste schema', meting: null },
  { week: 13, soort: 'eind', label: 'Eindevaluatie: meting, voor en na, vervolg bespreken', meting: 'eind' },
]

function dagenTussen(van: string, tot: string): number {
  return Math.round((Date.parse(`${tot}T12:00:00Z`) - Date.parse(`${van}T12:00:00Z`)) / 86_400_000)
}

/** Week 0 vóór de startdatum, daarna 1, 2, … (ook voorbij 13). */
export function trajectWeek(startdatum: string, vandaag: string): number {
  const d = dagenTussen(startdatum, vandaag)
  return d < 0 ? 0 : Math.floor(d / 7) + 1
}

/** Eerste en laatste dag van week n (n ≥ 1). */
export function weekBereik(startdatum: string, week: number): { van: string; tot: string } {
  const van = plusDagen(startdatum, (Math.max(1, week) - 1) * 7)
  return { van, tot: plusDagen(van, 6) }
}

export function faseVan(week: number): Fase | null {
  return FASES.find((f) => week >= f.vanWeek && week <= f.totWeek) ?? null
}

/** Wat er in week n op het programma staat (standaardopbouw). */
export function dezeWeek(week: number): string[] {
  const momenten = MOMENTEN.filter((m) => m.week === week).map((m) => m.label)
  if (week === 0) return momenten
  if (week > TRAJECT_WEKEN) return ['Traject afgerond: vervolg met PT, frequentie aanpassen of zelfstandig verder']
  const trainen = week === 1 ? [] : ['Trainen volgens het persoonlijke schema']
  return [...trainen, ...momenten]
}

export interface TrajectStand {
  /** 0 = nog niet gestart, 1–13 in het traject, >13 = afgerond. */
  week: number
  fase: Fase | null
  afgerond: boolean
  /** Alleen voor week ≥ 1. */
  bereik: { van: string; tot: string } | null
  taken: string[]
  /** Het eerstvolgende moment vanaf deze week (null na de eindevaluatie). */
  volgende: { moment: TrajectMoment; van: string } | null
}

export function trajectStand(startdatum: string, vandaag: string): TrajectStand {
  const week = trajectWeek(startdatum, vandaag)
  const volgendMoment = MOMENTEN.find((m) => m.week >= week && m.week >= 1) ?? null
  return {
    week,
    fase: faseVan(week),
    afgerond: week > TRAJECT_WEKEN,
    bereik: week >= 1 ? weekBereik(startdatum, week) : null,
    taken: dezeWeek(week),
    volgende: volgendMoment ? { moment: volgendMoment, van: weekBereik(startdatum, volgendMoment.week).van } : null,
  }
}

/** Welke metingen er volgens de opbouw tot en met deze week gedaan hadden moeten zijn. */
export function verwachteMetingen(week: number): Record<MetingSoort, number> {
  const tot = MOMENTEN.filter((m) => m.meting !== null && m.week < week)
  // De nulmeting hoort al bij week 0/1; een check of eindmeting pas als die week voorbij is.
  const start = week >= 1 ? 1 : 0
  return {
    start,
    tussen: tot.filter((m) => m.meting === 'tussen').length,
    eind: tot.some((m) => m.meting === 'eind') ? 1 : 0,
  }
}
