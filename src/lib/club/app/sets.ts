// ─── Fit Factory Club, ledenapp: sets loggen en de samenvatting (PUUR) ──────
// Het lid vult per set gewicht en herhalingen (of tijd) in. Hier: de invoer
// nakijken op de grens en de korte samenvatting na "training klaar".

import { isUuid } from './invoer'

export const MAX_SETS_PER_TRAINING = 200

export interface SetInvoer {
  oefeningId: string
  setNr: number
  herhalingen: number | null
  gewichtKg: number | null
  tijdSec: number | null
}

export interface TrainingMetSets {
  sets: SetInvoer[]
  duurSec: number | null
}

function getal(v: unknown, min: number, max: number, geheel: boolean): number | null | undefined {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) return undefined
  if (geheel && !Number.isInteger(n)) return undefined
  return geheel ? n : Math.round(n * 100) / 100
}

function leesSet(v: unknown, toegestaan: ReadonlySet<string>): SetInvoer | string {
  if (typeof v !== 'object' || v === null) return 'Ongeldige set.'
  const r = v as Record<string, unknown>
  if (!isUuid(r.oefeningId) || !toegestaan.has(r.oefeningId)) return 'Een oefening hoort niet bij dit schema.'
  const setNr = getal(r.setNr, 1, 20, true)
  if (!setNr) return 'Ongeldig setnummer.'
  const herhalingen = getal(r.herhalingen, 0, 300, true)
  const gewichtKg = getal(r.gewichtKg, 0, 1000, false)
  const tijdSec = getal(r.tijdSec, 0, 3600, true)
  if (herhalingen === undefined) return 'Herhalingen tussen 0 en 300.'
  if (gewichtKg === undefined) return 'Gewicht tussen 0 en 1000 kg.'
  if (tijdSec === undefined) return 'Tijd tussen 0 en 3600 seconden.'
  if (herhalingen === null && tijdSec === null) return 'Vul herhalingen of tijd in.'
  return { oefeningId: r.oefeningId, setNr, herhalingen, gewichtKg, tijdSec }
}

/**
 * Sets uit de body, alleen voor oefeningen van deze schemadag. Dezelfde
 * oefening en set dubbel: de laatste telt. Geen sets is ook goed (afvinken).
 */
export function leesGelogdeSets(ruw: unknown, duur: unknown, toegestaan: ReadonlySet<string>): TrainingMetSets | string {
  if (ruw !== undefined && ruw !== null && !Array.isArray(ruw)) return 'Ongeldige sets.'
  const lijst = Array.isArray(ruw) ? ruw : []
  if (lijst.length > MAX_SETS_PER_TRAINING) return `Maximaal ${MAX_SETS_PER_TRAINING} sets per training.`
  const per = new Map<string, SetInvoer>()
  for (const v of lijst) {
    const s = leesSet(v, toegestaan)
    if (typeof s === 'string') return s
    per.set(`${s.oefeningId}:${s.setNr}`, s)
  }
  const duurSec = getal(duur, 0, 21600, true)
  if (duurSec === undefined) return 'Ongeldige duur.'
  return { sets: [...per.values()], duurSec }
}

export interface VorigeBeste {
  /** Zwaarste gewicht ooit op deze oefening, en de meeste herhalingen daarmee. */
  gewichtKg: number | null
  herhalingen: number | null
}

export interface Samenvatting {
  sets: number
  oefeningen: number
  herhalingen: number
  /** Totaal gewicht x herhalingen, afgerond op hele kilo's. */
  volumeKg: number
  /** Oefeningen met een nieuw record (zwaarder, of meer herhalingen op het zwaarste gewicht). */
  records: string[]
}

export interface NieuwRecord {
  oefeningId: string
  naam: string
  /** Het nieuwe record: zwaarste gewicht van vandaag, met de meeste herhalingen daarop. */
  gewichtKg: number
  herhalingen: number
  /** Het oude record, ter vergelijking. */
  vorigKg: number
  vorigHerhalingen: number | null
}

/** Nieuwe records: zwaarder dan ooit, of meer herhalingen op het zwaarste gewicht. Alleen met een eerdere training. */
export function nieuweRecords(sets: readonly SetInvoer[], besten: ReadonlyMap<string, VorigeBeste>, namen: ReadonlyMap<string, string>): NieuwRecord[] {
  const perOefening = new Map<string, SetInvoer[]>()
  for (const s of sets) perOefening.set(s.oefeningId, [...(perOefening.get(s.oefeningId) ?? []), s])
  const uit: NieuwRecord[] = []
  for (const [id, lijst] of perOefening) {
    const vorig = besten.get(id)
    const metGewicht = lijst.filter((s) => s.gewichtKg !== null && s.gewichtKg > 0)
    if (!vorig || vorig.gewichtKg === null || metGewicht.length === 0) continue
    const zwaarst = Math.max(...metGewicht.map((s) => s.gewichtKg as number))
    const meesteOpZwaarst = Math.max(...metGewicht.filter((s) => s.gewichtKg === zwaarst).map((s) => s.herhalingen ?? 0))
    const beter = zwaarst > vorig.gewichtKg || (zwaarst === vorig.gewichtKg && meesteOpZwaarst > (vorig.herhalingen ?? 0))
    if (beter) {
      uit.push({ oefeningId: id, naam: namen.get(id) ?? 'Oefening', gewichtKg: zwaarst, herhalingen: meesteOpZwaarst, vorigKg: vorig.gewichtKg, vorigHerhalingen: vorig.herhalingen })
    }
  }
  return uit
}

/** De samenvatting na "training klaar". `namen`: oefening-id naar naam. */
export function samenvatting(sets: readonly SetInvoer[], besten: ReadonlyMap<string, VorigeBeste>, namen: ReadonlyMap<string, string>): Samenvatting {
  return {
    sets: sets.length,
    oefeningen: new Set(sets.map((s) => s.oefeningId)).size,
    herhalingen: sets.reduce((n, s) => n + (s.herhalingen ?? 0), 0),
    volumeKg: Math.round(sets.reduce((n, s) => n + (s.gewichtKg ?? 0) * (s.herhalingen ?? 0), 0)),
    records: nieuweRecords(sets, besten, namen).map((r) => r.naam),
  }
}

/** "48 min" of "1 u 05 min". */
export function toonDuur(sec: number): string {
  const min = Math.max(0, Math.round(sec / 60))
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} u ${String(min % 60).padStart(2, '0')} min`
}

/** Rusttimer als "1:30". */
export function toonKlok(sec: number): string {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
