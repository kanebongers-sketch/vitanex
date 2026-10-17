// ─── Club, challenges: wat de ledenapp toont (PUUR) ─────────────────────────
// Per lid: de challenges voor zijn vestiging (lopend, gepland en kort geleden
// afgelopen), de eigen voortgang, een ranglijst met alleen privacynamen en de
// badges. Volledige namen gaan nooit naar de app.

import type { Badge } from './badges'
import type { Challenge, ChallengeSoort, Deelname } from './model'
import { dagenTeGaan, dagenTussen, doetMee, geldtVoor, laatsteDag, statusVan, type ChallengeStatus } from './periode'
import { fractie, gehaaldOp, scoreVoor, type Stand } from './voortgang'

/** Zo lang blijft een afgelopen challenge in de app staan (met de uitslag). */
export const RECENT_AFGELOPEN_DAGEN = 14
/** Zoveel plekken van de ranglijst; het lid zelf staat er altijd bij. */
export const RANGLIJST_TOP = 5

export interface AppStand {
  naam: string
  score: number
  positie: number
  isIk: boolean
}

export interface AppChallenge {
  id: string
  titel: string
  uitleg: string | null
  soort: ChallengeSoort
  doel: number
  start: string
  eind: string
  status: ChallengeStatus
  deelname: Deelname
  /** Telt dit lid mee (automatisch, of ingeschreven)? */
  doetMee: boolean
  score: number
  /** 0 tot en met 1. */
  fractie: number
  gehaaldOp: string | null
  dagenTeGaan: number
  /** null = ranglijst uit of (nog) niet beschikbaar. */
  ranglijst: AppStand[] | null
}

export interface LedenappChallengesData {
  lidId: string
  challenges: AppChallenge[]
  badges: Badge[]
  /** Wat niet gelezen kon worden, voor een nette melding. */
  fouten: string[]
}

export type MomentenPerSoort = Readonly<Record<ChallengeSoort, readonly string[]>>

/** Momenten per soort: weken op rij rekent met bezoeken. */
export function momentenVoor(soort: ChallengeSoort, m: { bezoeken: readonly string[]; trainingen: readonly string[]; lessen: readonly string[] }): readonly string[] {
  if (soort === 'trainingen') return m.trainingen
  if (soort === 'lessen') return m.lessen
  return m.bezoeken
}

/** Komt deze challenge in de app van een lid van deze vestiging? */
export function toonInApp(c: Challenge, vestiging: string, vandaag: string): boolean {
  if (!c.zichtbaarApp || !geldtVoor(c, vestiging)) return false
  if (statusVan(c, vandaag) !== 'afgelopen') return true
  return dagenTussen(laatsteDag(c), vandaag) <= RECENT_AFGELOPEN_DAGEN + 1
}

/** De top van de ranglijst, plus het lid zelf als dat er niet in staat. */
export function ranglijstVoorApp(stand: readonly Stand[], lidId: string, top = RANGLIJST_TOP): AppStand[] {
  const naarApp = (s: Stand): AppStand => ({ naam: s.naam, score: s.score, positie: s.positie, isIk: s.lidId === lidId })
  const bovenaan = stand.slice(0, top).filter((s) => s.score > 0 || s.lidId === lidId).map(naarApp)
  const ik = stand.find((s) => s.lidId === lidId)
  return ik && !bovenaan.some((s) => s.isIk) ? [...bovenaan, naarApp(ik)] : bovenaan
}

export function appChallenge(c: Challenge, lid: { id: string; vestiging: string }, ingeschreven: boolean, momenten: readonly string[], vandaag: string, stand: readonly Stand[] | null): AppChallenge {
  const mee = doetMee(c, lid, ingeschreven)
  const score = mee ? scoreVoor(c, momenten) : 0
  return {
    id: c.id,
    titel: c.titel,
    uitleg: c.uitleg,
    soort: c.soort,
    doel: c.doel,
    start: c.start,
    eind: laatsteDag(c),
    status: statusVan(c, vandaag),
    deelname: c.deelname,
    doetMee: mee,
    score,
    fractie: fractie(score, c.doel),
    gehaaldOp: mee ? gehaaldOp(c, momenten) : null,
    dagenTeGaan: dagenTeGaan(c, vandaag),
    ranglijst: c.ranglijst && stand ? ranglijstVoorApp(stand, lid.id) : null,
  }
}

/** De dagen waarop dit lid een challenge haalde (voor de badge), over alle challenges van zijn vestiging. */
export function gehaaldeChallenges(lijst: readonly Challenge[], lid: { id: string; vestiging: string }, ingeschreven: ReadonlySet<string>, m: { bezoeken: readonly string[]; trainingen: readonly string[]; lessen: readonly string[] }): string[] {
  return lijst
    .filter((c) => doetMee(c, lid, ingeschreven.has(c.id)))
    .map((c) => gehaaldOp(c, momentenVoor(c.soort, m)))
    .filter((d): d is string => d !== null)
}

/** Volgorde in de app: lopend, dan gepland, dan afgelopen. */
export function sorteerApp(lijst: readonly AppChallenge[]): AppChallenge[] {
  const rang: Record<ChallengeStatus, number> = { lopend: 0, gepland: 1, afgelopen: 2 }
  return [...lijst].sort((a, b) => rang[a.status] - rang[b.status] || a.eind.localeCompare(b.eind))
}
