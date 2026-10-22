// ─── LifeOS | coachgesprekken verplaatsen naar "Coachgesprekken PT" (puur) ──
// PUUR. Geen fetch, geen DB. Kane zette de coachgesprekken jarenlang in zijn
// gekozen agenda, soms met de vaste titel en soms alleen met een naam ("Amey!",
// "Iris Team", "Amey en Iris"). Deze regels bepalen welke afspraken naar de agenda
// "Coachgesprekken PT" gaan en wat er met elk gebeurt:
//   verplaatsen  de vaste titel staat er al: alleen verplaatsen (zelfde id);
//   hernoemen    alleen een PT-naam: de vaste titel erop, dan verplaatsen;
//   splitsen     "Naam en Naam": twee losse afspraken van 20 minuten, origineel weg;
//   dubbel       voor dezelfde PT'er op hetzelfde moment staat er al een: weg.
// Het uitvoeren bij Google staat in `verplaatsen-google.ts`.

import { bevatReeks, woordTokens } from '@/lib/lifeos/crm/agenda-match'
import { isCoachgesprekTitel } from './coach-agenda'
import { coachgesprekTitel, matchtCoachgesprek } from './pt-gesprek'
import { GESPREK_DUUR_MIN } from './ritme'

export const TERUG_MAANDEN = 18
export const VOORUIT_MAANDEN = 12

const MIN_MS = 60_000

/** Het venster waarin we zoeken: 18 maanden terug tot 12 maanden vooruit. */
export function verplaatsVenster(nu: Date): { van: Date; tot: Date } {
  const van = new Date(nu.getTime())
  van.setMonth(van.getMonth() - TERUG_MAANDEN)
  const tot = new Date(nu.getTime())
  tot.setMonth(tot.getMonth() + VOORUIT_MAANDEN)
  return { van, tot }
}

// ─── Een afspraak zoals Google hem geeft (singleEvents=false) ───────────────

export interface AgendaItem {
  id: string
  titel: string | null
  /** ISO-start. Bij een reeks: de start van het eerste exemplaar. */
  startOp: string
  heleDag: boolean
  /** De hoofdafspraak van een terugkerende reeks. */
  reeks: boolean
  /** Een los aangepast exemplaar van een reeks: het id van de hoofdafspraak. */
  reeksId: string | null
  /** Is Kane (deze agenda) de organisator? Alleen die mag verplaatsen. */
  vanMij: boolean
  /** eventType 'default': alleen gewone afspraken kunnen verplaatst worden. */
  gewoon: boolean
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

function leesStart(ruw: unknown): { op: string; heleDag: boolean } | null {
  if (!isObject(ruw)) return null
  const moment = tekst(ruw.dateTime)
  if (moment) {
    const d = new Date(moment)
    return Number.isNaN(d.getTime()) ? null : { op: d.toISOString(), heleDag: false }
  }
  const datum = tekst(ruw.date)
  if (datum && /^\d{4}-\d{2}-\d{2}$/.test(datum)) return { op: new Date(`${datum}T00:00:00`).toISOString(), heleDag: true }
  return null
}

/** Een ruwe Google-afspraak naar onze vorm, of null (geannuleerd of onleesbaar). */
export function leesAgendaItem(ruw: unknown): AgendaItem | null {
  if (!isObject(ruw) || ruw.status === 'cancelled') return null
  const id = tekst(ruw.id)
  const start = leesStart(ruw.start)
  if (!id || !start) return null
  const organisator = isObject(ruw.organizer) ? ruw.organizer : null
  return {
    id,
    titel: tekst(ruw.summary),
    startOp: start.op,
    heleDag: start.heleDag,
    reeks: Array.isArray(ruw.recurrence) && ruw.recurrence.length > 0,
    reeksId: tekst(ruw.recurringEventId),
    // Zonder organizer-veld is het een eigen afspraak (oude of eenvoudige events).
    vanMij: organisator === null || organisator.self === true,
    gewoon: ruw.eventType === undefined || ruw.eventType === 'default',
  }
}

// ─── Namen herkennen ────────────────────────────────────────────────────────

/** Kleine letters, zonder accenten, enkele spaties. */
export function normaliseer(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Genormaliseerde naam of voornaam naar de PT-naam; null = meerdere PT'ers. */
export type NaamIndex = ReadonlyMap<string, string | null>

export function maakNaamIndex(namen: readonly string[]): NaamIndex {
  const index = new Map<string, string | null>()
  const zet = (sleutel: string, naam: string) => {
    if (sleutel.length === 0) return
    const bestaand = index.get(sleutel)
    if (bestaand === undefined) index.set(sleutel, naam)
    else if (bestaand !== naam) index.set(sleutel, null)
  }
  const uniek = [...new Set(namen.map((n) => n.trim()).filter((n) => n.length > 0))]
  for (const naam of uniek) zet(normaliseer(naam), naam)
  for (const naam of uniek) {
    const voornaam = normaliseer(naam).split(' ')[0]
    // De volledige naam wint altijd van een voornaam van iemand anders.
    if (voornaam !== normaliseer(naam) && !uniek.some((n) => normaliseer(n) === voornaam)) zet(voornaam, naam)
  }
  return index
}

function zonderStaart(s: string): string {
  return s.replace(/[!\s]+$/u, '')
}

/** "Amey", "Amey!", "Amey Team", "Amey! Team!" naar de kern ("amey"). */
function kernVan(titel: string): string {
  return zonderStaart(zonderStaart(normaliseer(titel)).replace(/\s+team$/u, ''))
}

export type Herkenning =
  /** De titel draagt al "Coachgesprek PT"; de naam is bekend. */
  | { soort: 'vast'; naam: string }
  /** De titel is alleen een PT-naam (eventueel met ! of Team). */
  | { soort: 'naam'; naam: string }
  /** "Naam en Naam" met twee verschillende PT'ers. */
  | { soort: 'twee'; namen: [string, string] }
  /** Lijkt op een coachgesprek, maar we weten niet zeker met wie. */
  | { soort: 'twijfel'; reden: string }

const VASTE_VORM = /^coachgesprek pt - kane \((.+)\)$/u

function herkenVast(titel: string, namen: readonly string[]): Herkenning {
  const treffers = namen.filter((n) => matchtCoachgesprek(titel, n))
  const exact = treffers.find((n) => coachgesprekTitel(n) === titel.trim())
  if (exact) return { soort: 'vast', naam: exact }
  if (treffers.length === 1) return { soort: 'vast', naam: treffers[0] }
  if (treffers.length > 1) return { soort: 'twijfel', reden: 'Meer dan een PT-naam in de titel.' }
  // De vaste vorm met een naam die niet (meer) in het team staat: ook een coachgesprek.
  const oud = VASTE_VORM.exec(normaliseer(titel))
  if (oud) {
    const naam = titel.trim().slice(titel.trim().lastIndexOf('(') + 1, -1).trim()
    if (naam.length > 0) return { soort: 'vast', naam }
  }
  return { soort: 'twijfel', reden: 'Lijkt op een coachgesprek, maar de naam is niet te herkennen.' }
}

/** Wat voor afspraak is dit? Null = geen coachgesprek. */
export function herkenTitel(titel: string | null, namen: readonly string[], index: NaamIndex): Herkenning | null {
  if (!titel) return null
  if (isCoachgesprekTitel(titel)) return herkenVast(titel, namen)
  // Een titel met "coachgesprek" maar zonder "PT" laten we staan: geen signaal.
  if (bevatReeks(woordTokens(titel), ['coachgesprek'])) return null

  const kern = kernVan(titel)
  const enkel = index.get(kern)
  if (enkel) return { soort: 'naam', naam: enkel }
  if (enkel === null) return { soort: 'twijfel', reden: 'Deze naam hoort bij meer dan een PT\'er.' }

  const delen = kern.split(/\s+(?:en|&)\s+/u)
  if (delen.length !== 2) return null
  const [a, b] = delen.map((d) => index.get(zonderStaart(d)))
  if (a && b && a !== b) return { soort: 'twee', namen: [a, b] }
  return null
}

// ─── Het plan ───────────────────────────────────────────────────────────────

export type Actie = 'verplaatsen' | 'hernoemen' | 'splitsen' | 'dubbel'

export interface NieuweAfspraak {
  titel: string
  startOp: string
  eindOp: string
}

export interface Voorstel {
  /** Stabiel per afspraak en actie; de POST stuurt de aangevinkte sleutels terug. */
  sleutel: string
  eventId: string
  actie: Actie
  startOp: string
  oudeTitel: string
  /** De titel na afloop (verplaatsen en hernoemen); null bij splitsen en dubbel. */
  nieuweTitel: string | null
  /** Splitsen: de afspraken die erbij komen in "Coachgesprekken PT". */
  nieuw: NieuweAfspraak[]
  /** Terugkerende afspraak: de hele reeks gaat mee. */
  reeks: boolean
  /** Dubbel: het voorstel dat blijft, of null als het al in "Coachgesprekken PT" staat. */
  bewaardDoor: string | null
  toelichting: string | null
}

export interface Overgeslagen {
  eventId: string
  titel: string
  startOp: string
  reden: string
}

export interface VerplaatsPlan {
  voorstellen: Voorstel[]
  overgeslagen: Overgeslagen[]
}

function momentSleutel(naam: string, startMs: number): string {
  return `${normaliseer(naam)}|${startMs}`
}

/** Welke (PT'er, starttijd) staan al in "Coachgesprekken PT"? */
function bezetInCoachAgenda(coach: readonly AgendaItem[], namen: readonly string[], index: NaamIndex): Set<string> {
  const bezet = new Set<string>()
  for (const item of coach) {
    if (item.reeks || item.heleDag) continue
    const h = herkenTitel(item.titel, namen, index)
    if (h?.soort === 'vast' || h?.soort === 'naam') bezet.add(momentSleutel(h.naam, new Date(item.startOp).getTime()))
  }
  return bezet
}

interface Kandidaat {
  item: AgendaItem
  h: Exclude<Herkenning, { soort: 'twijfel' }>
}

const VOLGORDE: Record<Kandidaat['h']['soort'], number> = { vast: 0, naam: 1, twee: 2 }

/** Filtert wat we niet (mogen) aanraken; de rest wordt een kandidaat. */
function kiesKandidaten(
  gekozen: readonly AgendaItem[],
  coachIds: ReadonlySet<string>,
  namen: readonly string[],
  index: NaamIndex,
  overgeslagen: Overgeslagen[],
): Kandidaat[] {
  const ids = new Set(gekozen.map((i) => i.id))
  const uit: Kandidaat[] = []
  for (const item of gekozen) {
    // Hetzelfde id in beide agenda's: hij staat er al (een uitnodiging), niets doen.
    if (coachIds.has(item.id) || !item.gewoon || item.heleDag) continue
    const h = herkenTitel(item.titel, namen, index)
    if (h === null) continue
    const sla = (reden: string) => overgeslagen.push({ eventId: item.id, titel: item.titel ?? '', startOp: item.startOp, reden })
    // Een aangepast exemplaar gaat mee met zijn reeks.
    if (item.reeksId !== null) {
      if (!ids.has(item.reeksId)) sla('Los exemplaar van een terugkerende afspraak waarvan de reeks niet gevonden is.')
      continue
    }
    if (h.soort === 'twijfel') sla(h.reden)
    else if (!item.vanMij) sla('Uitnodiging van iemand anders: alleen de organisator kan hem verplaatsen.')
    else if (item.reeks && h.soort === 'twee') sla('Terugkerende afspraak met twee namen: splits deze zelf in Google Agenda.')
    else uit.push({ item, h })
  }
  return uit.sort(
    (a, b) => VOLGORDE[a.h.soort] - VOLGORDE[b.h.soort] || a.item.startOp.localeCompare(b.item.startOp) || a.item.id.localeCompare(b.item.id),
  )
}

function dubbelVoorstel(item: AgendaItem, bewaardDoor: string | null): Voorstel {
  return {
    sleutel: `dubbel:${item.id}`,
    eventId: item.id,
    actie: 'dubbel',
    startOp: item.startOp,
    oudeTitel: item.titel ?? '',
    nieuweTitel: null,
    nieuw: [],
    reeks: false,
    bewaardDoor,
    toelichting: bewaardDoor === null ? 'Staat al in Coachgesprekken PT.' : 'Er blijft een coachgesprek op dit moment staan.',
  }
}

/** De twee helften van "Naam en Naam": 20 minuten elk, de tweede direct na de eerste. */
export function splitsHelften(namen: readonly [string, string], startOp: string): (NieuweAfspraak & { naam: string })[] {
  const start = new Date(startOp).getTime()
  const duur = GESPREK_DUUR_MIN * MIN_MS
  return namen.map((naam, i) => ({
    naam,
    titel: coachgesprekTitel(naam),
    startOp: new Date(start + i * duur).toISOString(),
    eindOp: new Date(start + (i + 1) * duur).toISOString(),
  }))
}

type Gezien = Map<string, string>

function voorstelVoor(k: Kandidaat, bezet: ReadonlySet<string>, gezien: Gezien): Voorstel {
  const { item, h } = k
  const startMs = new Date(item.startOp).getTime()
  const oudeTitel = item.titel ?? ''

  if (h.soort === 'twee') {
    const helften = splitsHelften(h.namen, item.startOp)
    const vrij = helften.filter((d) => {
      const sleutel = momentSleutel(d.naam, new Date(d.startOp).getTime())
      return !bezet.has(sleutel) && !gezien.has(sleutel)
    })
    if (vrij.length === 0) {
      const sleutel = momentSleutel(helften[0].naam, startMs)
      return dubbelVoorstel(item, gezien.get(sleutel) ?? null)
    }
    const sleutel = `splitsen:${item.id}`
    for (const d of vrij) gezien.set(momentSleutel(d.naam, new Date(d.startOp).getTime()), sleutel)
    const al = helften.filter((d) => !vrij.includes(d)).map((d) => d.naam)
    return {
      sleutel,
      eventId: item.id,
      actie: 'splitsen',
      startOp: item.startOp,
      oudeTitel,
      nieuweTitel: null,
      nieuw: vrij.map(({ titel, startOp, eindOp }) => ({ titel, startOp, eindOp })),
      reeks: false,
      bewaardDoor: null,
      toelichting: al.length > 0 ? `Voor ${al.join(' en ')} staat er al een coachgesprek.` : null,
    }
  }

  const moment = momentSleutel(h.naam, startMs)
  if (!item.reeks) {
    if (bezet.has(moment)) return dubbelVoorstel(item, null)
    const eerder = gezien.get(moment)
    if (eerder !== undefined) return dubbelVoorstel(item, eerder)
  }
  const actie: Actie = h.soort === 'vast' ? 'verplaatsen' : 'hernoemen'
  const sleutel = `${actie}:${item.id}`
  if (!item.reeks) gezien.set(moment, sleutel)
  return {
    sleutel,
    eventId: item.id,
    actie,
    startOp: item.startOp,
    oudeTitel,
    nieuweTitel: actie === 'hernoemen' ? coachgesprekTitel(h.naam) : oudeTitel,
    nieuw: [],
    reeks: item.reeks,
    bewaardDoor: null,
    toelichting: item.reeks ? 'Terugkerende afspraak: de hele reeks gaat mee.' : null,
  }
}

/**
 * Het plan: wat er met elke afspraak in de gekozen agenda gebeurt.
 *
 * Idempotent: wat al in "Coachgesprekken PT" staat (zelfde id, of dezelfde PT'er op
 * hetzelfde moment) wordt niet opnieuw gemaakt. De vaste titel wint van een
 * afwijkende titel bij een dubbel, daarna de vroegste.
 */
export function maakPlan(gekozen: readonly AgendaItem[], coach: readonly AgendaItem[], ptNamen: readonly string[]): VerplaatsPlan {
  const namen = [...new Set(ptNamen.map((n) => n.trim()).filter((n) => n.length > 0))]
  const index = maakNaamIndex(namen)
  const overgeslagen: Overgeslagen[] = []
  const kandidaten = kiesKandidaten(gekozen, new Set(coach.map((i) => i.id)), namen, index, overgeslagen)
  const bezet = bezetInCoachAgenda(coach, namen, index)
  const gezien: Gezien = new Map()
  const voorstellen = kandidaten.map((k) => voorstelVoor(k, bezet, gezien))
  const opTijd = <T extends { startOp: string }>(a: T, b: T) => a.startOp.localeCompare(b.startOp)
  return { voorstellen: voorstellen.sort(opTijd), overgeslagen: overgeslagen.sort(opTijd) }
}

// ─── Uitvoeren: resultaten en samenvatting ──────────────────────────────────

export interface Resultaat {
  sleutel: string
  actie: Actie
  oudeTitel: string
  startOp: string
  gelukt: boolean
  /** Waarom het mislukte (of een kanttekening bij een gelukte actie). */
  reden: string | null
}

export interface Samenvatting {
  verplaatst: number
  hernoemd: number
  gesplitst: number
  verwijderd: number
  mislukt: Resultaat[]
}

export function vatSamen(resultaten: readonly Resultaat[]): Samenvatting {
  const telGelukt = (actie: Actie) => resultaten.filter((r) => r.gelukt && r.actie === actie).length
  return {
    verplaatst: telGelukt('verplaatsen'),
    hernoemd: telGelukt('hernoemen'),
    gesplitst: telGelukt('splitsen'),
    verwijderd: telGelukt('dubbel'),
    mislukt: resultaten.filter((r) => !r.gelukt),
  }
}

/**
 * De volgorde van uitvoeren: eerst alles wat iets in "Coachgesprekken PT" zet,
 * daarna pas de dubbelen. Alleen de aangevinkte voorstellen.
 */
export function uitvoerVolgorde(plan: VerplaatsPlan, aangevinkt: ReadonlySet<string>): Voorstel[] {
  const gekozen = plan.voorstellen.filter((v) => aangevinkt.has(v.sleutel))
  return [...gekozen.filter((v) => v.actie !== 'dubbel'), ...gekozen.filter((v) => v.actie === 'dubbel')]
}

// ─── Over de draad (systeemgrens) ───────────────────────────────────────────

export interface Voorvertoning extends VerplaatsPlan {
  /** Naam van de agenda waar de afspraken nu staan. */
  vanAgenda: string
}

export interface Uitvoering {
  resultaten: Resultaat[]
}

const ACTIES: readonly Actie[] = ['verplaatsen', 'hernoemen', 'splitsen', 'dubbel']

function isActie(v: unknown): v is Actie {
  return typeof v === 'string' && (ACTIES as readonly string[]).includes(v)
}

function tekstOfLeeg(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function leesNieuw(ruw: unknown): NieuweAfspraak | null {
  if (!isObject(ruw)) return null
  const titel = tekst(ruw.titel)
  const startOp = tekst(ruw.startOp)
  const eindOp = tekst(ruw.eindOp)
  return titel && startOp && eindOp ? { titel, startOp, eindOp } : null
}

function leesVoorstel(ruw: unknown): Voorstel | null {
  if (!isObject(ruw)) return null
  const sleutel = tekst(ruw.sleutel)
  const eventId = tekst(ruw.eventId)
  const startOp = tekst(ruw.startOp)
  const oudeTitel = tekstOfLeeg(ruw.oudeTitel)
  if (!sleutel || !eventId || !startOp || oudeTitel === null || !isActie(ruw.actie) || !Array.isArray(ruw.nieuw)) return null
  const nieuw = ruw.nieuw.map(leesNieuw)
  if (nieuw.some((n) => n === null)) return null
  return {
    sleutel,
    eventId,
    actie: ruw.actie,
    startOp,
    oudeTitel,
    nieuweTitel: tekst(ruw.nieuweTitel),
    nieuw: nieuw.filter((n): n is NieuweAfspraak => n !== null),
    reeks: ruw.reeks === true,
    bewaardDoor: tekst(ruw.bewaardDoor),
    toelichting: tekst(ruw.toelichting),
  }
}

function leesOvergeslagen(ruw: unknown): Overgeslagen | null {
  if (!isObject(ruw)) return null
  const eventId = tekst(ruw.eventId)
  const startOp = tekst(ruw.startOp)
  const reden = tekst(ruw.reden)
  const titel = tekstOfLeeg(ruw.titel)
  return eventId && startOp && reden && titel !== null ? { eventId, titel, startOp, reden } : null
}

function leesLijst<T>(ruw: unknown, lees: (v: unknown) => T | null): T[] | null {
  if (!Array.isArray(ruw)) return null
  const uit = ruw.map(lees)
  // Een kapot item maakt het antwoord kapot: stil weglaten verbergt een afspraak.
  return uit.some((v) => v === null) ? null : (uit as T[])
}

/** Het antwoord van GET /api/lifeos/pt-gesprekken/verplaatsen, of null. */
export function leesVoorvertoning(ruw: unknown): Voorvertoning | null {
  if (!isObject(ruw)) return null
  const voorstellen = leesLijst(ruw.voorstellen, leesVoorstel)
  const overgeslagen = leesLijst(ruw.overgeslagen, leesOvergeslagen)
  const vanAgenda = tekst(ruw.vanAgenda)
  if (!voorstellen || !overgeslagen || !vanAgenda) return null
  return { vanAgenda, voorstellen, overgeslagen }
}

function leesResultaat(ruw: unknown): Resultaat | null {
  if (!isObject(ruw)) return null
  const sleutel = tekst(ruw.sleutel)
  const startOp = tekst(ruw.startOp)
  const oudeTitel = tekstOfLeeg(ruw.oudeTitel)
  if (!sleutel || !startOp || oudeTitel === null || !isActie(ruw.actie) || typeof ruw.gelukt !== 'boolean') return null
  return { sleutel, actie: ruw.actie, oudeTitel, startOp, gelukt: ruw.gelukt, reden: tekst(ruw.reden) }
}

/** Het antwoord van POST /api/lifeos/pt-gesprekken/verplaatsen, of null. */
export function leesUitvoering(ruw: unknown): Uitvoering | null {
  if (!isObject(ruw)) return null
  const resultaten = leesLijst(ruw.resultaten, leesResultaat)
  return resultaten ? { resultaten } : null
}

export const MAX_SLEUTELS = 2000

/** De body van de POST: de aangevinkte sleutels. */
export function leesAangevinkt(body: unknown): Set<string> | null {
  if (!isObject(body) || !Array.isArray(body.sleutels) || body.sleutels.length > MAX_SLEUTELS) return null
  if (!body.sleutels.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 1100)) return null
  return new Set(body.sleutels as string[])
}
