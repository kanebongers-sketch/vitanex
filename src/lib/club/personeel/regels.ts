// ─── Fit Factory Club, personeel: controleregels (PUUR) ─────────────────────
// Overlap, rust tussen diensten, beschikbaarheid, dekking binnen de bemande
// uren en geplande uren per week. Alles rekent met kloktijden op een datum.

import { isoWeekdag, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Beschikbaarheid, Dienst, Reden } from './typen'

/** Het minimale van een dienst dat de regels nodig hebben. */
export type Blok = Pick<Dienst, 'id' | 'datum' | 'begin' | 'eind' | 'medewerkerId' | 'uursoort'>

const DAG_MIN = 1440

/** Minimale rust tussen twee diensten (Arbeidstijdenwet: 11 uur). */
export const MIN_RUST_UREN = 11

/** Dagnummer sinds 1970 (UTC-middag, dus zonder zomertijdgedoe). */
function dagNummer(datum: string): number {
  return Math.round(Date.parse(`${datum}T12:00:00Z`) / 86_400_000)
}

/** Een kloktijd op een datum als minuten op een doorlopende tijdlijn. */
export function absMinuut(datum: string, tijd: string): number {
  return dagNummer(datum) * DAG_MIN + tijdNaarMinuten(tijd)
}

export function duurMin(begin: string, eind: string): number {
  return Math.max(0, tijdNaarMinuten(eind) - tijdNaarMinuten(begin))
}

/** Telt deze dienst mee als werk van een persoon (niet open, niet ziek of verlof)? */
export function isWerk(d: Pick<Blok, 'medewerkerId' | 'uursoort'>): boolean {
  return d.medewerkerId !== null && d.uursoort === 'werk'
}

export interface Overlap {
  medewerkerId: string
  a: string
  b: string
}

/** Diensten van dezelfde persoon die elkaar overlappen. */
export function vindOverlap(diensten: readonly Blok[]): Overlap[] {
  const uit: Overlap[] = []
  const werk = diensten.filter(isWerk)
  for (let i = 0; i < werk.length; i++) {
    for (let j = i + 1; j < werk.length; j++) {
      const a = werk[i]
      const b = werk[j]
      if (a.medewerkerId !== b.medewerkerId || a.datum !== b.datum) continue
      if (a.begin < b.eind && b.begin < a.eind) uit.push({ medewerkerId: a.medewerkerId ?? '', a: a.id, b: b.id })
    }
  }
  return uit
}

export interface RustTekort {
  medewerkerId: string
  eerste: string
  tweede: string
  rustMin: number
}

/** Te weinig rust tussen twee opeenvolgende diensten (standaard 11 uur). */
export function vindRustTekort(diensten: readonly Blok[], minUren = 11): RustTekort[] {
  const perPersoon = new Map<string, Blok[]>()
  for (const d of diensten.filter(isWerk)) {
    const id = d.medewerkerId ?? ''
    perPersoon.set(id, [...(perPersoon.get(id) ?? []), d])
  }
  const uit: RustTekort[] = []
  for (const [id, lijst] of perPersoon) {
    const gesorteerd = [...lijst].sort((a, b) => absMinuut(a.datum, a.begin) - absMinuut(b.datum, b.begin))
    for (let i = 1; i < gesorteerd.length; i++) {
      const vorige = gesorteerd[i - 1]
      const deze = gesorteerd[i]
      if (vorige.datum === deze.datum) continue // zelfde dag: een gesplitste dienst, geen nachtrust
      const rust = absMinuut(deze.datum, deze.begin) - absMinuut(vorige.datum, vorige.eind)
      if (rust >= 0 && rust < minUren * 60) uit.push({ medewerkerId: id, eerste: vorige.id, tweede: deze.id, rustMin: rust })
    }
  }
  return uit
}

export type BeschikbaarUitkomst =
  | { status: 'ja' }
  | { status: 'onbekend' }
  | { status: 'deels'; tekst: string }
  | { status: 'nee'; tekst: string; reden: Reden | null }

function valtOpDatum(b: Beschikbaarheid, datum: string): boolean {
  if (!b.datum) return false
  return datum >= b.datum && datum <= (b.datumTot ?? b.datum)
}

function binnen(b: Beschikbaarheid, begin: string, eind: string): boolean {
  return (b.van === null || begin >= b.van) && (b.tot === null || eind <= b.tot)
}

function tijdTekst(b: Beschikbaarheid): string {
  return b.van && b.tot ? `${b.van} tot ${b.tot}` : b.van ? `vanaf ${b.van}` : b.tot ? `tot ${b.tot}` : 'de hele dag'
}

/**
 * Kan deze persoon op deze datum van begin tot eind werken?
 * Losse datums gaan voor de vaste weekdag. Niets bekend = 'onbekend' (mag).
 */
export function beschikbaarheidVoor(
  medewerkerId: string,
  datum: string,
  begin: string,
  eind: string,
  alle: readonly Beschikbaarheid[],
): BeschikbaarUitkomst {
  const eigen = alle.filter((b) => b.medewerkerId === medewerkerId)
  const losse = eigen.filter((b) => valtOpDatum(b, datum))
  const regels = losse.length > 0 ? losse : eigen.filter((b) => b.weekdag === isoWeekdag(datum))
  if (regels.length === 0) return { status: 'onbekend' }
  const nee = regels.find((b) => !b.beschikbaar)
  if (nee) {
    const wat = nee.reden ? nee.reden : nee.datum ? 'niet beschikbaar' : 'vast niet beschikbaar'
    return { status: 'nee', tekst: nee.notitie ? `${wat}: ${nee.notitie}` : wat, reden: nee.reden }
  }
  if (regels.some((b) => binnen(b, begin, eind))) return { status: 'ja' }
  return { status: 'deels', tekst: `beschikbaar ${regels.map(tijdTekst).join(' of ')}` }
}

export interface Segment {
  van: number
  tot: number
  aantal: number
}

/**
 * De bezetting binnen een tijdvak (minuten van de dag): opeenvolgende stukken
 * met het aantal mensen dat er dan werkt. Een stuk met 0 is een gat.
 */
export function dekking(diensten: readonly Blok[], van: number, tot: number): Segment[] {
  if (tot <= van) return []
  const werk = diensten.filter(isWerk)
  const grenzen = new Set<number>([van, tot])
  for (const d of werk) {
    for (const m of [tijdNaarMinuten(d.begin), tijdNaarMinuten(d.eind)]) if (m > van && m < tot) grenzen.add(m)
  }
  const punten = [...grenzen].sort((a, b) => a - b)
  const uit: Segment[] = []
  for (let i = 1; i < punten.length; i++) {
    const s = punten[i - 1]
    const e = punten[i]
    const mensen = new Set(werk.filter((d) => tijdNaarMinuten(d.begin) <= s && tijdNaarMinuten(d.eind) >= e).map((d) => d.medewerkerId))
    const vorige = uit[uit.length - 1]
    if (vorige && vorige.aantal === mensen.size) uit[uit.length - 1] = { ...vorige, tot: e }
    else uit.push({ van: s, tot: e, aantal: mensen.size })
  }
  return uit
}

/** Alleen de gaten (niemand aan het werk) binnen het tijdvak. */
export function gaten(diensten: readonly Blok[], van: number, tot: number): Segment[] {
  return dekking(diensten, van, tot).filter((s) => s.aantal === 0)
}

/** Geplande werkminuten per medewerker. */
export function geplandPerPersoon(diensten: readonly Blok[]): Map<string, number> {
  const uit = new Map<string, number>()
  for (const d of diensten.filter(isWerk)) {
    const id = d.medewerkerId ?? ''
    uit.set(id, (uit.get(id) ?? 0) + duurMin(d.begin, d.eind))
  }
  return uit
}

export type UrenOordeel = 'goed' | 'te_veel' | 'te_weinig' | 'geen_contract'

/** Geplande uren tegenover contracturen; een marge van een uur telt als goed. */
export function urenOordeel(geplandMin: number, contractUren: number | null, margeMin = 60): UrenOordeel {
  if (contractUren === null) return 'geen_contract'
  const verschil = geplandMin - contractUren * 60
  if (verschil > margeMin) return 'te_veel'
  if (verschil < -margeMin) return 'te_weinig'
  return 'goed'
}
