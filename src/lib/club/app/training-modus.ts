// ─── Fit Factory Club, ledenapp: een training doen, set voor set (PUUR) ─────
// De staat van "Start training": per set gewicht en herhalingen (of tijd),
// alvast ingevuld met wat het lid de vorige keer deed. Rust komt uit het
// schema; in een superset pas na de laatste oefening van de ronde.

import { blokken, uitvoerVolgorde, type BlokSoort } from '@/lib/club/training/blokken'
import { bereik } from '@/lib/club/training/progressie'
import type { AppOefening, AppSchemaDag, OefeningHistorie, VorigeSet } from './schema'
import type { SetInvoer } from './sets'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

export interface SetVeld {
  kg: string
  herh: string
  tijd: string
  klaar: boolean
}

export type Invoer = Record<string, SetVeld>

export const setSleutel = (regelId: string, setNr: number): string => `${regelId}:${setNr}`

export const aantalSets = (o: AppOefening): number => Math.max(1, Math.min(20, o.sets ?? 3))

/** 42.5 wordt "42,5". */
/** Een getal met de decimaal van de taal: 42,5 of 42.5. */
export const komma = (v: number, taal: Taal = 'nl'): string => (taal === 'nl' ? String(v).replace('.', ',') : String(v))

export function opTijd(o: AppOefening): boolean {
  return o.tijdSec !== null && !o.herhalingen
}

function vorigeSet(h: OefeningHistorie | undefined, setNr: number): VorigeSet | null {
  const sets = h?.vorige?.sets ?? []
  return sets.find((s) => s.setNr === setNr) ?? sets[sets.length - 1] ?? null
}

/**
 * Het gewicht om mee te beginnen voor een set: dat van de vorige keer (zelfde set),
 * anders uit het schema. Zet de trainer in het schema een zwaarder gewicht dan het
 * lid de vorige keer gebruikte (de progressiestap), dan wint het schema.
 */
export function beginGewicht(o: AppOefening, h: OefeningHistorie | undefined, setNr: number): number | null {
  const vorige = vorigeSet(h, setNr)?.gewichtKg ?? null
  const schema = o.gewichtKg !== null && o.gewichtKg > 0 ? o.gewichtKg : null
  if (vorige === null || vorige <= 0) return schema
  const zwaarsteVorige = Math.max(0, ...(h?.vorige?.sets ?? []).map((s) => s.gewichtKg ?? 0))
  return schema !== null && schema > zwaarsteVorige ? schema : vorige
}

/** Startwaarden per set: het gewicht uit `beginGewicht`, herhalingen en tijd leeg (het voorstel staat grijs). */
export function beginInvoer(dag: AppSchemaDag, historie: Readonly<Record<string, OefeningHistorie>>): Invoer {
  const uit: Invoer = {}
  for (const o of dag.oefeningen) {
    for (let n = 1; n <= aantalSets(o); n++) {
      const kg = beginGewicht(o, historie[o.oefeningId], n)
      uit[setSleutel(o.id, n)] = { kg: kg !== null ? komma(kg) : '', herh: '', tijd: '', klaar: false }
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
export function vorigeTekst(h: OefeningHistorie | undefined, setNr: number, taal: Taal = 'nl'): string | null {
  const sets = h?.vorige?.sets ?? []
  const v = sets.find((s) => s.setNr === setNr)
  if (!v) return null
  const maat = v.herhalingen !== null ? `${v.herhalingen}` : v.tijdSec !== null ? `${v.tijdSec} sec` : '?'
  return v.gewichtKg !== null && v.gewichtKg > 0 ? `${komma(v.gewichtKg, taal)} kg x ${maat}` : maat
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
  /** Het id van de schemaregel (AppOefening.id). */
  regelId: string
  naam: string
  set: number
  rustNa: number
}

/** Alle sets in de volgorde van uitvoeren (superset: om en om), met de rust erna. */
export function stappenVanDag(dag: AppSchemaDag): TrainingStap[] {
  return blokken(dag.oefeningen).flatMap((blok) =>
    uitvoerVolgorde({ ...blok, items: blok.items.map((o) => ({ ...o, sets: aantalSets(o) })) }).map((stap) => ({
      sleutel: setSleutel(stap.item.id, stap.set),
      regelId: stap.item.id,
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

/** De eerstvolgende stap die nog open staat na `sleutel` (daarna van voren af aan), of null. */
export function volgendeOpen(stappen: readonly TrainingStap[], invoer: Invoer, sleutel: string): TrainingStap | null {
  const i = stappen.findIndex((s) => s.sleutel === sleutel)
  return [...stappen.slice(i + 1), ...stappen.slice(0, Math.max(0, i))].find((s) => !invoer[s.sleutel]?.klaar && s.sleutel !== sleutel) ?? null
}

/** De eerstvolgende set die nog open staat na `sleutel`, als tekst: "set 2 Back squat". */
export function volgendeSet(stappen: readonly TrainingStap[], invoer: Invoer, sleutel: string): string | null {
  const volgende = volgendeOpen(stappen, invoer, sleutel)
  return volgende ? `set ${volgende.set} ${volgende.naam}` : null
}

/** Hoeveel sets afgevinkt, van het totaal. */
export function voortgang(dag: AppSchemaDag, invoer: Invoer): { klaar: number; totaal: number } {
  const totaal = dag.oefeningen.reduce((n, o) => n + aantalSets(o), 0)
  const klaar = Object.entries(invoer).filter(([k, v]) => v.klaar && dag.oefeningen.some((o) => k.startsWith(`${o.id}:`))).length
  return { klaar, totaal }
}

export interface OefeningPlek {
  /** "A" voor een losse oefening, "B1", "B2" in een superset of circuit. */
  label: string
  soort: BlokSoort
  /** De andere oefeningen in hetzelfde blok (leeg bij een losse oefening). */
  samenMet: string[]
}

/** Labels zoals op de vloer: elk blok een letter, in een superset of circuit genummerd (A1, A2). */
export function oefeningPlekken(dag: AppSchemaDag): Map<string, OefeningPlek> {
  const uit = new Map<string, OefeningPlek>()
  blokken(dag.oefeningen).forEach((blok, i) => {
    const letter = String.fromCharCode(65 + Math.min(i, 25))
    blok.items.forEach((o, j) => {
      uit.set(o.id, {
        label: blok.items.length === 1 ? letter : `${letter}${j + 1}`,
        soort: blok.soort,
        samenMet: blok.items.filter((x) => x.id !== o.id).map((x) => x.naam),
      })
    })
  })
  return uit
}

/** Een stap omhoog of omlaag. Leeg veld: vanaf het grijze voorstel. Nooit onder 0 of boven `max`. */
export function stapWaarde(waarde: string, voorstel: string, delta: number, max: number): string {
  const huidig = getal(waarde) ?? getal(voorstel) ?? 0
  const n = Math.min(max, Math.max(0, Math.round((huidig + delta) * 100) / 100))
  return komma(n)
}

/** Hoe groot een stap met + of min is: kilo's per 2,5 (onder 10 kg per 1), herhalingen per 1, tijd per 5 seconden. */
export function stapGrootte(soort: 'kg' | 'herh' | 'tijd', waarde: string): number {
  if (soort === 'herh') return 1
  if (soort === 'tijd') return 5
  const n = getal(waarde) ?? 0
  return n < 10 ? 1 : 2.5
}

/** De set die nu aan de beurt is: de eerste open set van deze oefening, of null als alles gedaan is. */
export function huidigeSet(o: AppOefening, invoer: Invoer): number | null {
  for (let n = 1; n <= aantalSets(o); n++) if (!invoer[setSleutel(o.id, n)]?.klaar) return n
  return null
}

/** Een afgevinkte set als korte tekst: "42,5 kg x 9", "30 sec" of "12". Lege velden nemen het voorstel over. */
export function setTekst(o: AppOefening, v: SetVeld | undefined, voorstel: { herh: string; tijd: string }, taal: Taal = 'nl'): string {
  const kg = v ? getal(v.kg) : null
  const maat = opTijd(o) ? `${v?.tijd || voorstel.tijd || '0'} sec` : v?.herh || voorstel.herh || '0'
  return kg !== null && kg > 0 ? `${komma(kg, taal)} kg x ${maat}` : maat
}

/** Hoort er een kiloveld bij: niet bij een oefening op tijd zonder gewicht. */
export function metKilo(o: AppOefening, h: OefeningHistorie | undefined): boolean {
  if (!opTijd(o)) return true
  return (o.gewichtKg ?? 0) > 0 || (h?.vorige?.sets ?? []).some((s) => (s.gewichtKg ?? 0) > 0)
}
