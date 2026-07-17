// ─── LifeOS — welke taak doe ik nú? ─────────────────────────────────────────
// Het antwoord op de enige vraag die een takenlijst moet beantwoorden. Todoist
// laat je zelf sorteren; dat is precies de arbeid die je wilde uitbesteden.
//
// PUUR: geen fetch, geen DB, geen React, geen `Date.now()`. `nu` komt als
// argument binnen — zoals in `vita/signalen.ts`, en om dezelfde reden: een
// functie die zelf de klok leest is niet te testen.
//
// ─── DE REGEL VAN DIT BESTAND: nooit oordelen zonder feiten ─────────────────
//
//   Een taak zonder impact en zonder deadline krijgt hier GEEN score. Niet 50,
//   niet "midden" — `null`. De verleiding is groot om een ontbrekende impact als
//   3 te lezen zodat de formule altijd een getal oplevert, maar dan verzint dit
//   bestand een oordeel dat Kane nooit gaf, en presenteert het met dezelfde
//   stelligheid als een echt oordeel. Dat is de vorm van oneerlijkheid waar dit
//   product zich tegen verzet (zie .claude/CLAUDE.md → Eerlijkheid).
//
//   Dus: score = `null` betekent "ik weet het niet, vertel me meer", en de UI
//   toont dan wélk feit ontbreekt in plaats van een verzonnen positie in de lijst.
//
// ─── EN: de top-3 wint altijd ───────────────────────────────────────────────
//
//   De berekende score is een ADVIES. De top-3 (migratie 020) is Kane's WIL.
//   Als die twee botsen wint de wil — een systeem dat je overrulet omdat de
//   formule iets anders vindt, gebruik je twee weken. Daarom sorteert
//   `ordenTaken` de top-3 hard bovenaan en scoort het de rest eronder.

import type { Taak } from '@/lib/lifeos/taken/taken'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

/** Een feit dat een taak kan hebben — of missen. */
export type TaakFeit = 'impact' | 'deadline' | 'inspanning' | 'energie'

/** Hoeveel energie een taak vraagt. Allowlist, spiegelt migratie 100. */
export type EnergieNiveau = 'laag' | 'midden' | 'hoog'

export const ENERGIE_NIVEAUS: readonly EnergieNiveau[] = Object.freeze([
  'laag',
  'midden',
  'hoog',
])

export const MIN_IMPACT = 1
export const MAX_IMPACT = 5
export const MIN_INSPANNING = 1
/** 8 uur. Daarboven is het geen taak maar een project (zie migratie 100). */
export const MAX_INSPANNING = 480

/**
 * De weging van de twee signalen die een score maken. Ze tellen op tot 1, maar
 * alleen over de signalen die er ZIJN — ontbreekt de deadline, dan draagt impact
 * 100% van het oordeel in plaats van 40%. Zo verwatert een bekend feit niet door
 * een onbekend feit.
 */
const WEGING_DEADLINE = 0.6
const WEGING_IMPACT = 0.4

export interface TaakOordeel {
  taak: Taak
  /**
   * 0-100, of `null` als er te weinig bekend is. `null` is geen 0: een taak
   * zonder oordeel staat niet onderaan, hij staat apart.
   */
  score: number | null
  /** Waarom deze score, in leesbaar Nederlands. Voor de UI én voor Vita. */
  redenen: string[]
  /** Welke feiten ontbreken. Leeg = volledig beoordeeld. */
  ontbreekt: TaakFeit[]
  /** Staat deze taak in Kane's top-3 van vandaag? Dan wint hij van de score. */
  isTop3: boolean
}

// ─── Deadlinedruk ───────────────────────────────────────────────────────────

/**
 * Hoe hard duwt de deadline? Een trapfunctie, geen vloeiende curve — bewust.
 *
 * Een lineaire "dagen tot deadline"-schaal zegt dat 30 dagen twee keer zo
 * urgent is als 60. Dat is meetkundig waar en menselijk onzin: allebei voelen
 * als "later". Urgentie is een trap, geen helling. De sprongen staan waar ze
 * in de praktijk staan: vandaag, morgen, deze week, daarna.
 */
export function deadlineDruk(deadline: string, vandaagSleutel: string): number | null {
  const dagen = dagenTussen(vandaagSleutel, deadline)
  if (dagen === null) return null

  if (dagen < 0) return 100 // over tijd
  if (dagen === 0) return 95 // vandaag
  if (dagen === 1) return 75 // morgen
  if (dagen <= 3) return 55
  if (dagen <= 7) return 35
  if (dagen <= 30) return 15
  return 5
}

/** Hele dagen tussen twee dagsleutels (YYYY-MM-DD). `null` bij ongeldige invoer. */
export function dagenTussen(vanSleutel: string, totSleutel: string): number | null {
  const van = leesDatumSleutel(vanSleutel)
  const tot = leesDatumSleutel(totSleutel)
  if (van === null || tot === null) return null

  // `leesDatumSleutel` geeft een LOKALE Date op middernacht. Het verschil daarvan
  // rechtstreeks in milliseconden nemen gaat mis over een zomertijdgrens: die
  // nacht duurt 23 of 25 uur, en dan wordt een dag stilletjes 0 of 2. Daarom
  // lezen we de kalenderdag eruit en bouwen we 'm opnieuw als UTC — dan zijn alle
  // dagen exact 24 uur en klopt het verschil altijd.
  const vanMs = Date.UTC(van.getFullYear(), van.getMonth(), van.getDate())
  const totMs = Date.UTC(tot.getFullYear(), tot.getMonth(), tot.getDate())
  return Math.round((totMs - vanMs) / 86_400_000)
}

// ─── Impact ─────────────────────────────────────────────────────────────────

/** Impact 1-5 → 0-100. 1 = ruis (0), 5 = dit verandert iets (100). */
export function impactDruk(impact: number): number | null {
  if (!Number.isInteger(impact) || impact < MIN_IMPACT || impact > MAX_IMPACT) return null
  return ((impact - MIN_IMPACT) / (MAX_IMPACT - MIN_IMPACT)) * 100
}

// ─── Het oordeel ────────────────────────────────────────────────────────────

/** De velden die migratie 100 aan een taak toevoegt. */
export interface TaakFeiten {
  impact: number | null
  deadline: string | null
  inspanningMinuten: number | null
  energie: EnergieNiveau | null
}

/** Een taak plus de feiten eromheen. */
export type SlimmeTaak = Taak & TaakFeiten

function ontbrekendeFeiten(taak: SlimmeTaak): TaakFeit[] {
  const ontbreekt: TaakFeit[] = []
  if (taak.impact === null) ontbreekt.push('impact')
  if (taak.deadline === null) ontbreekt.push('deadline')
  if (taak.inspanningMinuten === null) ontbreekt.push('inspanning')
  if (taak.energie === null) ontbreekt.push('energie')
  return ontbreekt
}

/**
 * Beoordeelt één taak. `score: null` als geen enkel signaal bekend is — dan is
 * er niets te wegen en zou elk getal een verzinsel zijn.
 */
export function beoordeelTaak(
  taak: SlimmeTaak,
  vandaagSleutel: string,
): TaakOordeel {
  const redenen: string[] = []

  const deadlineScore =
    taak.deadline !== null ? deadlineDruk(taak.deadline, vandaagSleutel) : null
  const impactScore = taak.impact !== null ? impactDruk(taak.impact) : null

  if (deadlineScore !== null && taak.deadline !== null) {
    redenen.push(deadlineReden(taak.deadline, vandaagSleutel))
  }
  if (impactScore !== null && taak.impact !== null) {
    redenen.push(`Impact ${taak.impact} van ${MAX_IMPACT}.`)
  }
  if (taak.inspanningMinuten !== null) {
    redenen.push(`Kost ongeveer ${taak.inspanningMinuten} minuten.`)
  }

  const score = weegSignalen(deadlineScore, impactScore)
  if (score === null) {
    redenen.push('Geen impact en geen deadline — ik kan dit niet wegen.')
  }

  return {
    taak,
    score,
    redenen,
    ontbreekt: ontbrekendeFeiten(taak),
    isTop3: taak.top3Positie !== null && taak.datum === vandaagSleutel,
  }
}

/**
 * Weegt de beschikbare signalen, en herverdeelt het gewicht van een ontbrekend
 * signaal over de rest. Ontbreken ze allebei → `null`.
 */
function weegSignalen(deadlineScore: number | null, impactScore: number | null): number | null {
  if (deadlineScore === null && impactScore === null) return null
  if (deadlineScore === null) return afgerond(impactScore ?? 0)
  if (impactScore === null) return afgerond(deadlineScore)

  const gewogen = deadlineScore * WEGING_DEADLINE + impactScore * WEGING_IMPACT
  return afgerond(gewogen)
}

function afgerond(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function deadlineReden(deadline: string, vandaagSleutel: string): string {
  const dagen = dagenTussen(vandaagSleutel, deadline)
  if (dagen === null) return 'Deadline onleesbaar.'
  if (dagen < 0) {
    const over = Math.abs(dagen)
    return over === 1 ? 'Deadline was gisteren.' : `Deadline was ${over} dagen geleden.`
  }
  if (dagen === 0) return 'Deadline is vandaag.'
  if (dagen === 1) return 'Deadline is morgen.'
  return `Deadline over ${dagen} dagen.`
}

// ─── Ordenen ────────────────────────────────────────────────────────────────

/**
 * De lijst zoals hij op het scherm hoort. Drie lagen, in deze volgorde:
 *
 *   1. De top-3 van vandaag, op positie. Kane's wil — geen score raakt hieraan.
 *   2. Beoordeelde taken, hoogste score eerst.
 *   3. Taken zonder oordeel, nieuwste eerst. Niet onderaan omdat ze onbelangrijk
 *      zijn, maar omdat er niets over te zeggen valt tot je één feit invult.
 *
 * Puur en immutable: sorteert op een kopie.
 */
export function ordenTaken(
  taken: readonly SlimmeTaak[],
  vandaagSleutel: string,
): TaakOordeel[] {
  const oordelen = taken.map((t) => beoordeelTaak(t, vandaagSleutel))

  const top3 = oordelen
    .filter((o) => o.isTop3)
    .sort((a, b) => (a.taak.top3Positie ?? 9) - (b.taak.top3Positie ?? 9))

  const rest = oordelen.filter((o) => !o.isTop3)
  const beoordeeld = rest
    .filter((o) => o.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const zonderOordeel = rest
    .filter((o) => o.score === null)
    .sort((a, b) => b.taak.aangemaaktOp.localeCompare(a.taak.aangemaaktOp))

  return [...top3, ...beoordeeld, ...zonderOordeel]
}

// ─── Past het in de tijd die je hebt? ───────────────────────────────────────

/**
 * De taken die passen in een blok van `minuten`, hoogste score eerst.
 *
 * Een taak zonder tijdsinschatting doet NIET mee: we weten niet of hij past, en
 * "hij past vast wel" is precies de aanname waardoor je dag uitloopt. Hij
 * verdwijnt niet — hij staat in de lijst met "inspanning" als ontbrekend feit.
 */
export function passendInBlok(
  oordelen: readonly TaakOordeel[],
  minuten: number,
  energieNu: EnergieNiveau | null = null,
): TaakOordeel[] {
  return oordelen.filter((o) => {
    // Geen cast meer nodig: `Taak` draagt de vier feiten zelf sinds migratie 100
    // in het model landde. Stond hier een `as SlimmeTaak`, en dat is precies het
    // soort belofte dat blijft staan als het model eronder verandert.
    const taak = o.taak
    if (taak.klaar) return false
    if (taak.inspanningMinuten === null) return false
    if (taak.inspanningMinuten > minuten) return false
    if (energieNu !== null && !energiePast(taak.energie, energieNu)) return false
    return true
  })
}

/**
 * Past de gevraagde energie bij wat je nu hebt? Een taak zonder energie-label
 * past altijd — geen label is geen bezwaar, en een taak wegfilteren op een feit
 * dat niemand heeft ingevuld is erger dan hem tonen.
 *
 * De regel is asymmetrisch en dat is de bedoeling: met hoge energie mag je een
 * lage-energietaak doen (dat is alleen zonde), maar met lage energie een
 * hoge-energietaak inplannen is de klassieke planningsfout die je dag sloopt.
 */
export function energiePast(
  gevraagd: EnergieNiveau | null,
  beschikbaar: EnergieNiveau,
): boolean {
  if (gevraagd === null) return true
  return energieRang(gevraagd) <= energieRang(beschikbaar)
}

function energieRang(niveau: EnergieNiveau): number {
  if (niveau === 'laag') return 0
  if (niveau === 'midden') return 1
  return 2
}

// ─── Systeemgrens: de nieuwe velden lezen ───────────────────────────────────

export function isEnergieNiveau(v: unknown): v is EnergieNiveau {
  return v === 'laag' || v === 'midden' || v === 'hoog'
}

/** Impact uit onbekende invoer. `null` = niet opgegeven; een fout geeft `undefined`. */
export function leesImpact(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null
  if (!Number.isInteger(v)) return undefined
  const n = v as number
  if (n < MIN_IMPACT || n > MAX_IMPACT) return undefined
  return n
}

/** Inspanning in minuten uit onbekende invoer. Zelfde drie-statenmodel. */
export function leesInspanning(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null
  if (!Number.isInteger(v)) return undefined
  const n = v as number
  if (n < MIN_INSPANNING || n > MAX_INSPANNING) return undefined
  return n
}
