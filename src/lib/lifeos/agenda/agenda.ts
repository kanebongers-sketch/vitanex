// ─── LifeOS — agenda: vorm over de draad ────────────────────────────────────
// De vorm die de API teruggeeft en die de UI leest. Eén bestand, zodat server
// en client gegarandeerd hetzelfde bedoelen.
//
// Puur: geen fetch, geen DB, geen secrets. Dit bestand mag dus veilig in een
// client-component geïmporteerd worden.

import type { Afspraak, VrijBlok } from './vrije-blokken'

/** De bronnen die LifeOS kan lezen. Alleen lezen — nooit schrijven. */
export type AgendaBron = 'google_calendar'

export const GOOGLE_CALENDAR: AgendaBron = 'google_calendar'

/** Een afspraak zoals hij over de draad gaat: Date wordt ISO-string. */
export interface AfspraakJson {
  id: string
  titel: string | null
  startOp: string
  eindOp: string | null
  heleDag: boolean
  locatie: string | null
  /** De kleur van de agenda waaruit dit event komt (hex), of null. Kleurt het blok. */
  kleur?: string | null
}

export interface VrijBlokJson {
  startOp: string
  eindOp: string
  minuten: number
}

/**
 * Het antwoord van `GET /api/agenda/vandaag`.
 *
 * Let op de vorm: "niet gekoppeld" is een eigen tak, geen lege lijst. Een
 * `events: []` bij een niet-gekoppelde agenda zou de UI laten zeggen "geen
 * afspraken vandaag" terwijl LifeOS gewoon niet mag kijken. Dat is precies het
 * verschil tussen fout, leeg en niet-gekoppeld waar de README over gaat.
 */
export type AgendaVandaag =
  | { gekoppeld: false }
  | {
      gekoppeld: true
      /** Dagsleutel (YYYY-MM-DD, lokaal) waarop dit antwoord slaat. */
      dag: string
      /** Wanneer de cache voor het laatst gevuld is. null = nog nooit gesynct. */
      laatsteSync: string | null
      events: AfspraakJson[]
      /** De afspraak die nu loopt, of anders de eerstvolgende. */
      volgende: AfspraakJson | null
      vrijeBlokken: VrijBlokJson[]
    }

/**
 * Eén agenda in de weergave, zoals hij over de draad gaat. Structureel verwant
 * aan `GoogleKalender` (server, google.ts) plus de opgeslagen `zichtbaar`-vlag,
 * maar hier apart zodat de client die server-only module — met secrets en fetch —
 * nooit hoeft te importeren. Zelfde grens-patroon als `AfspraakJson` ↔ `GoogleAfspraak`.
 */
export interface KalenderJson {
  id: string
  naam: string
  /** Google's backgroundColor (hex), of null. De kleur van deze agenda. */
  kleur: string | null
  /** `owner`/`writer`/`reader`/`freeBusyReader`. Bepaalt of je erin mag schrijven. */
  toegang: string
  primair: boolean
  /** Wordt deze agenda getoond in de weergave? (het vinkje) */
  zichtbaar: boolean
}

/**
 * Het antwoord van `GET /api/lifeos/agenda/kalenders`.
 *
 * `kalenders` = ALLE agenda's (met kleur + zichtbaar-vlag) voor de weergave.
 * `schrijfDoel` = de agenda waar NIEUWE afspraken/focusblokken heen gaan (null =
 * de primaire agenda). Weergave-zichtbaarheid en schrijf-doel zijn bewust twee
 * verschillende dingen.
 */
export interface KalendersAntwoord {
  kalenders: KalenderJson[]
  schrijfDoel: string | null
}

/** De rollen waarin je in een agenda mag SCHRIJVEN. */
const SCHRIJFBARE_ROLLEN: ReadonlySet<string> = new Set(['owner', 'writer'])

/**
 * Mag je in een agenda met deze `toegang` schrijven? Client-veilig (puur), zodat
 * de schrijf-doel-kiezer de beschrijfbare agenda's kan filteren zonder de
 * server-only `google.ts` te importeren.
 */
export function isSchrijfbaar(toegang: string): boolean {
  return SCHRIJFBARE_ROLLEN.has(toegang)
}

/**
 * Het sein dat `/kalenders` teruggeeft als de calendarlist-scope ontbreekt (een
 * koppeling van vóór functie 2). De server zet 'm in `fout`, de UI herkent 'm en
 * toont dan een "opnieuw koppelen"-knop i.p.v. een kale foutmelding. Eén bron voor
 * server én client zodat de string niet uit elkaar loopt.
 */
export const OPNIEUW_KOPPELEN = 'opnieuw_koppelen'

export function naarAfspraakJson(a: Afspraak): AfspraakJson {
  return {
    id: a.id,
    titel: a.titel,
    startOp: a.startOp.toISOString(),
    eindOp: a.eindOp ? a.eindOp.toISOString() : null,
    heleDag: a.heleDag,
    locatie: a.locatie,
    kleur: a.kleur ?? null,
  }
}

export function naarVrijBlokJson(b: VrijBlok): VrijBlokJson {
  return {
    startOp: b.startOp.toISOString(),
    eindOp: b.eindOp.toISOString(),
    minuten: b.minuten,
  }
}

/** Terug naar Date, voor de UI. */
export function vanAfspraakJson(j: AfspraakJson): Afspraak {
  return {
    id: j.id,
    titel: j.titel,
    startOp: new Date(j.startOp),
    eindOp: j.eindOp ? new Date(j.eindOp) : null,
    heleDag: j.heleDag,
    locatie: j.locatie,
    kleur: j.kleur ?? null,
  }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────
// Supabase geeft `unknown`-achtige data terug. We narrowen hier in plaats van te
// casten: een kolomwijziging levert dan een overgeslagen rij op, geen Invalid
// Date die door de hele app lekt.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

function moment(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Eén rij uit `agenda_events` → een afspraak, of null als de rij onbruikbaar is. */
export function afspraakVanRij(rij: unknown): Afspraak | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const startOp = moment(rij.start_op)
  if (id === null || startOp === null) return null

  return {
    id,
    titel: tekst(rij.titel),
    startOp,
    eindOp: moment(rij.eind_op),
    heleDag: rij.hele_dag === true,
    locatie: tekst(rij.locatie),
    kleur: tekst(rij.kleur),
  }
}

export function afsprakenVanRijen(rijen: readonly unknown[]): Afspraak[] {
  return rijen.map(afspraakVanRij).filter((a): a is Afspraak => a !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// Ook onze eigen server is een grens. Een `as AgendaVandaag` zou werken tot
// iemand het antwoord verandert; dan crasht de UI ergens diep in een render in
// plaats van netjes te zeggen dat er iets niet klopt.

function leesAfspraakJson(ruw: unknown): AfspraakJson | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const startOp = tekst(ruw.startOp)
  if (id === null || startOp === null) return null

  return {
    id,
    titel: tekst(ruw.titel),
    startOp,
    eindOp: tekst(ruw.eindOp),
    heleDag: ruw.heleDag === true,
    locatie: tekst(ruw.locatie),
    kleur: tekst(ruw.kleur),
  }
}

function leesVrijBlokJson(ruw: unknown): VrijBlokJson | null {
  if (!isObject(ruw)) return null

  const startOp = tekst(ruw.startOp)
  const eindOp = tekst(ruw.eindOp)
  const minuten = ruw.minuten
  if (startOp === null || eindOp === null) return null
  if (typeof minuten !== 'number' || !Number.isFinite(minuten)) return null

  return { startOp, eindOp, minuten }
}

/** Het antwoord van `GET /api/agenda/vandaag`, of null als het niet klopt. */
export function leesAgendaVandaag(ruw: unknown): AgendaVandaag | null {
  if (!isObject(ruw)) return null

  if (ruw.gekoppeld === false) return { gekoppeld: false }
  if (ruw.gekoppeld !== true) return null

  const dag = tekst(ruw.dag)
  if (dag === null) return null
  if (!Array.isArray(ruw.events) || !Array.isArray(ruw.vrijeBlokken)) return null

  const events = ruw.events.map(leesAfspraakJson)
  const blokken = ruw.vrijeBlokken.map(leesVrijBlokJson)
  // Eén kapot item = een kapot antwoord. Stil overslaan zou een afspraak laten
  // verdwijnen zonder dat iemand het merkt.
  if (events.some((e) => e === null) || blokken.some((b) => b === null)) return null

  // `volgende` mag ontbreken (geen eerstvolgende afspraak) → null. Maar is 'ie
  // AANWEZIG en kapot, dan geldt dezelfde regel als hierboven: een echte
  // eerstvolgende afspraak die één veld mist, hoort niet stil te verdwijnen. Dat
  // schond de eigen invariant van deze functie.
  const geenVolgende = ruw.volgende === null || ruw.volgende === undefined
  const volgende = geenVolgende ? null : leesAfspraakJson(ruw.volgende)
  if (!geenVolgende && volgende === null) return null

  return {
    gekoppeld: true,
    dag,
    laatsteSync: tekst(ruw.laatsteSync),
    events: events.filter((e): e is AfspraakJson => e !== null),
    volgende,
    vrijeBlokken: blokken.filter((b): b is VrijBlokJson => b !== null),
  }
}

function leesKalenderJson(ruw: unknown): KalenderJson | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const naam = tekst(ruw.naam)
  if (id === null || naam === null) return null

  return {
    id,
    naam,
    kleur: tekst(ruw.kleur),
    toegang: tekst(ruw.toegang) ?? '',
    primair: ruw.primair === true,
    // Ontbrekend of niet-strikt-false → zichtbaar. Een agenda hoort standaard te
    // verschijnen; alleen een expliciete `false` verbergt 'm.
    zichtbaar: ruw.zichtbaar !== false,
  }
}

/**
 * Het antwoord van `GET /api/lifeos/agenda/kalenders`, of null als het niet klopt.
 *
 * Eén kapotte agenda = een kapot antwoord (zelfde regel als `leesAgendaVandaag`):
 * stil overslaan zou een agenda uit de weergave laten verdwijnen zonder dat iemand
 * het merkt. `schrijfDoel` mag ontbreken → null (dan staat de primaire agenda voor).
 */
export function leesKalendersAntwoord(ruw: unknown): KalendersAntwoord | null {
  if (!isObject(ruw)) return null
  if (!Array.isArray(ruw.kalenders)) return null

  const kalenders = ruw.kalenders.map(leesKalenderJson)
  if (kalenders.some((k) => k === null)) return null

  return {
    kalenders: kalenders.filter((k): k is KalenderJson => k !== null),
    schrijfDoel: tekst(ruw.schrijfDoel),
  }
}
