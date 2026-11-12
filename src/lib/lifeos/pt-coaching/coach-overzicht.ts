// ─── PT-coaching — het coach-overzicht voor eigenaar en beheerder (PUUR) ────
// Geen fetch, geen DB. Per PT'er: wanneer het laatste coachgesprek was, wanneer
// het volgende staat, of er nog een verslag open staat en welke leads eerst
// opgepakt moeten worden. Plus de telling bovenaan en
// de volgorde (wat af moet, bovenaan). De data komt uit `coach-team.ts`.

import type { EvaluatieJson } from './pt-coaching'
import type { OpenPunt } from './aandachtspunten'
import { STATUS_LABEL, type Lead } from '@/lib/lifeos/leads/leads'

/** Welke open leads eerst aandacht vragen (uit `ptOverzicht`): te laat, vandaag, zonder plan. */
export interface OpTePakken {
  teLaat: Lead[]
  vandaag: Lead[]
  zonderPlan: Lead[]
}

export interface CoachRij {
  id: string
  naam: string
  /** Eerstvolgende coachgesprek in de agenda (ISO), of null als er niets staat. */
  volgendeOp: string | null
  /** Laatste coachgesprek dat al geweest is (ISO, uit de agenda), of null. */
  laatsteGesprekOp: string | null
  /** Alle coachgesprekken in de agenda rond nu (ISO, oplopend), voor de blokjes per week. */
  afspraken: readonly string[]
  /** Alle verslagen, nieuwste eerst. */
  verslagen: EvaluatieJson[]
  openPunten: OpenPunt[]
  opTePakken: OpTePakken
}

/** Wat er voor deze PT'er nu te doen is. */
export type CoachFase = 'verslag' | 'doorplannen' | 'inplannen' | 'geregeld'

const DAG_MS = 24 * 60 * 60 * 1000
/** "Gesprek gehad" telt binnen deze periode — twee weken, zodat één gemiste week niet meteen rood is. */
export const RONDE_DAGEN = 14
/** Een gesprek ouder dan dit vraagt geen verslag meer (zelfde venster als `team.ts`). */
const VERSLAG_VENSTER_DAGEN = 21

/** Het laatste contactmoment: het laatste gesprek in de agenda óf het nieuwste verslag, wat later is. */
export function laatsteContactOp(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>): string | null {
  const verslag = r.verslagen[0]?.aangemaaktOp ?? null
  if (!r.laatsteGesprekOp) return verslag
  if (!verslag) return r.laatsteGesprekOp
  return verslag > r.laatsteGesprekOp ? verslag : r.laatsteGesprekOp
}

/** Had deze PT'er de afgelopen `RONDE_DAGEN` een coachgesprek (agenda of verslag)? */
export function gesprekGehad(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>, nu: Date): boolean {
  const op = laatsteContactOp(r)
  return op !== null && nu.getTime() - new Date(op).getTime() <= RONDE_DAGEN * DAG_MS
}

/** Is het laatste gesprek geweest zonder dat er daarna een verslag is opgeslagen? */
export function verslagOpen(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>, nu: Date): boolean {
  if (!r.laatsteGesprekOp) return false
  const ms = new Date(r.laatsteGesprekOp).getTime()
  if (nu.getTime() - ms > VERSLAG_VENSTER_DAGEN * DAG_MS) return false
  const verslag = r.verslagen[0]?.aangemaaktOp
  return !verslag || new Date(verslag).getTime() < ms
}

// ─── De week van maandag tot en met zondag (besluit Kane 11-11-2026) ─────────
// Kane checkt de coachgesprekken per week: wie had deze week een gesprek, en wie
// een gesprek had moet meteen voor volgende week doorgepland zijn.

/** De kalenderdag in Nederland (YYYY-MM-DD) van een moment. */
export function dagNl(moment: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(moment)
}

function plusDagen(dag: string, n: number): string {
  const [j, m, d] = dag.split('-').map(Number)
  return new Date(Date.UTC(j, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Maandag en zondag (YYYY-MM-DD, Nederlandse kalender) van de week van `nu`. */
export function weekVan(nu: Date): { maandag: string; zondag: string } {
  const dag = dagNl(nu)
  const [j, m, d] = dag.split('-').map(Number)
  const weekdag = (new Date(Date.UTC(j, m - 1, d)).getUTCDay() + 6) % 7 // maandag = 0
  const maandag = plusDagen(dag, -weekdag)
  return { maandag, zondag: plusDagen(maandag, 6) }
}

function inWeek(iso: string | null, week: { maandag: string; zondag: string }): boolean {
  if (!iso) return false
  const dag = dagNl(new Date(iso))
  return dag >= week.maandag && dag <= week.zondag
}

/** Was er deze week (maandag tot en met zondag) al een gesprek: in de agenda geweest of verslag opgeslagen. */
export function gesprekGeweestDezeWeek(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>, nu: Date): boolean {
  return inWeek(laatsteContactOp(r), weekVan(nu))
}

/** Heeft deze PT'er deze week een gesprek: al geweest, of nog gepland binnen deze week. */
export function gesprekDezeWeek(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen' | 'volgendeOp'>, nu: Date): boolean {
  return gesprekGeweestDezeWeek(r, nu) || inWeek(r.volgendeOp, weekVan(nu))
}

/**
 * Wat er nu te doen is. Eerst een open verslag. Een volgende afspraak in de agenda is
 * geregeld. Gesprek deze week gehad zonder volgende afspraak: meteen doorplannen
 * (besluit Kane 11-11-2026, "dit moet ik meteen doen"). Anders inplannen.
 */
export function coachFase(r: CoachRij, nu: Date): CoachFase {
  if (verslagOpen(r, nu)) return 'verslag'
  if (r.volgendeOp) return 'geregeld'
  if (gesprekGeweestDezeWeek(r, nu)) return 'doorplannen'
  return 'inplannen'
}

const FASE_VOLGORDE: Record<CoachFase, number> = { verslag: 0, doorplannen: 1, inplannen: 2, geregeld: 3 }

/**
 * Wat af moet bovenaan: eerst wie een verslag nodig heeft, dan wie nog geen
 * volgende afspraak heeft (nooit gesproken eerst, dan langst geleden), dan wie
 * geregeld is op volgorde van de volgende afspraak.
 */
export function sorteerCoachRijen(rijen: readonly CoachRij[], nu: Date): CoachRij[] {
  return [...rijen].sort((a, b) => {
    const fa = coachFase(a, nu), fb = coachFase(b, nu)
    if (fa !== fb) return FASE_VOLGORDE[fa] - FASE_VOLGORDE[fb]
    if (fa === 'geregeld') return (a.volgendeOp ?? '').localeCompare(b.volgendeOp ?? '') || a.naam.localeCompare(b.naam, 'nl')
    const ca = laatsteContactOp(a), cb = laatsteContactOp(b)
    if (ca === null || cb === null) return ca === cb ? a.naam.localeCompare(b.naam, 'nl') : ca === null ? -1 : 1
    return ca.localeCompare(cb) || a.naam.localeCompare(b.naam, 'nl')
  })
}

export interface CoachTelling {
  totaal: number
  /** Gesprek gehad in de afgelopen `RONDE_DAGEN`. */
  gehad: number
  /** Een volgende afspraak staat in de agenda. */
  ingepland: number
  /** Gesprek geweest, verslag nog niet opgeslagen. */
  teVerslaan: number
  /** Gesprek deze week (maandag tot en met zondag): geweest of nog gepland in deze week. */
  dezeWeek: number
}

export function telCoach(rijen: readonly CoachRij[], nu: Date): CoachTelling {
  return {
    totaal: rijen.length,
    gehad: rijen.filter((r) => gesprekGehad(r, nu)).length,
    ingepland: rijen.filter((r) => r.volgendeOp !== null).length,
    teVerslaan: rijen.filter((r) => verslagOpen(r, nu)).length,
    dezeWeek: rijen.filter((r) => gesprekDezeWeek(r, nu)).length,
  }
}

// ─── Vast patroon per PT'er (besluit Kane 12-11-2026) ─────────────────────────
// Uit de gesprekken van de afgelopen weken: op welke dag en tijd zie je deze
// PT'er meestal? Dat wordt het voorstel bij inplannen, en met een knop plant de
// app alle open weken volgens dat patroon in.

/** Hoeveel gesprekken terug we kijken voor het patroon. */
const PATROON_GESPREKKEN = 6

export interface Patroon {
  /** Dag van de week, 0 = maandag. */
  weekdag: number
  /** Tijd "HH:MM" (Nederlandse tijd). */
  tijd: string
  /** Zo vaak op deze dag (en tijd) in de laatste `van` gesprekken. */
  keer: number
  van: number
}

const DAG_EN_TIJD = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const WEEKDAG_NR: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

function dagEnTijd(iso: string): { weekdag: number; tijd: string } {
  const delen = DAG_EN_TIJD.formatToParts(new Date(iso))
  const deel = (t: string) => delen.find((p) => p.type === t)?.value ?? ''
  return { weekdag: WEEKDAG_NR[deel('weekday')] ?? 0, tijd: `${deel('hour')}:${deel('minute')}` }
}

function meesteVan<T>(lijst: readonly T[], sleutel: (x: T) => string): { x: T; keer: number } | null {
  const tel = new Map<string, { x: T; keer: number }>()
  // Van nieuw naar oud: bij gelijke stand wint de nieuwste.
  for (const x of [...lijst].reverse()) {
    const k = sleutel(x)
    const was = tel.get(k)
    tel.set(k, { x: was?.x ?? x, keer: (was?.keer ?? 0) + 1 })
  }
  let beste: { x: T; keer: number } | null = null
  for (const t of tel.values()) if (!beste || t.keer > beste.keer) beste = t
  return beste
}

/**
 * Het vaste moment van een PT'er: de dag en tijd die in de laatste gesprekken het
 * vaakst voorkomt, minstens twee keer. Zit alleen de dag vast, dan telt die dag met
 * de tijd van het laatste gesprek op die dag. Te weinig gesprekken: geen patroon.
 */
export function patroonVan(afspraken: readonly string[], nu: Date): Patroon | null {
  const geweest = afspraken.filter((a) => new Date(a).getTime() <= nu.getTime()).slice(-PATROON_GESPREKKEN)
  if (geweest.length < 2) return null
  const momenten = geweest.map(dagEnTijd)
  const precies = meesteVan(momenten, (m) => `${m.weekdag}|${m.tijd}`)
  if (precies && precies.keer >= 2) return { ...precies.x, keer: precies.keer, van: momenten.length }
  const dag = meesteVan(momenten, (m) => String(m.weekdag))
  if (dag && dag.keer >= 2) return { ...dag.x, keer: dag.keer, van: momenten.length }
  return null
}

const WEEKDAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const

/** "di 10:00 (4 van de laatste 5)" */
export function patroonLabel(p: Patroon): string {
  return `${WEEKDAG_KORT[p.weekdag]} ${p.tijd} (${p.keer} van de laatste ${p.van})`
}

/** Wat er in een week staat voor een PT'er: geweest, ingepland of nog niets. */
export interface WeekBlok {
  soort: 'geweest' | 'gepland' | 'leeg'
  /** Moment van het gesprek (ISO), of null bij leeg. */
  op: string | null
  /** Voorstel voor inplannen in deze week (YYYY-MM-DD). */
  voorstel: string
  /** Voorgestelde tijd "HH:MM": van het patroon, anders 10:00. */
  tijd: string
  /** Het voorstel komt uit het vaste patroon van deze PT'er. */
  volgensPatroon: boolean
}

const STANDAARD_TIJD = '10:00'

function blokVan(
  afspraken: readonly string[],
  week: { maandag: string; zondag: string },
  nu: Date,
  voorstel: { datum: string; tijd: string; patroon: boolean },
  verslagOp: string | null,
): WeekBlok {
  const v = { voorstel: voorstel.datum, tijd: voorstel.tijd, volgensPatroon: voorstel.patroon }
  const inDeze = afspraken.filter((a) => inWeek(a, week))
  const komend = inDeze.find((a) => new Date(a).getTime() > nu.getTime())
  if (komend) return { soort: 'gepland', op: komend, ...v }
  const geweest = inDeze[inDeze.length - 1] ?? (inWeek(verslagOp, week) ? verslagOp : null)
  if (geweest) return { soort: 'geweest', op: geweest, ...v }
  return { soort: 'leeg', op: null, ...v }
}

/** Het patroonmoment in een week, of null als het al voorbij is (of nu bijna). */
function patroonIn(p: Patroon | null, maandag: string, nu: Date): { datum: string; tijd: string; patroon: boolean } | null {
  if (!p) return null
  const datum = plusDagen(maandag, p.weekdag)
  const vandaag = dagNl(nu)
  if (datum < vandaag) return null
  if (datum === vandaag && p.tijd <= new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(nu)) return null
  return { datum, tijd: p.tijd, patroon: true }
}

/** Zoveel weken na volgende week tonen we ook (over 2 en 3 weken), zodat verder vooruit geplande gesprekken zichtbaar zijn. */
export const VERDER_WEKEN = 2

/**
 * De blokjes per PT'er (besluit Kane 11-11-2026): deze week, volgende week en de twee
 * weken daarna (12-11-2026: "afspraken over 2 of 3 weken ziet hij niet"), elk
 * "geweest op", "ingepland op" of "nog niet ingepland". Het voorstel voor inplannen
 * komt uit het vaste patroon van de PT'er (12-11-2026); zonder patroon of als het
 * moment deze week al voorbij is: deze week morgen (of vandaag op zondag), een latere
 * week dezelfde dag als het gesprek van de week ervoor, anders de maandag, om 10:00.
 */
export function weekBlokken(
  r: Pick<CoachRij, 'afspraken' | 'verslagen'>,
  nu: Date,
): { deze: WeekBlok; volgende: WeekBlok; verder: WeekBlok[]; patroon: Patroon | null } {
  const deze = weekVan(nu)
  const patroon = patroonVan(r.afspraken, nu)
  const vandaag = dagNl(nu)
  const morgen = plusDagen(vandaag, 1)
  const terugvalDeze = { datum: morgen <= deze.zondag ? morgen : vandaag, tijd: STANDAARD_TIJD, patroon: false }
  const blokDeze = blokVan(r.afspraken, deze, nu, patroonIn(patroon, deze.maandag, nu) ?? terugvalDeze, r.verslagen[0]?.aangemaaktOp ?? null)
  const latere: WeekBlok[] = []
  let vorige = blokDeze
  for (let n = 1; n <= 1 + VERDER_WEKEN; n++) {
    const week = { maandag: plusDagen(deze.maandag, 7 * n), zondag: plusDagen(deze.zondag, 7 * n) }
    // Zonder gesprek in de week ervoor: na deze week de maandag, daarna een week na het vorige voorstel.
    const zonderOp = n === 1 ? week.maandag : plusDagen(vorige.voorstel, 7)
    const terugval = { datum: vorige.op ? plusDagen(dagNl(new Date(vorige.op)), 7) : zonderOp, tijd: STANDAARD_TIJD, patroon: false }
    vorige = blokVan(r.afspraken, week, nu, patroonIn(patroon, week.maandag, nu) ?? terugval, null)
    latere.push(vorige)
  }
  const [blokVolgende, ...verder] = latere
  return { deze: blokDeze, volgende: blokVolgende, verder, patroon }
}

/** Een open week die volgens het patroon in te plannen is. */
export interface PatroonVoorstel {
  ptId: string
  naam: string
  week: 'deze' | 'volgende'
  datum: string
  tijd: string
}

/** Alle lege blokjes met een patroonvoorstel: wat de knop "volgens patroon inplannen" zou doen. */
export function patroonVoorstellen(rijen: readonly CoachRij[], nu: Date): PatroonVoorstel[] {
  return rijen.flatMap((r) => {
    const w = weekBlokken(r, nu)
    return (['deze', 'volgende'] as const)
      .map((week) => ({ week, blok: w[week] }))
      .filter(({ blok }) => blok.soort === 'leeg' && blok.volgensPatroon)
      .map(({ week, blok }) => ({ ptId: r.id, naam: r.naam, week, datum: blok.voorstel, tijd: blok.tijd }))
  })
}

/** Geen gesprek deze week: niet geweest en ook niet gepland binnen maandag tot en met zondag. */
export function nietDezeWeek(rijen: readonly CoachRij[], nu: Date): CoachRij[] {
  return rijen.filter((r) => !gesprekDezeWeek(r, nu))
}

/** Gesprek deze week gehad, maar nog geen volgende afspraak: moet meteen doorgepland (ook als het verslag nog open staat). */
export function moetDoorplannen(rijen: readonly CoachRij[], nu: Date): CoachRij[] {
  return rijen.filter((r) => r.volgendeOp === null && gesprekGeweestDezeWeek(r, nu))
}

// ─── Eerst op te pakken ───────────────────────────────────────────────────────

export type OpTePakkenReden = 'te_laat' | 'vandaag' | 'zonder_plan'

export interface OpTePakkenItem {
  lead: Lead
  reden: OpTePakkenReden
}

/** Te laat eerst (oudste opvolgdatum voorop), dan vandaag, dan zonder plan. */
export function eerstOpTePakken(o: OpTePakken, max = 5): OpTePakkenItem[] {
  const alles: OpTePakkenItem[] = [
    ...o.teLaat.map((lead): OpTePakkenItem => ({ lead, reden: 'te_laat' })),
    ...o.vandaag.map((lead): OpTePakkenItem => ({ lead, reden: 'vandaag' })),
    ...o.zonderPlan.map((lead): OpTePakkenItem => ({ lead, reden: 'zonder_plan' })),
  ]
  return alles.slice(0, max)
}

export function opTePakkenTotaal(o: OpTePakken): number {
  return o.teLaat.length + o.vandaag.length + o.zonderPlan.length
}

const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

function dagKort(dag: string): string {
  return DAG_KORT.format(new Date(`${dag}T12:00:00Z`))
}

/** "te laat sinds 3 okt", "vandaag opvolgen", "geen opvolgdatum of volgende stap". */
export function opTePakkenLabel(item: OpTePakkenItem): string {
  if (item.reden === 'te_laat') return item.lead.opvolgdatum ? `te laat sinds ${dagKort(item.lead.opvolgdatum)}` : 'te laat'
  if (item.reden === 'vandaag') return 'vandaag opvolgen'
  return 'geen opvolgdatum of volgende stap'
}

/** Het blok voor het verslag (pdf): de leads die eerst opgepakt moeten worden, stand van nu. */
export function opTePakkenTekst(o: OpTePakken, max = 8): string {
  const totaal = opTePakkenTotaal(o)
  if (totaal === 0) return 'Eerst op te pakken: niets — geen opvolging te laat en elke open lead heeft een plan.'
  const regels = eerstOpTePakken(o, max).map((i) => `• ${i.lead.naam} — ${STATUS_LABEL[i.lead.status]}, ${opTePakkenLabel(i)}`)
  const meer = totaal > max ? [`… en nog ${totaal - max}`] : []
  return [`Eerst op te pakken (${totaal}):`, ...regels, ...meer].join('\n')
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const AFSPRAAK = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })
const DATUM = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

/** "do 9 okt, 14:00" */
export function afspraakLabel(iso: string): string {
  return AFSPRAAK.format(new Date(iso))
}

/** "do 9 okt" */
export function datumLabel(iso: string): string {
  return DATUM.format(new Date(iso))
}
