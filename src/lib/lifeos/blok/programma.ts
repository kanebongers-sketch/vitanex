// ─── LifeOS — het 4-weken blok: programma-logica ────────────────────────────
// De enige plek die "welke sessie hoort bij deze dag, in welke week, met welke
// aanpassing" beantwoordt. PUUR: datums komen als `YYYY-MM-DD` binnen, nooit
// `new Date()` zonder argument — zo is dit testbaar zonder de klok te mocken
// (dezelfde afspraak als `vrije-blokken.ts` en `intentie.ts`).

import type { BlokDag, BlokOefening, KrachtSessie, SessieCode, WeekProfiel } from './types'
import { UPPER_A, LOWER_A, UPPER_B, LOWER_B } from './kracht-sessies'
import { ZONE2, HYROX, RUSTDAG, WEEK_PROFIELEN, HYROX_RONDES_PER_WEEK } from './cardio-sessies'

/** Het blok duurt vier weken. Daarna volgt een evaluatie, geen automatische verlenging. */
export const BLOK_WEKEN = 4

/** Alle dagen van het blok, op weekdag-nummer (0=zondag … 6=zaterdag). */
const PER_WEEKDAG: Readonly<Record<number, BlokDag>> = {
  0: HYROX,
  1: UPPER_A,
  2: LOWER_A,
  3: ZONE2,
  4: UPPER_B,
  5: RUSTDAG,
  6: LOWER_B,
}

/** Alle dagen in weekvolgonde (maandag eerst) — voor het weekoverzicht. */
export const BLOK_WEEK: readonly BlokDag[] = [
  UPPER_A,
  LOWER_A,
  ZONE2,
  UPPER_B,
  RUSTDAG,
  LOWER_B,
  HYROX,
]

/** Zoekt een dag op zijn code. Null als de code niet bestaat (systeemgrens). */
export function dagVoorCode(code: string): BlokDag | null {
  return BLOK_WEEK.find((d) => d.code === code) ?? null
}

/** De sessie die bij een weekdag hoort (0=zondag). */
export function dagVoorWeekdag(weekdag: number): BlokDag | null {
  return PER_WEEKDAG[weekdag] ?? null
}

// ─── Datum → blokweek ───────────────────────────────────────────────────────

/** `YYYY-MM-DD` → UTC-middernacht, of null als het geen geldige datum is. */
function alsDag(datum: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return null
  const d = new Date(`${datum}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

const DAG_MS = 86_400_000

/**
 * In welke blokweek (1-4) valt deze datum, gegeven de startdatum van het blok?
 *
 * Null betekent "buiten het blok": vóór de start, of ná week 4. Dat onderscheid is
 * belangrijk — een dag buiten het blok krijgt geen sessie voorgeschreven in plaats
 * van stilzwijgend week 1 te herhalen.
 */
export function blokWeekVoorDatum(startDatum: string, datum: string): 1 | 2 | 3 | 4 | null {
  const start = alsDag(startDatum)
  const dag = alsDag(datum)
  if (!start || !dag) return null

  const dagen = Math.floor((dag.getTime() - start.getTime()) / DAG_MS)
  if (dagen < 0) return null

  const week = Math.floor(dagen / 7) + 1
  return week >= 1 && week <= BLOK_WEKEN ? (week as 1 | 2 | 3 | 4) : null
}

/** Het weekprofiel (naam, doel, modulatie, advies) van een blokweek. */
export function weekProfiel(week: 1 | 2 | 3 | 4): WeekProfiel {
  // De lijst is compleet en vast; de fallback is puur zodat het type klopt zonder
  // een non-null assertion. Hij is onbereikbaar bij een geldige week.
  return WEEK_PROFIELEN.find((p) => p.week === week) ?? WEEK_PROFIELEN[0]
}

/** Het aantal Hyrox-rondes voor een blokweek. */
export function hyroxRondes(week: 1 | 2 | 3 | 4): number {
  return HYROX_RONDES_PER_WEEK[week]
}

// ─── Weekmodulatie ──────────────────────────────────────────────────────────

/**
 * Is dit een isolatie-oefening?
 *
 * De regel is de RIR-band: alleen isolatie mag tot falen (`rirDoel` begint op 0).
 * Compounds staan op minimaal 1 RIR. Zo hoeft geen enkele oefening een apart
 * "isolatie: true"-vlaggetje te dragen dat uit de pas kan lopen met zijn RIR-doel.
 */
export function isIsolatie(oefening: BlokOefening): boolean {
  return oefening.doel.rirDoel[0] === 0
}

/** Houdt een RIR-waarde binnen 0-10, zodat een offset nooit onzin oplevert. */
function klem(waarde: number): number {
  return Math.min(10, Math.max(0, waarde))
}

/**
 * Past het weekprofiel toe op één oefening: RIR-offset en (voor isolatie) minder
 * sets. Retourneert een NIEUW object — de programma-constanten blijven ongemoeid,
 * anders zou week 4 het programma permanent uitkleden.
 */
export function pasWeekToeOpOefening(oefening: BlokOefening, week: 1 | 2 | 3 | 4): BlokOefening {
  const profiel = weekProfiel(week)
  const isolatie = isIsolatie(oefening)
  const sets = isolatie
    ? Math.max(1, oefening.doel.sets + profiel.isolatieSetsDelta)
    : oefening.doel.sets

  return {
    ...oefening,
    doel: {
      ...oefening.doel,
      sets,
      rirDoel: [
        klem(oefening.doel.rirDoel[0] + profiel.rirOffset),
        klem(oefening.doel.rirDoel[1] + profiel.rirOffset),
      ] as const,
    },
  }
}

/** Past het weekprofiel toe op een hele krachtsessie. Nieuw object, geen mutatie. */
export function pasWeekToe(sessie: KrachtSessie, week: 1 | 2 | 3 | 4): KrachtSessie {
  return {
    ...sessie,
    oefeningen: sessie.oefeningen.map((o) => pasWeekToeOpOefening(o, week)),
  }
}

// ─── De dag van vandaag ─────────────────────────────────────────────────────

/** Wat er vandaag op het programma staat, inclusief weekmodulatie. */
export interface DagPlan {
  datum: string
  week: 1 | 2 | 3 | 4
  profiel: WeekProfiel
  dag: BlokDag
  /** Alleen bij Hyrox: het aantal rondes voor deze week. */
  rondes?: number
}

/**
 * Het plan voor één datum, of null als de datum buiten het blok valt.
 *
 * `weekdag` komt als parameter binnen (0=zondag) in plaats van uit een `Date`, zodat
 * deze functie geen tijdzone-aannames doet: de aanroeper weet in welke tijdzone de
 * gebruiker leeft, deze module niet.
 */
export function planVoorDatum(startDatum: string, datum: string, weekdag: number): DagPlan | null {
  const week = blokWeekVoorDatum(startDatum, datum)
  if (week === null) return null

  const dag = dagVoorWeekdag(weekdag)
  if (!dag) return null

  const gemoduleerd = dag.soort === 'kracht' ? pasWeekToe(dag, week) : dag
  return {
    datum,
    week,
    profiel: weekProfiel(week),
    dag: gemoduleerd,
    ...(dag.code === 'hyrox' ? { rondes: hyroxRondes(week) } : {}),
  }
}

/** Alle sessie-codes die het blok kent — voor validatie op de API-grens. */
export const SESSIE_CODES: readonly SessieCode[] = [
  'upper_a',
  'lower_a',
  'zone2',
  'upper_b',
  'rust',
  'lower_b',
  'hyrox',
]

/** Is dit een code die het blok kent? Validatie op de systeemgrens. */
export function isSessieCode(waarde: unknown): waarde is SessieCode {
  return typeof waarde === 'string' && (SESSIE_CODES as readonly string[]).includes(waarde)
}
