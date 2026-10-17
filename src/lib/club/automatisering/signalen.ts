// ─── Club: wie krijgt vandaag welke opvolgtaak (PUUR) ───────────────────────
// Deterministisch en idempotent: dezelfde leden, regels en dag geven altijd
// dezelfde aanleidingen in dezelfde volgorde. Elke aanleiding heeft een
// "periode" (bijvoorbeeld de startdatum van het lid of het jaar van de
// verjaardag); lid + regel + periode is uniek in de database, dus nog een keer
// draaien maakt nooit een dubbele taak.

import type { LidStatus } from '@/lib/club/kern/lid'
import { dagNummer } from '@/lib/club/leden/tijd'
import { REGEL_SLEUTELS, type Regel, type RegelSleutel } from './regels'

/** Hoe lang een gemiste aanleiding (proeflid, opzegging) nog op de lijst komt. */
export const INHAAL_DAGEN = 14
/** Een mijlpaal telt als hij in de laatste zoveel dagen is bereikt. */
export const MIJLPAAL_VENSTER = 7

/** Regels die over de huidige stand gaan: klopt de stand niet meer, dan vervalt de open taak. */
export const STAAT_REGELS: ReadonlySet<RegelSleutel> = new Set(['niet_gezien', 'risico', 'opzegging'])

export interface LidSignaal {
  id: string
  status: LidStatus
  /** YYYY-MM-DD of null. */
  lidSinds: string | null
  einddatum: string | null
  geboortedatum: string | null
  /** Dag (YYYY-MM-DD) van het laatste bezoek ooit, of null. */
  laatsteBezoek: string | null
  /** Behoudsscore 0 tot 100, of null als het lid geen score heeft. */
  behoudScore: number | null
  /** Bezoekdagen ooit. */
  bezoekenTotaal: number
  /** Bezoekdagen tot het begin van het mijlpaalvenster. */
  bezoekenVoorVenster: number
}

export interface Aanleiding {
  lidId: string
  regel: RegelSleutel
  periode: string
  /** Het getal bij de aanleiding: dagen, score, leeftijd of bezoeken. */
  waarde: number | null
  /** Korte uitleg voor het team: "Al 16 dagen niet geweest". */
  reden: string
}

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function isDag(v: string | null): v is string {
  return v !== null && /^\d{4}-\d{2}-\d{2}/.test(v)
}

/** Kalenderdagen van `van` tot `tot` (beide YYYY-MM-DD). */
function dagenTussen(van: string, tot: string): number {
  return dagNummer(tot.slice(0, 10)) - dagNummer(van.slice(0, 10))
}

/** "31 okt" */
export function korteDatum(dag: string): string {
  const [, m, d] = dag.slice(0, 10).split('-').map(Number)
  return `${d} ${MAANDEN[m - 1] ?? ''}`.trim()
}

function dagenTekst(n: number): string {
  return n === 1 ? '1 dag' : `${n} dagen`
}

function isSchrikkeljaar(j: number): boolean {
  return (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0
}

/** Is iemand vandaag jarig? Wie op 29 februari is geboren, viert het in gewone jaren op 28 februari. */
export function isJarig(geboortedatum: string, vandaag: string): boolean {
  const geb = geboortedatum.slice(5, 10)
  const nu = vandaag.slice(5, 10)
  if (geb === nu) return true
  return geb === '02-29' && nu === '02-28' && !isSchrikkeljaar(Number(vandaag.slice(0, 4)))
}

function leeftijd(geboortedatum: string, vandaag: string): number {
  return Number(vandaag.slice(0, 4)) - Number(geboortedatum.slice(0, 4))
}

type Toets = (lid: LidSignaal, drempel: number, vandaag: string) => Omit<Aanleiding, 'lidId' | 'regel'> | null

const welkom: Toets = (lid, drempel, vandaag) => {
  if (lid.status !== 'actief' || !isDag(lid.lidSinds)) return null
  const dagen = dagenTussen(lid.lidSinds, vandaag)
  if (dagen < 0 || dagen >= drempel) return null
  return { periode: lid.lidSinds.slice(0, 10), waarde: dagen, reden: dagen === 0 ? 'Vandaag lid geworden' : `Lid sinds ${dagenTekst(dagen)}` }
}

const proefles: Toets = (lid, drempel, vandaag) => {
  if (lid.status !== 'proef' || !isDag(lid.lidSinds)) return null
  const dagen = dagenTussen(lid.lidSinds, vandaag)
  if (dagen < drempel || dagen > drempel + INHAAL_DAGEN) return null
  const keer = lid.bezoekenTotaal === 0 ? 'nog niet geweest' : lid.bezoekenTotaal === 1 ? '1 keer geweest' : `${lid.bezoekenTotaal} keer geweest`
  return { periode: lid.lidSinds.slice(0, 10), waarde: dagen, reden: `Proeflid sinds ${dagenTekst(dagen)}, ${keer}` }
}

const nietGezien: Toets = (lid, drempel, vandaag) => {
  if (lid.status !== 'actief') return null
  const ref = isDag(lid.laatsteBezoek) ? lid.laatsteBezoek : isDag(lid.lidSinds) ? lid.lidSinds : null
  if (!ref) return null
  const dagen = dagenTussen(ref, vandaag)
  if (dagen < drempel) return null
  const reden = isDag(lid.laatsteBezoek) ? `Al ${dagen} dagen niet geweest` : `Nog niet geweest sinds de inschrijving, ${dagen} dagen geleden`
  return { periode: ref.slice(0, 10), waarde: dagen, reden }
}

const risico: Toets = (lid, drempel, vandaag) => {
  if ((lid.status !== 'actief' && lid.status !== 'proef') || lid.behoudScore === null) return null
  if (lid.behoudScore >= drempel) return null
  return { periode: vandaag.slice(0, 7), waarde: lid.behoudScore, reden: `Behoudsscore ${lid.behoudScore} van 100` }
}

const verjaardag: Toets = (lid, _drempel, vandaag) => {
  if (lid.status === 'gestopt' || !isDag(lid.geboortedatum) || !isJarig(lid.geboortedatum, vandaag)) return null
  const jaar = leeftijd(lid.geboortedatum, vandaag)
  return { periode: vandaag.slice(0, 4), waarde: jaar, reden: jaar > 0 && jaar < 120 ? `Wordt vandaag ${jaar}` : 'Is vandaag jarig' }
}

const opzegging: Toets = (lid, _drempel, vandaag) => {
  if (lid.status !== 'opgezegd') return null
  if (!isDag(lid.einddatum)) return { periode: 'opgezegd', waarde: null, reden: 'Heeft opgezegd' }
  const sinds = dagenTussen(lid.einddatum, vandaag)
  if (sinds > INHAAL_DAGEN) return null
  const reden = sinds <= 0 ? `Opgezegd, laatste dag ${korteDatum(lid.einddatum)}` : `Opgezegd, gestopt op ${korteDatum(lid.einddatum)}`
  return { periode: lid.einddatum.slice(0, 10), waarde: null, reden }
}

const mijlpaal: Toets = (lid, stap) => {
  if ((lid.status !== 'actief' && lid.status !== 'proef') || stap <= 0) return null
  const bereikt = Math.floor(lid.bezoekenTotaal / stap) * stap
  if (bereikt < stap || lid.bezoekenVoorVenster >= bereikt) return null
  return { periode: String(bereikt), waarde: bereikt, reden: `${bereikt}e bezoek deze week` }
}

const TOETSEN: Record<RegelSleutel, Toets> = {
  welkom,
  proefles_opvolgen: proefles,
  niet_gezien: nietGezien,
  risico,
  verjaardag,
  opzegging,
  mijlpaal,
}

/**
 * Alle aanleidingen van vandaag, in vaste volgorde: per regel (zoals
 * REGEL_SLEUTELS), daarbinnen op lid-id. Risico slaat leden over die al op
 * "Lang niet gezien" staan (zelfde gesprek, niet dubbel).
 */
export function bepaalAanleidingen(leden: readonly LidSignaal[], regels: readonly Regel[], vandaag: string): Aanleiding[] {
  const aan = new Map(regels.filter((r) => r.aan).map((r) => [r.sleutel, r]))
  const gesorteerd = [...leden].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const uit: Aanleiding[] = []
  const nietGezienIds = new Set<string>()
  for (const sleutel of REGEL_SLEUTELS) {
    const regel = aan.get(sleutel)
    if (!regel) continue
    for (const lid of gesorteerd) {
      if (sleutel === 'risico' && nietGezienIds.has(lid.id)) continue
      const gevonden = TOETSEN[sleutel](lid, regel.drempel ?? 0, vandaag)
      if (!gevonden) continue
      if (sleutel === 'niet_gezien') nietGezienIds.add(lid.id)
      uit.push({ lidId: lid.id, regel: sleutel, ...gevonden })
    }
  }
  return uit
}

export interface BestaandeTaak {
  id: string
  lidId: string
  regel: RegelSleutel
  periode: string
}

export interface Ronde {
  /** Nieuwe taken. Wat al bestaat (ook afgehandeld) houdt de database tegen via de unieke sleutel. */
  nieuw: Aanleiding[]
  /** Open taken waarvan de aanleiding niet meer klopt (lid kwam weer, score herstelde, opzegging ingetrokken). */
  vervallen: string[]
}

function sleutel(lidId: string, regel: string): string {
  return `${lidId}|${regel}`
}

/**
 * Wat er deze ronde moet gebeuren, gegeven de OPEN taken van deze leden.
 * Heeft een lid al een open taak voor een regel, dan komt er geen tweede bij
 * (ook niet voor een nieuwe periode). Taken van leden die niet in `leden`
 * zitten, blijven ongemoeid.
 */
export function planRonde(aanleidingen: readonly Aanleiding[], open: readonly BestaandeTaak[], bekendeLeden: ReadonlySet<string>): Ronde {
  const openSleutels = new Set(open.map((t) => sleutel(t.lidId, t.regel)))
  const nuGeldig = new Set(aanleidingen.map((a) => sleutel(a.lidId, a.regel)))
  const nieuw = aanleidingen.filter((a) => !openSleutels.has(sleutel(a.lidId, a.regel)))
  const vervallen = open
    .filter((t) => STAAT_REGELS.has(t.regel) && bekendeLeden.has(t.lidId) && !nuGeldig.has(sleutel(t.lidId, t.regel)))
    .map((t) => t.id)
    .sort()
  return { nieuw, vervallen }
}
