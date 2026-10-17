// ─── Club, challenges: voortgang en ranglijst (PUUR) ────────────────────────
// Momenten (ISO) per lid gaan erin: check-ins, afgevinkte trainingen of
// aanwezige groepslessen, al naar gelang de soort. Weken lopen van maandag
// tot en met zondag (Nederlandse tijd). De ranglijst toont alleen voornaam en
// de eerste letter van de achternaam (privacy).

import { weekStart } from '@/lib/club/training/weergave'
import type { Challenge } from './model'
import { inPeriode, nlDatum } from './periode'

type Periode = Pick<Challenge, 'start' | 'eind' | 'gestoptOp'>

function vorigeWeek(maandag: string): string {
  const d = new Date(`${maandag}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

/** Unieke weken (maandag) met minstens een moment, oplopend, met het eerste moment van die week. */
function wekenMetEerste(ops: readonly string[]): { week: string; eerste: string }[] {
  const per = new Map<string, string>()
  for (const op of ops) {
    const w = weekStart(op)
    const oud = per.get(w)
    if (!oud || op < oud) per.set(w, op)
  }
  return [...per.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, eerste]) => ({ week, eerste }))
}

/**
 * Loopt de weken langs en geeft per week de lengte van de reeks tot en met die
 * week. De basis voor de langste reeks en voor "wanneer was de reeks van N er".
 */
function reeksen(ops: readonly string[]): { week: string; eerste: string; lengte: number }[] {
  return wekenMetEerste(ops).reduce<{ week: string; eerste: string; lengte: number }[]>((uit, w, i) => {
    const doorgaand = i > 0 && uit[i - 1].week === vorigeWeek(w.week)
    return [...uit, { ...w, lengte: doorgaand ? uit[i - 1].lengte + 1 : 1 }]
  }, [])
}

/** De langste reeks weken op rij met minstens een moment. */
export function langsteReeks(ops: readonly string[]): number {
  return reeksen(ops).reduce((max, w) => Math.max(max, w.lengte), 0)
}

/** Het eerste moment waarop een reeks van `n` weken op rij rond was, of null. */
export function reeksBehaaldOp(ops: readonly string[], n: number): string | null {
  return reeksen(ops).find((w) => w.lengte >= n)?.eerste ?? null
}

function binnen(c: Periode, ops: readonly string[]): string[] {
  return ops.filter((op) => inPeriode(c, op)).sort()
}

/** De score van een lid binnen de periode: een aantal, of de langste reeks weken. */
export function scoreVoor(c: Periode & Pick<Challenge, 'soort'>, ops: readonly string[]): number {
  const hier = binnen(c, ops)
  return c.soort === 'weken_op_rij' ? langsteReeks(hier) : hier.length
}

/** De dag (yyyy-mm-dd) waarop het doel gehaald werd, of null. */
export function gehaaldOp(c: Periode & Pick<Challenge, 'soort' | 'doel'>, ops: readonly string[]): string | null {
  const hier = binnen(c, ops)
  const moment = c.soort === 'weken_op_rij' ? reeksBehaaldOp(hier, c.doel) : (hier[c.doel - 1] ?? null)
  return moment ? nlDatum(moment) : null
}

/** Hoe ver, 0 tot en met 1. */
export function fractie(score: number, doel: number): number {
  return doel > 0 ? Math.max(0, Math.min(1, score / doel)) : 0
}

const TUSSENVOEGSELS = new Set(['van', 'de', 'der', 'den', 'het', 'ter', 'ten', 'te', 'in', "'t", 't', 'op', 'la', 'le', 'du', 'von', 'vd', 'v.d.'])

/** "Sanne V." voor Sanne van Vliet: voornaam plus de eerste letter van de achternaam zelf. */
export function privacyNaam(voornaam: string, achternaam: string): string {
  const delen = achternaam.trim().split(/\s+/).filter(Boolean)
  const kern = delen.find((d) => !TUSSENVOEGSELS.has(d.toLowerCase())) ?? delen[delen.length - 1] ?? ''
  const letter = kern.charAt(0).toUpperCase()
  const voor = voornaam.trim().split(/\s+/)[0] ?? ''
  return letter ? `${voor} ${letter}.` : voor
}

export interface Deelnemer {
  lidId: string
  voornaam: string
  achternaam: string
}

export interface Stand {
  lidId: string
  /** Altijd de privacynaam; de beheerpagina toont daarnaast de volledige naam. */
  naam: string
  volledigeNaam: string
  score: number
  gehaald: boolean
  /** Gelijke score = gelijke plek (1, 2, 2, 4). */
  positie: number
}

/** De stand: hoogste score eerst, bij gelijke score op naam. */
export function ranglijst(deelnemers: readonly Deelnemer[], scores: ReadonlyMap<string, number>, doel: number): Stand[] {
  const rijen = deelnemers
    .map((d) => ({ d, score: scores.get(d.lidId) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.d.voornaam.localeCompare(b.d.voornaam, 'nl') || a.d.achternaam.localeCompare(b.d.achternaam, 'nl'))
  const eersteVan = new Map<number, number>()
  rijen.forEach((r, i) => {
    if (!eersteVan.has(r.score)) eersteVan.set(r.score, i + 1)
  })
  return rijen.map(({ d, score }) => ({
    lidId: d.lidId,
    naam: privacyNaam(d.voornaam, d.achternaam),
    volledigeNaam: `${d.voornaam} ${d.achternaam}`,
    score,
    gehaald: score >= doel,
    positie: eersteVan.get(score) ?? 1,
  }))
}

/** Momenten per lid groeperen (lidId, op). */
export function perLid(rijen: readonly { lidId: string; op: string }[]): Map<string, string[]> {
  const uit = new Map<string, string[]>()
  for (const r of rijen) {
    const lijst = uit.get(r.lidId)
    if (lijst) lijst.push(r.op)
    else uit.set(r.lidId, [r.op])
  }
  return uit
}

export interface Samenvatting {
  deelnemers: number
  actief: number
  gehaald: number
  /** Gemiddelde score van wie minstens een keer scoorde, op een decimaal. */
  gemiddeld: number
}

export function vatSamen(stand: readonly Stand[]): Samenvatting {
  const actief = stand.filter((s) => s.score > 0)
  const som = actief.reduce((t, s) => t + s.score, 0)
  return {
    deelnemers: stand.length,
    actief: actief.length,
    gehaald: stand.filter((s) => s.gehaald).length,
    gemiddeld: actief.length ? Math.round((som / actief.length) * 10) / 10 : 0,
  }
}
