// ─── Club, afspraken: vrije tijdsloten (PUUR) ───────────────────────────────
// Wanneer kan een trainer een afspraak geven? Binnen de openingstijden van de
// vestiging, binnen zijn beschikbaarheid (club_beschikbaarheid, dezelfde als
// voor het personeelsrooster), en niet over een bestaande afspraak (plus de
// buffer), een les die hij geeft of een blok "geen afspraken" heen.
// Alle tijden zijn minuten op de Nederlandse klok van een dag.

import type { Openingstijd } from '@/lib/club/rooster/openingstijden'
import { isoWeekdag, minutenNaarTijd, nlDelen, nlNaarUtc, plusDagen, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Beschikbaarheid } from '@/lib/club/personeel/typen'

/** Een stuk van de dag in minuten: van (inclusief) tot (exclusief). */
export interface Venster {
  van: number
  tot: number
}

/** Om de hoeveel minuten een afspraak kan beginnen. */
export const STAP_MIN = 15

const DAG_MIN = 24 * 60

function valtOpDatum(b: Beschikbaarheid, datum: string): boolean {
  return b.datum !== null && datum >= b.datum && datum <= (b.datumTot ?? b.datum)
}

/** Vensters op volgorde en samengevoegd waar ze elkaar raken. */
export function voegSamen(lijst: readonly Venster[]): Venster[] {
  const gesorteerd = lijst.filter((v) => v.tot > v.van).sort((a, b) => a.van - b.van)
  return gesorteerd.reduce<Venster[]>((uit, v) => {
    const laatste = uit[uit.length - 1]
    if (laatste && v.van <= laatste.tot) return [...uit.slice(0, -1), { van: laatste.van, tot: Math.max(laatste.tot, v.tot) }]
    return [...uit, v]
  }, [])
}

/**
 * Wanneer werkt deze medewerker op deze dag, binnen de openingstijden?
 * Losse datums gaan voor de vaste weekdag (net als in het personeelsrooster).
 * Niets ingesteld = de hele openingstijd. "Niet beschikbaar" = de hele dag niet.
 */
export function werkvensters(
  medewerkerId: string,
  datum: string,
  opening: Openingstijd | null,
  beschikbaarheid: readonly Beschikbaarheid[],
): Venster[] {
  if (!opening) return []
  const open = { van: tijdNaarMinuten(opening.van), tot: tijdNaarMinuten(opening.tot) }
  const eigen = beschikbaarheid.filter((b) => b.medewerkerId === medewerkerId)
  const losse = eigen.filter((b) => valtOpDatum(b, datum))
  const regels = losse.length > 0 ? losse : eigen.filter((b) => b.weekdag === isoWeekdag(datum))
  if (regels.length === 0) return [open]
  if (regels.some((b) => !b.beschikbaar)) return []
  return voegSamen(
    regels.map((b) => ({
      van: Math.max(open.van, b.van ? tijdNaarMinuten(b.van) : open.van),
      tot: Math.min(open.tot, b.tot ? tijdNaarMinuten(b.tot) : open.tot),
    })),
  )
}

/**
 * Een bezette periode (ISO-tijdstippen) als minuten op deze dag; buiten de dag
 * = null. Loopt hij over middernacht, dan telt alleen het deel op deze dag.
 */
export function blokOpDag(datum: string, startIso: string, totIso: string): Venster | null {
  const start = new Date(startIso)
  const tot = new Date(totIso)
  const dagBegin = nlNaarUtc(datum, '00:00').getTime()
  const dagEind = nlNaarUtc(plusDagen(datum, 1), '00:00').getTime()
  if (tot.getTime() <= dagBegin || start.getTime() >= dagEind) return null
  const s = nlDelen(start)
  const e = nlDelen(tot)
  const van = s.datum < datum ? 0 : s.datum > datum ? DAG_MIN : s.minuten
  const eind = e.datum > datum ? DAG_MIN : e.datum < datum ? 0 : e.minuten
  return eind > van ? { van, tot: eind } : null
}

/** Een blok uit kloktijden (null = de hele dag), bijv. "geen afspraken" in het rooster. */
export function blokUitTijden(van: string | null, tot: string | null): Venster {
  return { van: van ? tijdNaarMinuten(van) : 0, tot: tot ? tijdNaarMinuten(tot) : DAG_MIN }
}

export interface SlotInvoer {
  datum: string
  duurMin: number
  bufferMin: number
  /** Wanneer de medewerker werkt (zie werkvensters). */
  vensters: readonly Venster[]
  /** Wat al bezet is (afspraken met buffer, lessen, blokken). */
  bezet: readonly Venster[]
  /** Vroegst toegestane start; null = geen grens. */
  vanaf: Date | null
  /** Laatst toegestane start; null = geen grens. */
  tot?: Date | null
  stapMin?: number
}

function overlapt(a: Venster, b: Venster): boolean {
  return a.van < b.tot && b.van < a.tot
}

/** Kan een afspraak om `start` (minuten) beginnen? */
function past(start: number, inv: SlotInvoer): boolean {
  const eind = start + inv.duurMin
  if (!inv.vensters.some((v) => start >= v.van && eind <= v.tot)) return false
  const bezetTot = eind + inv.bufferMin
  // Een buffer na afloop mag niet over de volgende afspraak heen; wel na sluiten.
  if (inv.bezet.some((b) => overlapt({ van: start, tot: bezetTot }, b))) return false
  const moment = nlNaarUtc(inv.datum, minutenNaarTijd(start)).getTime()
  if (inv.vanaf && moment < inv.vanaf.getTime()) return false
  if (inv.tot && moment > inv.tot.getTime()) return false
  return true
}

/** De vrije begintijden ("09:15") op deze dag, op volgorde. */
export function vrijeTijden(inv: SlotInvoer): string[] {
  const stap = Math.max(5, inv.stapMin ?? STAP_MIN)
  const uit = new Set<number>()
  for (const v of inv.vensters) {
    for (let s = Math.ceil(v.van / stap) * stap; s + inv.duurMin <= v.tot; s += stap) {
      if (past(s, inv)) uit.add(s)
    }
  }
  return [...uit].sort((a, b) => a - b).map(minutenNaarTijd)
}

/** Is deze ene begintijd vrij? (controle bij het opslaan) */
export function isVrij(tijd: string, inv: SlotInvoer): boolean {
  return past(tijdNaarMinuten(tijd), inv)
}

export interface Kandidaat {
  medewerkerId: string
  tijden: readonly string[]
  /** Hoeveel afspraken de medewerker die dag al heeft: de rustigste krijgt de nieuwe. */
  aantalOpDag: number
}

export interface Slot {
  tijd: string
  medewerkerId: string
}

/**
 * "Maakt niet uit": alle vrije tijden van alle trainers samen. Kunnen er
 * meerdere op hetzelfde moment, dan krijgt wie die dag het minst heeft hem
 * (bij gelijkspel de eerste in de lijst).
 */
export function combineer(kandidaten: readonly Kandidaat[]): Slot[] {
  const perTijd = new Map<string, Kandidaat>()
  for (const k of kandidaten) {
    for (const tijd of k.tijden) {
      const huidig = perTijd.get(tijd)
      if (!huidig || k.aantalOpDag < huidig.aantalOpDag) perTijd.set(tijd, k)
    }
  }
  return [...perTijd.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tijd, k]) => ({ tijd, medewerkerId: k.medewerkerId }))
}
