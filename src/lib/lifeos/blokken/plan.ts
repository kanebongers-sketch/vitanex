// ─── LifeOS — blokken in je agenda: wat, wanneer (PUUR) ─────────────────────
// Van je to-do naar tijd in je agenda. Drie soorten blokken, allemaal in je
// PERSOONLIJKE agenda (de aanroeper schrijft; dit bestand beslist alleen):
//
//   taak  — een taak met een dag of deadline krijgt een eigen blok op die dag
//           (of vóór de deadline). Maximaal TAKEN_PER_DAG per dag.
//   mail  — taken die uit je mail kwamen ("Reageren op …") krijgen géén los
//           blokje van 15 minuten elk, maar samen één "Mail afhandelen"-blok.
//   bouw  — het vaste bouwblok "PT uitbouwen": BOUW_PER_WEEK × per werkweek,
//           bij voorkeur 's ochtends, op verschillende dagen.
//
// Eén sleutel per blok (`taak:<id>`, `mail:<dag>`, `bouw:<maandag>:<n>`). Bestaat
// een sleutel al, dan plant LifeOS 'm nooit opnieuw — ook niet als jij het blok
// in Google verplaatste of weggooide. Jij hebt het laatste woord.
//
// Puur: geen fetch, geen DB, `nu` komt erin. Zo is elke keuze te testen.

import type { Afspraak } from '@/lib/lifeos/agenda/vrije-blokken'
import { dagPlus, dagVan, opMoment, uurVan, weekdag, weekVan } from './tijd'

export type BlokSoort = 'taak' | 'mail' | 'bouw'

/** Een blok dat LifeOS eerder plande (uit `agenda_blokken`). */
export interface BestaandBlok {
  sleutel: string
  soort: BlokSoort
  taakIds: readonly string[]
  startOp: Date | null
  /** `opgeruimd` = LifeOS haalde het weg (taak af); telt nog wel als "al gedaan". */
  status: 'gepland' | 'opgeruimd'
}

/** Wat de planner van een open taak hoeft te weten. */
export interface TaakKandidaat {
  id: string
  titel: string
  datum: string | null
  deadline: string | null
  inspanningMinuten: number | null
  top3: boolean
  /** Kwam uit je mail → gaat in het gebundelde mail-blok. */
  uitMail: boolean
}

export interface BlokVoorstel {
  soort: BlokSoort
  sleutel: string
  titel: string
  beschrijving: string
  startOp: Date
  eindOp: Date
  taakIds: string[]
}

export interface PlanInvoer {
  nu: Date
  /** Je agenda (alle kalenders): wat bezet is. */
  afspraken: readonly Afspraak[]
  taken: readonly TaakKandidaat[]
  bestaand: readonly BestaandBlok[]
}

export const HORIZON_DAGEN = 7
/** Lucht rond elke afspraak: geen blok rug-aan-rug tegen een PT-sessie. */
export const BUFFER_MIN = 10
export const DAG_VAN = 8
export const DAG_TOT = 20
export const TAKEN_PER_DAG = 3
export const STANDAARD_TAAK_MIN = 30
export const BOUW_PER_WEEK = 2
export const BOUW_MIN = 90
export const BOUW_TITEL = 'Bouwblok: PT uitbouwen'
const BOUW_OCHTEND_TOT = 12
const BOUW_UITERLIJK = 18
const MAIL_PER_STUK = 15
const MAIL_MIN = 30
const MAIL_MAX = 60
/**
 * Vandaag pas plannen vanaf 09:00: de ochtendplanning (sport + wandeling, 07:00)
 * kiest eerst. Anders pakt een taakblok de plek die je training nodig had.
 */
export const VANDAAG_VANAF_UUR = 9
/** Nooit een blok dat over een kwartier al begint zonder dat je het zag. */
const MARGE_NU_MIN = 15
const KWARTIER = 15 * 60_000
const MIN = 60_000

const UITLEG_TAAK =
  'Door LifeOS ingepland vanuit je to-do. Vink je de taak af, dan ruimt LifeOS dit blok op. Verplaatsen of verwijderen mag gewoon — LifeOS plant deze taak niet opnieuw.'
const UITLEG_BOUW =
  'Vaste tijd om je PT-business uit te bouwen (2× per week, door LifeOS ingepland). Verplaatsen of verwijderen mag — LifeOS zet deze niet terug.'

interface Interval {
  van: number
  tot: number
}

function bezetVan(afspraken: readonly Afspraak[]): Interval[] {
  return afspraken
    .filter((a) => !a.heleDag && a.eindOp !== null)
    .map((a) => ({ van: a.startOp.getTime() - BUFFER_MIN * MIN, tot: (a.eindOp as Date).getTime() + BUFFER_MIN * MIN }))
    .filter((i) => Number.isFinite(i.van) && Number.isFinite(i.tot) && i.tot > i.van)
}

/** Eerste plek van `minuten` binnen [van, tot), op een kwartier, buiten `bezet`. */
export function vindPlek(bezet: readonly Interval[], van: Date, tot: Date, minuten: number): Date | null {
  const duur = minuten * MIN
  let start = Math.ceil(van.getTime() / KWARTIER) * KWARTIER
  const eind = tot.getTime()
  const gesorteerd = [...bezet].sort((a, b) => a.van - b.van)
  // Schuif voorbij elk interval dat de kandidaat raakt, tot hij past of de dag op is.
  for (let ronde = 0; ronde <= gesorteerd.length; ronde++) {
    if (start + duur > eind) return null
    const botsing = gesorteerd.find((i) => i.van < start + duur && i.tot > start)
    if (!botsing) return new Date(start)
    start = Math.ceil(botsing.tot / KWARTIER) * KWARTIER
  }
  return null
}

function klem(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** De dagen waarop we mogen plannen: vandaag (vanaf 09:00) + de rest van de horizon. */
function planDagen(nu: Date): string[] {
  const vandaag = dagVan(nu)
  const dagen = Array.from({ length: HORIZON_DAGEN }, (_, i) => dagPlus(vandaag, i))
  return uurVan(nu) < VANDAAG_VANAF_UUR ? dagen.slice(1) : dagen
}

class Planbord {
  private readonly bezet: Interval[]
  readonly voorstellen: BlokVoorstel[] = []

  constructor(
    afspraken: readonly Afspraak[],
    private readonly nu: Date,
  ) {
    this.bezet = bezetVan(afspraken)
  }

  /** Probeer een blok op `dag` tussen `vanUur` en `totUur`. Gelukt → voorstel terug. */
  plaats(dag: string, vanUur: number, totUur: number, minuten: number, maak: (start: Date, eind: Date) => BlokVoorstel): BlokVoorstel | null {
    const vroegst = new Date(Math.max(opMoment(dag, vanUur).getTime(), this.nu.getTime() + MARGE_NU_MIN * MIN))
    const start = vindPlek(this.bezet, vroegst, opMoment(dag, totUur), minuten)
    if (start === null) return null
    const eind = new Date(start.getTime() + minuten * MIN)
    const voorstel = maak(start, eind)
    this.bezet.push({ van: start.getTime() - BUFFER_MIN * MIN, tot: eind.getTime() + BUFFER_MIN * MIN })
    this.voorstellen.push(voorstel)
    return voorstel
  }
}

/** Probeer dag voor dag; stop bij de eerste die lukt (plaatsen heeft een bijwerking). */
function eersteGelukt(dagen: readonly string[], probeer: (dag: string) => BlokVoorstel | null): BlokVoorstel | null {
  for (const dag of dagen) {
    const v = probeer(dag)
    if (v) return v
  }
  return null
}

function planBouw(bord: Planbord, dagen: readonly string[], bestaand: readonly BestaandBlok[]): void {
  const sleutels = new Set(bestaand.map((b) => b.sleutel))
  const werkdagen = dagen.filter((d) => weekdag(d) >= 1 && weekdag(d) <= 5)
  const weken = [...new Set(werkdagen.map(weekVan))]

  for (const week of weken) {
    const inWeek = werkdagen.filter((d) => weekVan(d) === week)
    const bezetteDagen = new Set(
      bestaand.filter((b) => b.soort === 'bouw' && b.sleutel.startsWith(`bouw:${week}:`) && b.startOp).map((b) => dagVan(b.startOp as Date)),
    )
    for (let n = 1; n <= BOUW_PER_WEEK; n++) {
      const sleutel = `bouw:${week}:${n}`
      if (sleutels.has(sleutel)) continue
      const kandidaten = inWeek.filter((d) => !bezetteDagen.has(d))
      const maak = (startOp: Date, eindOp: Date): BlokVoorstel => ({
        soort: 'bouw', sleutel, titel: BOUW_TITEL, beschrijving: UITLEG_BOUW, startOp, eindOp, taakIds: [],
      })
      // Eerst een ochtend, dan pas de middag.
      const geplaatst =
        eersteGelukt(kandidaten, (d) => bord.plaats(d, DAG_VAN, BOUW_OCHTEND_TOT, BOUW_MIN, maak)) ??
        eersteGelukt(kandidaten, (d) => bord.plaats(d, DAG_VAN, BOUW_UITERLIJK, BOUW_MIN, maak))
      if (geplaatst) bezetteDagen.add(dagVan(geplaatst.startOp))
    }
  }
}

function planMail(bord: Planbord, dagen: readonly string[], taken: readonly TaakKandidaat[], bestaand: readonly BestaandBlok[]): void {
  const gedekt = new Set(bestaand.filter((b) => b.soort === 'mail').flatMap((b) => b.taakIds))
  const open = taken.filter((t) => t.uitMail && !gedekt.has(t.id))
  if (open.length === 0) return
  const sleutels = new Set(bestaand.map((b) => b.sleutel))
  const minuten = klem(open.length * MAIL_PER_STUK, MAIL_MIN, MAIL_MAX)
  const beschrijving = [
    'Door LifeOS ingepland: de mails die op een antwoord of actie wachten.',
    '',
    ...open.map((t) => `- ${t.titel}`),
  ].join('\n')

  for (const dag of dagen.slice(0, 2)) {
    const sleutel = `mail:${dag}`
    if (sleutels.has(sleutel)) continue
    const gelukt = bord.plaats(dag, DAG_VAN, DAG_TOT, minuten, (startOp, eindOp) => ({
      soort: 'mail', sleutel, titel: `Mail afhandelen (${open.length})`, beschrijving, startOp, eindOp, taakIds: open.map((t) => t.id),
    }))
    if (gelukt) return
  }
}

/** Welke dagen komen in aanmerking voor deze taak, vroegste eerst. */
function dagenVoorTaak(t: TaakKandidaat, dagen: readonly string[], vandaag: string): string[] {
  if (dagen.length === 0) return []
  const eerste = dagen[0]
  const laatste = dagen[dagen.length - 1]
  if (t.datum !== null) {
    // Gepland voor vandaag maar het is nog vroeg: wachten, niet naar morgen schuiven.
    if (t.datum === vandaag && eerste !== vandaag) return []
    const dag = t.datum < eerste ? eerste : t.datum
    return dag <= laatste && dagen.includes(dag) ? [dag] : []
  }
  if (t.deadline !== null) {
    const tot = t.deadline < eerste ? eerste : t.deadline
    return dagen.filter((d) => d <= tot)
  }
  return []
}

function volgorde(a: TaakKandidaat, b: TaakKandidaat): number {
  const da = a.deadline ?? '9999-12-31'
  const db = b.deadline ?? '9999-12-31'
  if (da !== db) return da < db ? -1 : 1
  if (a.top3 !== b.top3) return a.top3 ? -1 : 1
  return (a.datum ?? '9999-12-31').localeCompare(b.datum ?? '9999-12-31')
}

function planTaken(bord: Planbord, dagen: readonly string[], vandaag: string, taken: readonly TaakKandidaat[], bestaand: readonly BestaandBlok[]): void {
  const sleutels = new Set(bestaand.map((b) => b.sleutel))
  const perDag = new Map<string, number>()
  for (const b of bestaand) {
    if (b.soort !== 'taak' || b.status !== 'gepland' || !b.startOp) continue
    const dag = dagVan(b.startOp)
    perDag.set(dag, (perDag.get(dag) ?? 0) + 1)
  }

  const kandidaten = taken.filter((t) => !t.uitMail && !sleutels.has(`taak:${t.id}`)).sort(volgorde)
  for (const t of kandidaten) {
    const minuten = klem(t.inspanningMinuten ?? STANDAARD_TAAK_MIN, 15, 180)
    const titel = `Taak: ${t.titel}`.slice(0, 120)
    for (const dag of dagenVoorTaak(t, dagen, vandaag)) {
      if ((perDag.get(dag) ?? 0) >= TAKEN_PER_DAG) continue
      const gelukt = bord.plaats(dag, DAG_VAN, DAG_TOT, minuten, (startOp, eindOp) => ({
        soort: 'taak', sleutel: `taak:${t.id}`, titel, beschrijving: UITLEG_TAAK, startOp, eindOp, taakIds: [t.id],
      }))
      if (gelukt) {
        perDag.set(dag, (perDag.get(dag) ?? 0) + 1)
        break
      }
    }
  }
}

/** Alle nieuwe blokken voor de komende week. Volgorde: bouw, mail, taken. */
export function planBlokken(invoer: PlanInvoer): BlokVoorstel[] {
  const dagen = planDagen(invoer.nu)
  const bord = new Planbord(invoer.afspraken, invoer.nu)
  planBouw(bord, dagen, invoer.bestaand)
  planMail(bord, dagen, invoer.taken, invoer.bestaand)
  planTaken(bord, dagen, dagVan(invoer.nu), invoer.taken, invoer.bestaand)
  return bord.voorstellen
}

/**
 * Welke geplande blokken LifeOS weer weg mag halen: nog niet begonnen, en elke
 * taak erin is af (of verwijderd). Een bouwblok ruimt nooit vanzelf op.
 */
export function teOpruimen(bestaand: readonly BestaandBlok[], openTaakIds: ReadonlySet<string>, nu: Date): BestaandBlok[] {
  return bestaand.filter(
    (b) =>
      b.status === 'gepland' &&
      b.soort !== 'bouw' &&
      b.startOp !== null &&
      b.startOp.getTime() > nu.getTime() &&
      b.taakIds.length > 0 &&
      b.taakIds.every((id) => !openTaakIds.has(id)),
  )
}
