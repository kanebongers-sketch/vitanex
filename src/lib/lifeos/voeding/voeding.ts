// ─── LifeOS — voeding & water ───────────────────────────────────────────────
// Vervangt MyFitnessPal en de water-tracker. Niet door ze na te bouwen: er komt
// hier geen voedingsdatabase en geen barcode-scanner. Handmatig loggen met
// macro's optioneel — dat is de scope, en dat is genoeg om die apps niet meer
// te hoeven openen.
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in migratie 060. Dat is geen duplicatie maar
// diepteverdediging met verschillende doelen: de database garandeert dat er
// nooit een negatieve slok in staat, deze laag geeft je een nette Nederlandse
// foutmelding in plaats van '23514'.
//
// ─── null ≠ 0, OOK HIER ─────────────────────────────────────────────────────
// Elke macro-lezer hieronder geeft `null` terug voor "niet ingevuld" en laat 0
// dóór als geldige waarde. Dat lijkt een detail, maar het is dezelfde regel als
// in het schema en in `totalen.ts`: één ontsnapte `?? 0` en de hele keten liegt.

import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

export const MAX_OMSCHRIJVING_LENGTE = 200
/** Typfout-vangnet (250 → 250000), geen uitspraak over wat gezond is. */
export const MAX_SLOK_ML = 5000
export const MAX_KCAL = 20000
export const MAX_MACRO_G = 2000

/** Vaste knoppen, geen formulier: dat is het hele punt van waterloggen. */
export const GLAS_ML = 250
export const FLES_ML = 500

export const MOMENTEN = Object.freeze(['ontbijt', 'lunch', 'diner', 'snack'] as const)
export type Moment = (typeof MOMENTEN)[number]

export function isMoment(v: unknown): v is Moment {
  return typeof v === 'string' && (MOMENTEN as readonly string[]).includes(v)
}

/** Eén slok/glas/fles, zoals hij uit de database komt én over de draad gaat. */
export interface WaterLog {
  id: string
  datum: string
  ml: number
  aangemaaktOp: string
}

/**
 * Eén ding dat je at.
 *
 * Alles behalve `omschrijving` mag null zijn — een halve log is beter dan geen
 * log. Wie eerst vier macro's moet invullen, logt de derde dag niets meer.
 */
export interface VoedingLog {
  id: string
  datum: string
  omschrijving: string
  kcal: number | null
  eiwitG: number | null
  koolhydratenG: number | null
  vetG: number | null
  moment: Moment | null
  aangemaaktOp: string
}

/** Je doelen, als je ze stelde. Alles null = geen doel, en dat mag. */
export interface VoedingDoelen {
  kcalDoel: number | null
  eiwitDoelG: number | null
  waterDoelMl: number | null
}

export const GEEN_DOELEN: VoedingDoelen = Object.freeze({
  kcalDoel: null,
  eiwitDoelG: null,
  waterDoelMl: null,
})

export interface NieuweWaterLog {
  datum: string
  ml: number
}

export interface NieuweVoedingLog {
  datum: string
  omschrijving: string
  kcal: number | null
  eiwitG: number | null
  koolhydratenG: number | null
  vetG: number | null
  moment: Moment | null
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ─── Systeemgrens: user input ───────────────────────────────────────────────

function leesDatum(v: unknown): Validatie<string> {
  if (typeof v !== 'string' || leesDatumSleutel(v) === null) {
    return { ok: false, fout: 'Datum moet YYYY-MM-DD zijn.' }
  }
  return { ok: true, waarde: v }
}

function leesOmschrijving(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Omschrijving ontbreekt.' }
  const tekst = v.trim()
  if (tekst.length === 0) {
    return { ok: false, fout: 'Zonder omschrijving weet je later niet wat je at.' }
  }
  if (tekst.length > MAX_OMSCHRIJVING_LENGTE) {
    return { ok: false, fout: `Omschrijving mag maximaal ${MAX_OMSCHRIJVING_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: tekst }
}

/**
 * Een optioneel getal: `null`/`undefined`/leeg → null, geen 0.
 *
 * DIT IS DE PLEK waar een `?? 0` het hele project zou slopen: dan wordt elk
 * leeggelaten veld een gemeten nul, en is die leugen daarna niet meer uit de
 * som te halen. 0 zelf komt er wél gewoon doorheen — dat is een meting.
 */
function leesOptioneelGetal(
  v: unknown,
  naam: string,
  max: number,
  heel: boolean,
): Validatie<number | null> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: null }

  // Getal én cijferstring: een <input type="number"> levert een string, en die
  // hier weigeren zou de UI dwingen tot een cast — precies wat we niet willen.
  const getal = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : Number.NaN
  if (!Number.isFinite(getal)) return { ok: false, fout: `${naam} moet een getal zijn.` }
  if (getal < 0) return { ok: false, fout: `${naam} kan niet negatief zijn.` }
  if (getal > max) return { ok: false, fout: `${naam} lijkt een typefout (max ${max}).` }
  if (heel && !Number.isInteger(getal)) {
    return { ok: false, fout: `${naam} moet een heel getal zijn.` }
  }

  // Afronden op één decimaal: dat is wat de database bewaart (numeric(6,1)).
  // Doen we het hier niet, dan komt er 12.34 in en 12.3 uit — en dan klopt het
  // totaal op het scherm niet met het totaal na een reload.
  return { ok: true, waarde: heel ? getal : Math.round(getal * 10) / 10 }
}

function leesMoment(v: unknown): Validatie<Moment | null> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: null }
  if (!isMoment(v)) return { ok: false, fout: 'Moment is ontbijt, lunch, diner of snack.' }
  return { ok: true, waarde: v }
}

export function leesNieuweWaterLog(body: unknown): Validatie<NieuweWaterLog> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum

  const ml = typeof body.ml === 'number' ? body.ml : Number.NaN
  if (!Number.isInteger(ml)) return { ok: false, fout: 'Milliliters moet een heel getal zijn.' }
  if (ml <= 0) return { ok: false, fout: 'Een slok van niets is geen slok.' }
  if (ml > MAX_SLOK_ML) return { ok: false, fout: `Meer dan ${MAX_SLOK_ML}ml in één keer lijkt een typefout.` }

  return { ok: true, waarde: { datum: datum.waarde, ml } }
}

export function leesNieuweVoedingLog(body: unknown): Validatie<NieuweVoedingLog> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum
  const omschrijving = leesOmschrijving(body.omschrijving)
  if (!omschrijving.ok) return omschrijving

  const kcal = leesOptioneelGetal(body.kcal, 'Calorieën', MAX_KCAL, true)
  if (!kcal.ok) return kcal
  const eiwitG = leesOptioneelGetal(body.eiwitG, 'Eiwit', MAX_MACRO_G, false)
  if (!eiwitG.ok) return eiwitG
  const koolhydratenG = leesOptioneelGetal(body.koolhydratenG, 'Koolhydraten', MAX_MACRO_G, false)
  if (!koolhydratenG.ok) return koolhydratenG
  const vetG = leesOptioneelGetal(body.vetG, 'Vet', MAX_MACRO_G, false)
  if (!vetG.ok) return vetG
  const moment = leesMoment(body.moment)
  if (!moment.ok) return moment

  return {
    ok: true,
    waarde: {
      datum: datum.waarde,
      omschrijving: omschrijving.waarde,
      kcal: kcal.waarde,
      eiwitG: eiwitG.waarde,
      koolhydratenG: koolhydratenG.waarde,
      vetG: vetG.waarde,
      moment: moment.waarde,
    },
  }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────
// Postgres `numeric` komt via PostgREST als STRING binnen (JS-getallen kunnen
// numeric niet lekloos dragen). Zonder deze conversie is `eiwit_g` een string,
// telt `+` ze aan elkaar vast en staat er ineens '3040' waar 70 hoort.

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Getal uit de DB. String of number in, `null` bij afwezig of onleesbaar. */
function getal(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : Number.NaN
  return Number.isFinite(n) ? n : null
}

export function waterLogVanRij(rij: unknown): WaterLog | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const datum = tekst(rij.datum)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  const ml = getal(rij.ml)
  if (id === null || datum === null || aangemaaktOp === null || ml === null) return null

  return { id, datum, ml, aangemaaktOp }
}

export function waterLogsVanRijen(rijen: readonly unknown[]): WaterLog[] {
  return rijen.map(waterLogVanRij).filter((l): l is WaterLog => l !== null)
}

export function voedingLogVanRij(rij: unknown): VoedingLog | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const datum = tekst(rij.datum)
  const omschrijving = tekst(rij.omschrijving)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || datum === null || omschrijving === null || aangemaaktOp === null) return null

  return {
    id,
    datum,
    omschrijving,
    kcal: getal(rij.kcal),
    eiwitG: getal(rij.eiwit_g),
    koolhydratenG: getal(rij.koolhydraten_g),
    vetG: getal(rij.vet_g),
    moment: isMoment(rij.moment) ? rij.moment : null,
    aangemaaktOp,
  }
}

export function voedingLogsVanRijen(rijen: readonly unknown[]): VoedingLog[] {
  return rijen.map(voedingLogVanRij).filter((l): l is VoedingLog => l !== null)
}

/** Geen rij in `voeding_doelen` = geen doelen. Dat is een geldige toestand. */
export function doelenVanRij(rij: unknown): VoedingDoelen {
  if (!isObject(rij)) return GEEN_DOELEN
  return {
    kcalDoel: getal(rij.kcal_doel),
    eiwitDoelG: getal(rij.eiwit_doel_g),
    waterDoelMl: getal(rij.water_doel_ml),
  }
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Twee echt verschillende
// vormen, en beide worden gelezen — nooit gecast.

function leesDoelenJson(ruw: unknown): VoedingDoelen {
  if (!isObject(ruw)) return GEEN_DOELEN
  return {
    kcalDoel: getal(ruw.kcalDoel),
    eiwitDoelG: getal(ruw.eiwitDoelG),
    waterDoelMl: getal(ruw.waterDoelMl),
  }
}

export function leesWaterLogJson(ruw: unknown): WaterLog | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const datum = tekst(ruw.datum)
  const aangemaaktOp = tekst(ruw.aangemaaktOp)
  const ml = getal(ruw.ml)
  if (id === null || datum === null || aangemaaktOp === null || ml === null) return null

  return { id, datum, ml, aangemaaktOp }
}

export function leesVoedingLogJson(ruw: unknown): VoedingLog | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const datum = tekst(ruw.datum)
  const omschrijving = tekst(ruw.omschrijving)
  const aangemaaktOp = tekst(ruw.aangemaaktOp)
  if (id === null || datum === null || omschrijving === null || aangemaaktOp === null) return null

  return {
    id,
    datum,
    omschrijving,
    kcal: getal(ruw.kcal),
    eiwitG: getal(ruw.eiwitG),
    koolhydratenG: getal(ruw.koolhydratenG),
    vetG: getal(ruw.vetG),
    moment: isMoment(ruw.moment) ? ruw.moment : null,
    aangemaaktOp,
  }
}

export interface WaterAntwoord {
  logs: WaterLog[]
  doelMl: number | null
}

/** Het antwoord van `GET /api/voeding/water`. */
export function leesWaterAntwoord(ruw: unknown): WaterAntwoord | null {
  if (!isObject(ruw) || !Array.isArray(ruw.logs)) return null

  const logs = ruw.logs.map(leesWaterLogJson)
  if (logs.some((l) => l === null)) return null

  return {
    logs: logs.filter((l): l is WaterLog => l !== null),
    doelMl: getal(ruw.doelMl),
  }
}

/** Het antwoord van `POST /api/voeding/water`. */
export function leesWaterLogAntwoord(ruw: unknown): WaterLog | null {
  if (!isObject(ruw)) return null
  return leesWaterLogJson(ruw.log)
}

export interface VoedingAntwoord {
  logs: VoedingLog[]
  doelen: VoedingDoelen
}

/** Het antwoord van `GET /api/voeding`. */
export function leesVoedingAntwoord(ruw: unknown): VoedingAntwoord | null {
  if (!isObject(ruw) || !Array.isArray(ruw.logs)) return null

  const logs = ruw.logs.map(leesVoedingLogJson)
  if (logs.some((l) => l === null)) return null

  return {
    logs: logs.filter((l): l is VoedingLog => l !== null),
    doelen: leesDoelenJson(ruw.doelen),
  }
}

/** Het antwoord van `POST /api/voeding`. */
export function leesVoedingLogAntwoord(ruw: unknown): VoedingLog | null {
  if (!isObject(ruw)) return null
  return leesVoedingLogJson(ruw.log)
}
