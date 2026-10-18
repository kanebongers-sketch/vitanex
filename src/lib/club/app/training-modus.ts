// ─── Fit Factory Club, ledenapp: een training doen, set voor set (PUUR) ─────
// De staat van "Start training": per set gewicht en herhalingen (of tijd),
// alvast ingevuld met wat het lid de vorige keer deed. Rust komt uit het
// schema; in een superset pas na de laatste oefening van de ronde.

import { blokken, uitvoerVolgorde } from '@/lib/club/training/blokken'
import { bereik } from '@/lib/club/training/progressie'
import type { AppOefening, AppSchemaDag, OefeningHistorie, VorigeSet } from './schema'
import type { SetInvoer } from './sets'

export interface SetVeld {
  kg: string
  herh: string
  tijd: string
  klaar: boolean
}

export type Invoer = Record<string, SetVeld>

export const setSleutel = (regelId: string, setNr: number): string => `${regelId}:${setNr}`

export const aantalSets = (o: AppOefening): number => Math.max(1, Math.min(20, o.sets ?? 3))

const komma = (v: number): string => String(v).replace('.', ',')

export function opTijd(o: AppOefening): boolean {
  return o.tijdSec !== null && !o.herhalingen
}

function vorigeSet(h: OefeningHistorie | undefined, setNr: number): VorigeSet | null {
  const sets = h?.vorige?.sets ?? []
  return sets.find((s) => s.setNr === setNr) ?? sets[sets.length - 1] ?? null
}

/** Startwaarden: het gewicht van de vorige keer (zelfde set), anders uit het schema. */
export function beginInvoer(dag: AppSchemaDag, historie: Readonly<Record<string, OefeningHistorie>>): Invoer {
  const uit: Invoer = {}
  for (const o of dag.oefeningen) {
    for (let n = 1; n <= aantalSets(o); n++) {
      const v = vorigeSet(historie[o.oefeningId], n)
      const kg = v?.gewichtKg ?? o.gewichtKg
      uit[setSleutel(o.id, n)] = { kg: kg !== null && kg > 0 ? komma(kg) : '', herh: '', tijd: '', klaar: false }
    }
  }
  return uit
}

/** Wat er grijs in het veld staat: de vorige keer, anders het doel uit het schema. */
export function voorstelSet(o: AppOefening, h: OefeningHistorie | undefined, setNr: number): { herh: string; tijd: string } {
  const v = vorigeSet(h, setNr)
  const b = bereik(o.herhalingen)
  return {
    herh: v?.herhalingen !== null && v?.herhalingen !== undefined ? String(v.herhalingen) : b ? String(b.hoog) : '',
    tijd: v?.tijdSec !== null && v?.tijdSec !== undefined ? String(v.tijdSec) : o.tijdSec !== null ? String(o.tijdSec) : '',
  }
}

/** "Vorige keer: 40 kg x 10" voor een set, of null. */
export function vorigeTekst(h: OefeningHistorie | undefined, setNr: number): string | null {
  const sets = h?.vorige?.sets ?? []
  const v = sets.find((s) => s.setNr === setNr)
  if (!v) return null
  const maat = v.herhalingen !== null ? `${v.herhalingen}` : v.tijdSec !== null ? `${v.tijdSec} sec` : '?'
  return v.gewichtKg !== null && v.gewichtKg > 0 ? `${komma(v.gewichtKg)} kg x ${maat}` : maat
}

function getal(t: string): number | null {
  const n = Number(t.trim().replace(',', '.'))
  return t.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null
}

/** De afgevinkte sets voor de API. Een leeg veld neemt het grijze voorstel over. */
export function naarSets(dag: AppSchemaDag, invoer: Invoer, historie: Readonly<Record<string, OefeningHistorie>>): SetInvoer[] {
  const uit: SetInvoer[] = []
  for (const o of dag.oefeningen) {
    for (let n = 1; n <= aantalSets(o); n++) {
      const v = invoer[setSleutel(o.id, n)]
      if (!v?.klaar) continue
      const voorstel = voorstelSet(o, historie[o.oefeningId], n)
      const herhalingen = opTijd(o) ? null : getal(v.herh || voorstel.herh)
      const tijdSec = opTijd(o) ? getal(v.tijd || voorstel.tijd) : null
      if (herhalingen === null && tijdSec === null) continue
      uit.push({ oefeningId: o.oefeningId, setNr: n, herhalingen: herhalingen === null ? null : Math.round(herhalingen), gewichtKg: getal(v.kg), tijdSec: tijdSec === null ? null : Math.round(tijdSec) })
    }
  }
  return uit
}

export interface TrainingStap {
  sleutel: string
  naam: string
  set: number
  rustNa: number
}

/** Alle sets in de volgorde van uitvoeren (superset: om en om), met de rust erna. */
export function stappenVanDag(dag: AppSchemaDag): TrainingStap[] {
  return blokken(dag.oefeningen).flatMap((blok) =>
    uitvoerVolgorde({ ...blok, items: blok.items.map((o) => ({ ...o, sets: aantalSets(o) })) }).map((stap) => ({
      sleutel: setSleutel(stap.item.id, stap.set),
      naam: stap.item.naam,
      set: stap.set,
      rustNa: stap.rustNa,
    })),
  )
}

/** Rust in seconden na elke set (superset: alleen na de laatste oefening van de ronde). */
export function rustNaSet(dag: AppSchemaDag): Map<string, number> {
  return new Map(stappenVanDag(dag).map((s) => [s.sleutel, s.rustNa]))
}

/** De eerstvolgende set die nog open staat na `sleutel`, als tekst: "set 2 Back squat". */
export function volgendeSet(stappen: readonly TrainingStap[], invoer: Invoer, sleutel: string): string | null {
  const i = stappen.findIndex((s) => s.sleutel === sleutel)
  const volgende = [...stappen.slice(i + 1), ...stappen.slice(0, Math.max(0, i))].find((s) => !invoer[s.sleutel]?.klaar && s.sleutel !== sleutel)
  return volgende ? `set ${volgende.set} ${volgende.naam}` : null
}

/** Hoeveel sets afgevinkt, van het totaal. */
export function voortgang(dag: AppSchemaDag, invoer: Invoer): { klaar: number; totaal: number } {
  const totaal = dag.oefeningen.reduce((n, o) => n + aantalSets(o), 0)
  const klaar = Object.entries(invoer).filter(([k, v]) => v.klaar && dag.oefeningen.some((o) => k.startsWith(`${o.id}:`))).length
  return { klaar, totaal }
}
