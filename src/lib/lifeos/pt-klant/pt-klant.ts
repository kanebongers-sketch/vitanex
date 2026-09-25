// ─── LifeOS — PT-klanten: wekelijkse sessies bewaken ────────────────────────
// PUUR. Geen fetch, geen DB. De naamconventie van een PT-sessie, de detectie of
// een afspraak bij een klant hoort, en de status per klant op basis van zijn
// ABONNEMENT (1×/week, 2×/week of 1×/2 weken). Zo vergeet je niemand.

import type { Abonnement, PtLocatie } from '../crm/crm'
import { bevatReeks, woordTokens } from '../crm/agenda-match'
import type { Afhaak } from './afhaak'
import type { MogelijkeTypfout, OnbekendePtSessie, PtStatusHint } from './klantstatus'

export const LOCATIE_LABEL: Record<PtLocatie, string> = {
  bergeijk: 'Bergeijk',
  someren: 'Someren',
  budel: 'Budel',
}

export const ABONNEMENT_LABEL: Record<Abonnement, string> = {
  wekelijks_1: '1× per week',
  wekelijks_2: '2× per week',
  tweewekelijks_1: '1× per 2 weken',
}

/** De vaste sessie-titel: "PT Iris Someren" (naam + locatie, geen haakjes). */
export function ptSessieTitel(naam: string, locatie: PtLocatie | null): string {
  const loc = locatie ? ` ${LOCATIE_LABEL[locatie]}` : ''
  return `PT ${naam.trim()}${loc}`
}

function gelijk(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

/**
 * Een titel die ALLEEN uit de naam van de klant bestaat ("Atousa Oweisie", of
 * "Atousa" als geen andere klant zo heet) is ook een PT-sessie: zo zet je een
 * PT-klant vaak in je agenda, en de auto-hernoem behandelt precies zo'n kale naam
 * al als PT-sessie (hij maakt er "Naam PT" van). Tellen en hernoemen zijn het nu
 * eens. Een voornaam die meerdere klanten delen is dubbelzinnig → telt niet.
 */
function isKaleNaam(titel: readonly string[], naam: readonly string[], andereNamen: readonly string[]): boolean {
  if (titel.length === 0) return false
  if (gelijk(titel, naam)) return true
  if (titel.length !== 1 || naam[0] !== titel[0]) return false
  return uniekeVoornaam(naam, andereNamen)
}

/**
 * Herkent een PT-sessie met déze klant aan de titel: er staat een los woord "pt"
 * in én de naam van de klant als hele woorden, aaneengesloten ("Tom" telt niet in
 * "Tomas PT"). Hoofdletter-ongevoelig.
 *
 * `andereNamen`: de namen van je andere PT-klanten. Staat er in de titel een
 * LANGERE klantnaam die deze naam bevat, dan is het diens sessie — een klant
 * "Ellen" krijgt geen krediet voor "Marjan en Ellen PT" als "Marjan en Ellen" zelf
 * een klant is.
 */
export function matchtPtSessie(titel: string | null, naam: string, andereNamen: readonly string[] = []): boolean {
  const t = woordTokens(titel ?? '')
  const n = woordTokens(naam)
  if (n.length === 0) return false
  if (!isPtTitel(t)) return isKaleNaam(t, n, andereNamen)

  if (bevatReeks(t, n)) {
    return !andereNamen.some((ander) => {
      const a = woordTokens(ander)
      return a.length > n.length && bevatReeks(a, n) && bevatReeks(t, a)
    })
  }
  // Voornaam-terugval ("Joris - Personal training" voor "Joris Bax"), net als de
  // CRM-koppeling: alleen als niemand anders in `andereNamen` die voornaam heeft,
  // en er geen ándere bekende naam volledig in de titel staat.
  if (n.length < 2 || !t.includes(n[0]) || !uniekeVoornaam(n, andereNamen)) return false
  return !andereNamen.some((ander) => {
    const a = woordTokens(ander)
    return a.length > 0 && a.join(' ') !== n.join(' ') && bevatReeks(t, a)
  })
}

/** "PT" als los woord, of voluit "personal training" (ook "personaltraining"). */
function isPtTitel(t: readonly string[]): boolean {
  return t.includes('pt') || t.includes('personaltraining') || bevatReeks(t, ['personal', 'training'])
}

function uniekeVoornaam(naam: readonly string[], andereNamen: readonly string[]): boolean {
  const zelfde = new Set(
    andereNamen.map((a) => woordTokens(a)).filter((a) => a[0] === naam[0]).map((a) => a.join(' ')),
  )
  zelfde.add(naam.join(' '))
  return zelfde.size === 1
}

/**
 * De cadans achter een abonnement: hoeveel sessies nodig, over hoeveel weken.
 * `null` (nog niet ingesteld) telt als 1× per week — het meest voorkomende.
 */
export function cadans(abonnement: Abonnement | null): { nodig: number; weken: 1 | 2 } {
  switch (abonnement) {
    case 'wekelijks_2':
      return { nodig: 2, weken: 1 }
    case 'tweewekelijks_1':
      return { nodig: 1, weken: 2 }
    case 'wekelijks_1':
    default:
      return { nodig: 1, weken: 1 }
  }
}

/** Eén PT-klant met zijn config, zoals de status-berekening 'm nodig heeft. */
export interface PtKlant {
  id: string
  naam: string
  email: string | null
  abonnement: Abonnement | null
  duo: boolean
  locatie: PtLocatie | null
  /** Op vakantie t/m deze dag (YYYY-MM-DD), of null. */
  vakantieTot: string | null
}

/** Eén afspraak uit de agenda. */
export interface PtEvent {
  titel: string | null
  startOp: string
}

/** De status per klant: nodig vs. ingepland binnen zijn cadans-venster. */
export interface PtWeekStatus {
  id: string
  naam: string
  email: string | null
  locatie: PtLocatie | null
  abonnement: Abonnement | null
  duo: boolean
  /** De vensterlengte in weken (1 = deze week, 2 = per 2 weken). */
  weken: 1 | 2
  nodig: number
  ingepland: number
  /** Hoeveel er nog moeten (0 = klaar; nooit negatief). */
  tekort: number
  opVakantie: boolean
}

/**
 * De status per klant. `events` beslaan minstens de vorige, huidige én komende week
 * (zodat een 2-wekelijks abonnement zijn hele venster ziet); `weekVanISO` is de
 * maandag van de huidige week. Per klant kijken we in het juiste venster: wekelijks
 * alleen deze week; tweewekelijks breed — vorige, deze én komende week.
 *
 * Waarom óók de komende week? Een tweewekelijkse klant die volgende week geboekt
 * staat (maar deze en vorige week niet) is NIET vergeten — hij komt gewoon volgende
 * week. Keek het venster alleen achteruit, dan werd zo iemand onterecht als "moet
 * nog ingepland" geflagd. Het venster verbreedt alleen; niemand die eerder goed
 * stond valt er nu buiten.
 */
export function bepaalWeekStatus(
  klanten: readonly PtKlant[],
  events: readonly PtEvent[],
  weekVanISO: string,
  vandaagKey: string,
  /** Alle bekende namen (hele CRM) voor de naam-koppeling; standaard de klanten zelf. */
  alleNamen?: readonly string[],
): PtWeekStatus[] {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const weekVan = new Date(weekVanISO).getTime()
  const weekTot = weekVan + WEEK_MS
  const vorigeVan = weekVan - WEEK_MS
  const volgendeTot = weekTot + WEEK_MS

  const namen = alleNamen ?? klanten.map((k) => k.naam)
  return klanten.map((k) => {
    const { nodig, weken } = cadans(k.abonnement)
    const vensterVan = weken === 2 ? vorigeVan : weekVan
    const vensterTot = weken === 2 ? volgendeTot : weekTot
    const ingepland = events.filter((e) => {
      if (!matchtPtSessie(e.titel, k.naam, namen)) return false
      const t = new Date(e.startOp).getTime()
      return t >= vensterVan && t < vensterTot
    }).length
    const opVakantie = k.vakantieTot !== null && vandaagKey <= k.vakantieTot
    const tekort = opVakantie ? 0 : Math.max(0, nodig - ingepland)
    return {
      id: k.id,
      naam: k.naam,
      email: k.email,
      locatie: k.locatie,
      abonnement: k.abonnement,
      duo: k.duo,
      weken,
      nodig,
      ingepland,
      tekort,
      opVakantie,
    }
  })
}

// ─── De vorm over de draad (systeemgrens) ───────────────────────────────────

export type PtKlantenAntwoord =
  | { gekoppeld: false }
  | {
      gekoppeld: true
      klanten: PtWeekStatus[]
      /** Klanten die afhaken (zie `afhaak.ts`); leeg = niemand of niet nagegaan. */
      afhaak: Afhaak[]
      /** Traint al, maar staat nog als prospect (zie `klantstatus.ts`). */
      statusHints: PtStatusHint[]
      /** PT-sessies met iemand die niet in je CRM staat (zie `klantstatus.ts`). */
      onbekend: OnbekendePtSessie[]
      /** Mogelijke typfout in een klantnaam ("Kevnin" → Kevin). */
      typfouten: MogelijkeTypfout[]
    }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}
function isLoc(v: unknown): v is PtLocatie {
  return v === 'bergeijk' || v === 'someren' || v === 'budel'
}
function isAbo(v: unknown): v is Abonnement {
  return v === 'wekelijks_1' || v === 'wekelijks_2' || v === 'tweewekelijks_1'
}
function heelGetal(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

function leesStatus(ruw: unknown): PtWeekStatus | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const nodig = heelGetal(ruw.nodig)
  const ingepland = heelGetal(ruw.ingepland)
  const tekort = heelGetal(ruw.tekort)
  if (id === null || naam === null || nodig === null || ingepland === null || tekort === null) {
    return null
  }
  return {
    id,
    naam,
    email: tekstOfNull(ruw.email),
    locatie: isLoc(ruw.locatie) ? ruw.locatie : null,
    abonnement: isAbo(ruw.abonnement) ? ruw.abonnement : null,
    duo: ruw.duo === true,
    weken: ruw.weken === 2 ? 2 : 1,
    nodig,
    ingepland,
    tekort,
    opVakantie: ruw.opVakantie === true,
  }
}

function leesAfhaak(ruw: unknown): Afhaak | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const wekenGeleden = heelGetal(ruw.wekenGeleden)
  if (id === null || naam === null || wekenGeleden === null) return null
  return { id, naam, wekenGeleden }
}

function leesStatusHint(ruw: unknown): PtStatusHint | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const status = tekstOfNull(ruw.status)
  const statusLabel = tekstOfNull(ruw.statusLabel)
  const sessies = heelGetal(ruw.sessies)
  if (id === null || naam === null || status === null || statusLabel === null || sessies === null) return null
  return { id, naam, status, statusLabel, sessies }
}

function leesOnbekend(ruw: unknown): OnbekendePtSessie | null {
  if (!isObject(ruw)) return null
  const titel = tekstOfNull(ruw.titel)
  const laatsteOp = tekstOfNull(ruw.laatsteOp)
  const aantal = heelGetal(ruw.aantal)
  if (titel === null || laatsteOp === null || aantal === null) return null
  return { titel, aantal, laatsteOp }
}

function leesTypfout(ruw: unknown): MogelijkeTypfout | null {
  if (!isObject(ruw)) return null
  const titel = tekstOfNull(ruw.titel)
  const bedoeld = tekstOfNull(ruw.bedoeld)
  const op = tekstOfNull(ruw.op)
  if (titel === null || bedoeld === null || op === null) return null
  return { titel, bedoeld, op }
}

/** Het antwoord van `GET /api/lifeos/pt-klanten`, of null als het niet klopt. */
export function leesPtKlanten(ruw: unknown): PtKlantenAntwoord | null {
  if (!isObject(ruw)) return null
  if (ruw.gekoppeld === false) return { gekoppeld: false }
  if (ruw.gekoppeld !== true) return null
  if (!Array.isArray(ruw.klanten)) return null
  const klanten = ruw.klanten.map(leesStatus)
  if (klanten.some((k) => k === null)) return null
  // Afhaak is aanvullend: ontbreekt of klopt een regel niet, dan valt alleen díé
  // regel weg — de weekstatus (de kern van de kaart) blijft staan.
  const afhaak = Array.isArray(ruw.afhaak)
    ? ruw.afhaak.map(leesAfhaak).filter((a): a is Afhaak => a !== null)
    : []
  const statusHints = Array.isArray(ruw.statusHints)
    ? ruw.statusHints.map(leesStatusHint).filter((h): h is PtStatusHint => h !== null)
    : []
  const onbekend = Array.isArray(ruw.onbekend)
    ? ruw.onbekend.map(leesOnbekend).filter((o): o is OnbekendePtSessie => o !== null)
    : []
  const typfouten = Array.isArray(ruw.typfouten)
    ? ruw.typfouten.map(leesTypfout).filter((t): t is MogelijkeTypfout => t !== null)
    : []
  return {
    gekoppeld: true,
    klanten: klanten.filter((k): k is PtWeekStatus => k !== null),
    afhaak,
    statusHints,
    onbekend,
    typfouten,
  }
}
