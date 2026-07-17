// ─── LifeOS — de dagplanner ─────────────────────────────────────────────────
// Je agenda zegt wat je MOET (`agenda/vrije-blokken.ts` zegt wat er OVER is).
// Je takenlijst zegt wat je WILT (`prioriteit.ts` zegt wat het zwaarst weegt).
// Dit bestand legt die twee op elkaar: welke taak in welk gat.
//
// PUUR: geen fetch, geen DB, geen React, geen `Date.now()`. Blokken, taken en de
// dag komen als argument binnen — zelfde regel als in `vrije-blokken.ts` en
// `prioriteit.ts`, en om dezelfde reden: een planner die zelf de klok leest, is
// niet te testen.
//
// ─── DE REGEL VAN DIT BESTAND: liever niets plannen dan iets verzinnen ──────
//
//   Een taak zonder tijdsinschatting wordt NIET ingepland. Niet op "vast wel een
//   half uurtje", niet op een gemiddelde van je andere taken. Die aanname is
//   precies waardoor je dag uitloopt, en een plan dat uitloopt is erger dan geen
//   plan — want het eerste geloofde je.
//
//   Zo'n taak verdwijnt ook niet stilletjes: hij staat in `nietGeplaatst` mét de
//   reden, zodat de UI kan zeggen wélk feit ontbreekt in plaats van de taak weg
//   te laten. Zie .claude/CLAUDE.md → Eerlijkheid.
//
// ─── EN: de wil gaat vóór het advies ────────────────────────────────────────
//
//   De volgorde komt van `ordenTaken`, dus de top-3 krijgt als eerste een blok.
//   Ook als de formule iets anders het zwaarst vindt. Dat is geen bug.

import {
  energiePast,
  ordenTaken,
  passendInBlok,
  type EnergieNiveau,
  type TaakOordeel,
} from '@/lib/lifeos/taken/prioriteit'
import { groepeerTaken, leesTaakJson, type Taak } from '@/lib/lifeos/taken/taken'
import type { VrijBlok } from '@/lib/lifeos/agenda/vrije-blokken'

const MS_PER_MINUUT = 60_000

/** Waarom een taak geen plek kreeg. Elke reden is een feit, geen excuus. */
export type NietGeplaatstReden = 'geen-inspanning' | 'energie' | 'geen-ruimte'

export interface Inplanning {
  oordeel: TaakOordeel
  startOp: Date
  eindOp: Date
}

export interface NietGeplaatst {
  oordeel: TaakOordeel
  reden: NietGeplaatstReden
  /** Waarom niet, in gewoon Nederlands. Voor de UI én voor Vita. */
  uitleg: string
}

export interface Dagplan {
  /** De taken die een blok kregen, op volgorde van de dag. */
  inplanningen: Inplanning[]
  /** Wat er niet in paste, met de reden erbij. Nooit stil weggelaten. */
  nietGeplaatst: NietGeplaatst[]
  /** Minuten vrije ruimte die leeg bleven. */
  restMinuten: number
}

export interface DagplanOpties {
  vandaagSleutel: string
  /**
   * Hoeveel energie je nú hebt. Weglaten = niet op energie filteren.
   *
   * Bewust een parameter en geen berekening uit de klok: "om 22:00 heb je lage
   * energie" is een aanname over Kane die niemand gemeten heeft. Zeg je het
   * niet, dan filteren we er niet op — een taak wegfilteren op een feit dat
   * niemand invulde is erger dan hem tonen (zie `energiePast`).
   */
  energieNu?: EnergieNiveau | null
}

/**
 * Welke taken zijn vandaag überhaupt kandidaat?
 *
 * Vandaag + te laat + ooit. Wat je bewust voor een ándere dag hebt ingepland
 * blijft daar staan: dat is een beslissing die je al genomen hebt, en die mag een
 * planner niet stilletjes terugdraaien. "Ooit" doet wél mee — een lege dag mag
 * gevuld worden met werk dat klaarligt.
 */
export function kandidatenVoorVandaag(
  taken: readonly Taak[],
  vandaagSleutel: string,
): Taak[] {
  const groepen = groepeerTaken(taken, vandaagSleutel)
  return [...groepen.vandaag, ...groepen.teLaat, ...groepen.ooit]
}

/**
 * Het plan: welke taak in welk blok, en wat er overblijft — inclusief waarom.
 *
 * Greedy first-fit op volgorde van `ordenTaken`: de belangrijkste taak krijgt het
 * eerste blok waar hij in past. Niet optimaal in de zin van "maximaal gevulde
 * blokken" — en dat is de bedoeling. Een planner die je top-3-taak overslaat
 * omdat er twee kleine taken beter in het gat passen, optimaliseert het gat en
 * niet je dag.
 */
export function maakDagplan(
  taken: readonly Taak[],
  blokken: readonly VrijBlok[],
  opties: DagplanOpties,
): Dagplan {
  const energieNu = opties.energieNu ?? null
  const open = taken.filter((t) => !t.klaar)
  const oordelen = ordenTaken(open, opties.vandaagSleutel)

  const { inplanningen, geplaatst } = vulBlokken(blokken, oordelen, energieNu)

  return {
    inplanningen,
    nietGeplaatst: oordelen
      .filter((o) => !geplaatst.has(o.taak.id))
      .map((o) => verklaar(o, energieNu)),
    restMinuten: restMinuten(blokken, inplanningen),
  }
}

/**
 * Vult de blokken één voor één. Per blok pakken we net zo lang de best scorende
 * taak die in de resterende tijd past, tot er niets meer bij kan.
 */
function vulBlokken(
  blokken: readonly VrijBlok[],
  oordelen: readonly TaakOordeel[],
  energieNu: EnergieNiveau | null,
): { inplanningen: Inplanning[]; geplaatst: Set<string> } {
  const geplaatst = new Set<string>()
  const inplanningen: Inplanning[] = []

  for (const blok of blokken) {
    let cursor = blok.startOp.getTime()
    const eind = blok.eindOp.getTime()

    for (;;) {
      const over = Math.floor((eind - cursor) / MS_PER_MINUUT)
      const nog = oordelen.filter((o) => !geplaatst.has(o.taak.id))
      // `passendInBlok` doet het oordelen: geen tijdsinschatting → niet passend,
      // te groot → niet passend, verkeerde energie → niet passend. Wij kiezen
      // hier alleen de eerste (= hoogst geordende) die overblijft.
      const kandidaat = passendInBlok(nog, over, energieNu)[0]
      const duur = kandidaat?.taak.inspanningMinuten
      if (!kandidaat || duur === null || duur === undefined) break

      const startOp = new Date(cursor)
      const eindOp = new Date(cursor + duur * MS_PER_MINUUT)
      inplanningen.push({ oordeel: kandidaat, startOp, eindOp })
      geplaatst.add(kandidaat.taak.id)
      cursor = eindOp.getTime()
    }
  }

  return { inplanningen, geplaatst }
}

/**
 * Waarom kreeg deze taak geen plek? De volgorde is die van de eerlijkheid: eerst
 * wat WIJ niet weten (geen inschatting), dan wat NIET PAST (energie), en pas dan
 * de dag die vol zit. Anders krijgt een taak zonder inschatting te horen dat je
 * dag vol is — terwijl we hem nooit geprobeerd hebben.
 */
function verklaar(oordeel: TaakOordeel, energieNu: EnergieNiveau | null): NietGeplaatst {
  const { inspanningMinuten, energie } = oordeel.taak

  if (inspanningMinuten === null) {
    return {
      oordeel,
      reden: 'geen-inspanning',
      uitleg: 'Ik weet niet hoe lang dit duurt. Vul een tijdsinschatting in, dan plan ik het in.',
    }
  }
  if (energieNu !== null && energie !== null && !energiePast(energie, energieNu)) {
    return {
      oordeel,
      reden: 'energie',
      uitleg: `Dit vraagt ${energie} energie en je gaf ${energieNu} op. Bewaar het voor een beter moment.`,
    }
  }
  return {
    oordeel,
    reden: 'geen-ruimte',
    uitleg: `Er is geen vrij blok van ${inspanningMinuten} minuten meer over vandaag.`,
  }
}

/** Vrije minuten die leeg bleven. Puur afgeleid — nooit apart bijgehouden. */
function restMinuten(
  blokken: readonly VrijBlok[],
  inplanningen: readonly Inplanning[],
): number {
  const vrij = blokken.reduce((som, b) => som + b.minuten, 0)
  const gebruikt = inplanningen.reduce(
    (som, i) => som + Math.round((i.eindOp.getTime() - i.startOp.getTime()) / MS_PER_MINUUT),
    0,
  )
  return Math.max(0, vrij - gebruikt)
}

// ─── Vorm over de draad ─────────────────────────────────────────────────────
// Date wordt ISO-string. Eén bestand voor server en client, zodat beide
// gegarandeerd hetzelfde bedoelen — zelfde patroon als `agenda/agenda.ts`.

export interface InplanningJson {
  taak: Taak
  startOp: string
  eindOp: string
  score: number | null
  redenen: string[]
  isTop3: boolean
}

export interface NietGeplaatstJson {
  taak: Taak
  reden: NietGeplaatstReden
  uitleg: string
}

/**
 * Het antwoord van `GET /api/lifeos/taken/dagplan`.
 *
 * "Niet gekoppeld" is een eigen tak, geen leeg plan. Zonder agenda weten we niet
 * welke tijd je vrij hebt: dan is "geen ruimte" een leugen en "de hele dag vrij"
 * ook. Zelfde onderscheid als in `AgendaVandaag` — fout ≠ leeg ≠ onbekend.
 */
export type DagplanJson =
  | { gekoppeld: false }
  | {
      gekoppeld: true
      dag: string
      inplanningen: InplanningJson[]
      nietGeplaatst: NietGeplaatstJson[]
      restMinuten: number
    }

export function naarInplanningJson(i: Inplanning): InplanningJson {
  return {
    taak: i.oordeel.taak,
    startOp: i.startOp.toISOString(),
    eindOp: i.eindOp.toISOString(),
    score: i.oordeel.score,
    redenen: i.oordeel.redenen,
    isTop3: i.oordeel.isTop3,
  }
}

export function naarNietGeplaatstJson(n: NietGeplaatst): NietGeplaatstJson {
  return { taak: n.oordeel.taak, reden: n.reden, uitleg: n.uitleg }
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// Ook onze eigen server is een grens. Een `as DagplanJson` werkt tot iemand het
// antwoord verandert; dan crasht de UI diep in een render in plaats van netjes
// te zeggen dat er iets niet klopt.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isReden(v: unknown): v is NietGeplaatstReden {
  return v === 'geen-inspanning' || v === 'energie' || v === 'geen-ruimte'
}

function zinnen(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  return v.every((s): s is string => typeof s === 'string') ? [...v] : null
}

function moment(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return Number.isNaN(new Date(v).getTime()) ? null : v
}

function leesInplanningJson(ruw: unknown): InplanningJson | null {
  if (!isObject(ruw)) return null

  const taak = leesTaakJson(ruw.taak)
  const startOp = moment(ruw.startOp)
  const eindOp = moment(ruw.eindOp)
  const redenen = zinnen(ruw.redenen)
  if (taak === null || startOp === null || eindOp === null || redenen === null) return null

  // `score: null` is een geldig antwoord ("ik weet het niet"), maar een score die
  // géén getal én géén null is, is een kapot antwoord.
  const score = ruw.score
  if (score !== null && typeof score !== 'number') return null

  return { taak, startOp, eindOp, score, redenen, isTop3: ruw.isTop3 === true }
}

function leesNietGeplaatstJson(ruw: unknown): NietGeplaatstJson | null {
  if (!isObject(ruw)) return null

  const taak = leesTaakJson(ruw.taak)
  const uitleg = typeof ruw.uitleg === 'string' ? ruw.uitleg : null
  if (taak === null || uitleg === null || !isReden(ruw.reden)) return null

  return { taak, reden: ruw.reden, uitleg }
}

/** Het antwoord van `GET /api/lifeos/taken/dagplan`, of null als het niet klopt. */
export function leesDagplanAntwoord(ruw: unknown): DagplanJson | null {
  if (!isObject(ruw)) return null

  if (ruw.gekoppeld === false) return { gekoppeld: false }
  if (ruw.gekoppeld !== true) return null

  const dag = typeof ruw.dag === 'string' ? ruw.dag : null
  if (dag === null) return null
  if (!Array.isArray(ruw.inplanningen) || !Array.isArray(ruw.nietGeplaatst)) return null

  const restMinuten = ruw.restMinuten
  if (typeof restMinuten !== 'number' || !Number.isFinite(restMinuten)) return null

  const inplanningen = ruw.inplanningen.map(leesInplanningJson)
  const nietGeplaatst = ruw.nietGeplaatst.map(leesNietGeplaatstJson)
  // Eén kapot item = een kapot antwoord. Stil overslaan zou een taak uit je plan
  // laten verdwijnen zonder dat iemand het merkt — en dat is precies het soort
  // stilte waar dit product niet in gelooft.
  if (inplanningen.some((i) => i === null) || nietGeplaatst.some((n) => n === null)) return null

  return {
    gekoppeld: true,
    dag,
    inplanningen: inplanningen.filter((i): i is InplanningJson => i !== null),
    nietGeplaatst: nietGeplaatst.filter((n): n is NietGeplaatstJson => n !== null),
    restMinuten,
  }
}
