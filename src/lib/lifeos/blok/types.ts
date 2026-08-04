// ─── LifeOS — het 4-weken trainingsblok: types ──────────────────────────────
// Het PROGRAMMA is statische code-data (zoals `programma/training-data.ts`): het
// verandert niet per dag, dus het hoort niet in de database. Alleen de VOORTGANG
// (gelogde sets, voltooide sessies) leeft in de DB — zie `blok/opslag.ts`.
//
// ─── WAT HIER BEWUST NIET STAAT: GEWICHTEN ──────────────────────────────────
// Geen enkele oefening heeft een voorgeschreven kilo. Dat is geen omissie maar de
// kern van het ontwerp: het startgewicht is wat JIJ in week 1 kunt tillen, en
// daarna bepaalt je eigen log het voorstel (zie `blok/progressie.ts`). Een
// verzonnen "gebruik 100 kg" is precies het soort nepgetal dat dit project niet
// maakt — en het zou de double-progression-logica ondermijnen.
//
// Het programma schrijft dus voor: WELKE oefening, HOEVEEL sets, WELKE rep-range,
// HOE zwaar in RIR (reps in reserve), HOELANG rust, en waar relevant het tempo.

import type { OefeningDoel } from './progressie'

/** De zeven vaste dagen van het blok. Zondag = 0 (JS `Date.getDay()`). */
export type SessieCode = 'upper_a' | 'lower_a' | 'zone2' | 'upper_b' | 'rust' | 'lower_b' | 'hyrox'

/**
 * Eén oefening in een sessie.
 *
 * `doel` is exact de vorm die de progressie-engine leest — één bron, zodat het
 * programma en het gewichtsvoorstel niet uit elkaar kunnen lopen.
 */
export interface BlokOefening {
  naam: string
  doel: OefeningDoel
  /** Rust tussen sets in seconden. Zware compounds hebben er echt 2-3 min nodig. */
  rustSec: number
  /** Tempo als 'excentrisch-pauze-concentrisch' (bv '3-1-1'), alleen waar het uitmaakt. */
  tempo?: string
  /** Korte uitvoeringsaanwijzing. Eén regel, geen essay. */
  notitie?: string
  /** true = per kant loggen (split squat, lunges). De logger telt dan per zijde. */
  perKant?: boolean
}

/** Een krachtsessie: de kern van het blok. */
export interface KrachtSessie {
  code: Extract<SessieCode, 'upper_a' | 'lower_a' | 'upper_b' | 'lower_b'>
  soort: 'kracht'
  /** Weekdag 1=maandag … 6=zaterdag, 0=zondag. */
  dag: number
  titel: string
  focus: string
  /** Warming-up als losse regels; niet gelogd, wel getoond. */
  warmup: readonly string[]
  oefeningen: readonly BlokOefening[]
  /** Realistische duur inclusief rust, voor je agenda-blok. */
  duurMinuten: number
}

/** Eén Hyrox-station (zondag). Wat je logt verschilt per station. */
export interface HyroxStation {
  naam: string
  /** Wat de gebruiker invult: afstand, reps of kalorieën. */
  meet: 'afstand' | 'reps' | 'calorieen'
  /** De voorgeschreven hoeveelheid (bv 800 voor 800m, 20 voor 20 reps). */
  doelWaarde: number
  eenheid: string
  /** Optionele belasting-aanwijzing ('2×24 kg'), geen verzonnen exact gewicht. */
  belasting?: string
  substituut?: string
}

/** Een cardiosessie: Zone 2 (woensdag) of Hyrox-conditioning (zondag). */
export interface CardioSessie {
  code: Extract<SessieCode, 'zone2' | 'hyrox'>
  soort: 'cardio'
  dag: number
  titel: string
  focus: string
  /** Doelduur in minuten als bereik [min, max]. */
  duurBereik: readonly [number, number]
  /** Beoogde RPE (1-10). Zone 2 is expres LAAG — anders is het geen zone 2. */
  rpeDoel: readonly [number, number]
  /** Alleen voor zone2: de hartslagzone als percentage van je max. */
  hartslagZone?: readonly [number, number]
  /** Alleen voor hyrox: de stations, in volgorde. */
  stations?: readonly HyroxStation[]
  /** Aantal rondes (hyrox); per week gemoduleerd. */
  rondes?: number
  toelichting: readonly string[]
}

/** De rustdag. Geen sessie, maar wél een dag met een doel. */
export interface RustDag {
  code: 'rust'
  soort: 'rust'
  dag: number
  titel: string
  focus: string
  toelichting: readonly string[]
}

export type BlokDag = KrachtSessie | CardioSessie | RustDag

/**
 * De vier weken van het blok, elk met een eigen karakter.
 *
 * Dit is geen etiket maar een echte modulatie: `week-modulatie.ts` past de RIR en
 * het isolatie-volume aan per week. Zo bouwt het blok op en eindigt het zonder je
 * uitgeput een cut in te sturen.
 */
export interface WeekProfiel {
  week: 1 | 2 | 3 | 4
  naam: string
  doel: string
  /** Wordt bij het RIR-doel opgeteld: hoger = verder van falen, dus rustiger. */
  rirOffset: number
  /** Sets die van ISOLATIE-oefeningen afgaan (nooit van de compounds). */
  isolatieSetsDelta: number
  advies: string
}
