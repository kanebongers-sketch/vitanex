// ─── LifeOS — Vita's contextblok ────────────────────────────────────────────
// Haalt server-side op wat Vita over vandaag weet, en schrijft het als één
// compact tekstblok dat achter de gecachete persona geplakt wordt.
//
// ─── DRIE STATEN, NOOIT TWEE ────────────────────────────────────────────────
// Elk vak in dit blok staat in precies één van drie staten:
//
//   1. een cijfer          → er is gemeten
//   2. "niet gemeten"      → er is niets, en dat zeggen we
//   3. "niet op te halen"  → de database gaf een fout
//
// Dat derde vak is het belangrijkste van de drie. In MentaForce renderden
// "fout" en "leeg" op drie plekken hetzelfde, waardoor een netwerkstoring aan
// de gebruiker vertelde dat hij niets gemeten had. Een kapotte query mag hier
// dus nooit stil "geen data" worden: dan liegt Vita met volle overtuiging.
//
// ─── DE DAGENLIJST KOMT UIT HET DATUMBEREIK, NIET UIT DE METINGEN ────────────
// De herstel-spine (waar de beweging-regel van signalen.ts op draait) wordt
// opgebouwd uit de laatste N kalenderdagen — niet uit de rijen die toevallig in
// `herstel_metingen` staan. Zou je de dagen uit die tabel halen, dan bestond een
// dag zonder wearable-rij niet voor Vita, ook al trainde je die dag: beweging
// zou dan alleen zichtbaar zijn op precies de dagen dat een ánder apparaat óók
// mat. Slaap en beweging komen uit twee losse bronnen die onafhankelijk kunnen
// falen; ze worden per dag samengevoegd tot de spine.
//
// De client vertelt ons niets. Alles hieronder komt uit de database met de
// service-role, want een score die de browser aanlevert is geen meting maar
// een suggestie.

import type { SupabaseClient } from '@supabase/supabase-js'
import { TIJDZONE, lokaleTijd, datumMinDagen } from './signalen'
import type { HerstelDag, AgendaEvent, Taak } from './signalen'
import {
  actieveMinutenPerDag,
  leesTrainingLogRij,
  type TrainingLog,
} from '@/lib/lifeos/training/actieve-minuten'

/** Hoeveel dagen herstel Vita meekrijgt. Dekt de 5-dagen-beweging-regel ruim. */
const HERSTEL_DAGEN = 7
/** Plafond op het geheugen: een prompt vol oude weetjes is geen context maar ruis. */
const GEHEUGEN_LIMIET = 24

// ─── Vakken ─────────────────────────────────────────────────────────────────

/** Een vak is opgehaald, of het ophalen faalde. Er is geen derde mogelijkheid. */
export type Vak<T> = { ok: true; waarde: T } | { ok: false; melding: string }

export interface Geheugen {
  soort: string
  inhoud: string
  bron: string | null
}

export interface VitaContext {
  /**
   * De herstel-spine: één rij per kalenderdag over de laatste HERSTEL_DAGEN,
   * met slaap én beweging samengevoegd. Dit is wat de regelmotor leest.
   *
   * `ok:false` alleen als BEIDE bronnen faalden — dan valt er niets te zeggen.
   * Faalde er één, dan is de spine er wél (met dat veld op `null`); de motor
   * blijft dan stil op dat veld, wat veilig is: geen vals verwijt.
   */
  herstel: Vak<HerstelDag[]>
  /**
   * De ruwe slaapbron (`herstel_metingen`). Apart bewaard zodat de tekst en de
   * foutrapportage kunnen zeggen "slaap niet op te halen" los van beweging.
   */
  slaapBron: Vak<true>
  /**
   * De ruwe bewegingbron (`trainingen`). Apart, om dezelfde reden: een gefaalde
   * trainingen-query moet als storing tonen, niet als "je bewoog niet".
   */
  beweging: Vak<TrainingLog[]>
  agendaVandaag: Vak<AgendaEvent[]>
  taken: Vak<Taak[]>
  geheugen: Vak<Geheugen[]>
  /** Het moment waarop deze context is opgebouwd. */
  nu: Date
}

/** Heeft dit vak bruikbare data? Een fout is géén data. */
function heeftData<T>(vak: Vak<readonly T[]>): boolean {
  return vak.ok && vak.waarde.length > 0
}

/** Heeft de spine minstens één échte meting (slaap of beweging)? */
function heeftHerstelMeting(vak: Vak<readonly HerstelDag[]>): boolean {
  return vak.ok && vak.waarde.some((d) => d.slaapMinuten !== null || d.actieveMinuten !== null)
}

/** Weet Vita überhaupt iets van deze gebruiker? */
export function isErIetsGemeten(context: VitaContext): boolean {
  return (
    heeftHerstelMeting(context.herstel) ||
    heeftData(context.agendaVandaag) ||
    heeftData(context.taken)
  )
}

/** Welke vakken konden niet opgehaald worden? Voor de UI: fout ≠ leeg. */
export function vakkenMetFout(context: VitaContext): string[] {
  const vakken: [string, Vak<unknown>][] = [
    // De spine zelf niet: die is afgeleid. De onderliggende bronnen wél, want
    // die zijn wat écht faalde en wat de gebruiker moet weten.
    ['slaap', context.slaapBron],
    ['beweging', context.beweging],
    ['agenda', context.agendaVandaag],
    ['taken', context.taken],
    ['geheugen', context.geheugen],
  ]
  return vakken.filter(([, vak]) => !vak.ok).map(([naam]) => naam)
}

// ─── Systeemgrens ───────────────────────────────────────────────────────────
// Supabase-responses zijn een externe grens: we narrowen in plaats van te
// casten. Een kolom die van type verandert wordt hier `null` ("niet gemeten")
// in plaats van een NaN die verderop in een advies belandt.

function alsGetal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function alsTekst(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function alsDatum(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

type Rij = Record<string, unknown>

function naarAgendaEvent(rij: Rij): AgendaEvent | null {
  const startOp = alsDatum(rij.start_op)
  const titel = alsTekst(rij.titel)
  if (!startOp || !titel) return null
  return {
    titel,
    startOp,
    eindOp: alsDatum(rij.eind_op),
    heleDag: rij.hele_dag === true,
  }
}

function naarTaak(rij: Rij): Taak | null {
  const titel = alsTekst(rij.titel)
  if (!titel) return null
  const datum = alsTekst(rij.datum)
  return {
    titel,
    klaar: rij.klaar === true,
    datum: datum ? datum.slice(0, 10) : null,
    top3Positie: alsGetal(rij.top3_positie),
  }
}

function naarGeheugen(rij: Rij): Geheugen | null {
  const inhoud = alsTekst(rij.inhoud)
  const soort = alsTekst(rij.soort)
  if (!inhoud || !soort) return null
  return { soort, inhoud, bron: alsTekst(rij.bron) }
}

// ─── Ophalen ────────────────────────────────────────────────────────────────

interface Antwoord {
  data: unknown
  error: { message: string } | null
}

/** Eén query → één vak. Een fout wordt een fout, nooit een lege lijst. */
async function haalVak<T>(
  belofte: PromiseLike<Antwoord>,
  vertaal: (rij: Rij) => T | null,
): Promise<Vak<T[]>> {
  try {
    const { data, error } = await belofte
    if (error) return { ok: false, melding: error.message }
    if (!Array.isArray(data)) return { ok: false, melding: 'Onverwacht antwoord' }

    const rijen: T[] = []
    for (const rij of data) {
      if (typeof rij !== 'object' || rij === null) continue
      const vertaald = vertaal(rij as Rij)
      if (vertaald) rijen.push(vertaald)
    }
    return { ok: true, waarde: rijen }
  } catch (fout) {
    // Netwerkfout, timeout, DNS. Expliciet een fout — geen lege lijst, want
    // "ik kon je agenda niet ophalen" is iets heel anders dan "je agenda is leeg".
    return { ok: false, melding: fout instanceof Error ? fout.message : 'Onbekende fout' }
  }
}

/** De laatste `aantal` kalenderdagen, nieuwste eerst (matcht de sorteervolgorde). */
function datumReeks(vandaag: string, aantal: number): string[] {
  return Array.from({ length: aantal }, (_, i) => datumMinDagen(vandaag, i))
}

/**
 * Slaapminuten per dag uit de herstel-rijen. Er kunnen meerdere bronnen op één
 * dag staan (Whoop én Oura); we houden de meest complete slaap (de hoogste
 * niet-null waarde) aan. Dubbele-dag-rijen worden zo één antwoord.
 */
function slaapPerDag(rijen: readonly Rij[]): Map<string, number | null> {
  const perDag = new Map<string, number | null>()
  for (const rij of rijen) {
    const datum = alsTekst(rij.datum)
    if (!datum) continue
    const dag = datum.slice(0, 10)
    const slaap = alsGetal(rij.slaap_minuten)
    const huidig = perDag.get(dag) ?? null
    // null blijft null tot er een echte meting is; daarna de hoogste.
    if (slaap !== null && (huidig === null || slaap > huidig)) perDag.set(dag, slaap)
    else if (!perDag.has(dag)) perDag.set(dag, huidig)
  }
  return perDag
}

/**
 * Haalt alles op wat Vita over nu moet weten. Vijf queries parallel — geen
 * waterval, en geen tien losse calls per pagina-load.
 */
export async function haalContext(
  userId: string,
  admin: SupabaseClient,
  nu: Date = new Date(),
): Promise<VitaContext> {
  const vandaag = lokaleTijd(nu).datum
  const dagen = datumReeks(vandaag, HERSTEL_DAGEN)
  const vanaf = datumMinDagen(vandaag, HERSTEL_DAGEN - 1)

  // De agenda halen we op in een ruime UTC-band rond nu en filteren we daarna
  // op lokale dag. Rechtstreeks op "lokale middernacht" filteren zou betekenen
  // dat we de UTC-offset zelf uitrekenen — precies de zomertijd-fout die je één
  // keer per jaar pas ontdekt. Dit kost een handvol extra rijen; dat is niets.
  const band = 36 * 60 * 60 * 1000
  const [slaapRuw, bewegingVak, agendaRuw, taken, geheugen] = await Promise.all([
    // Slaap: ruwe rijen, per bron per dag. We vertalen ze pas hieronder naar een
    // dag-map, want de spine wil één waarde per dag, niet per bron.
    haalVak(
      admin
        .from('herstel_metingen')
        .select('datum, slaap_minuten')
        .eq('user_id', userId)
        .gte('datum', vanaf)
        .order('datum', { ascending: false }),
      (rij) => rij,
    ),
    // Beweging: trainingen in het venster, gepland én gedaan. actieveMinutenPerDag
    // filtert de voornemens er zelf uit (een plan is geen meting).
    haalVak(
      admin
        .from('trainingen')
        .select('datum, gepland, actieve_minuten')
        .eq('user_id', userId)
        .gte('datum', vanaf),
      leesTrainingLogRij,
    ),
    haalVak(
      admin
        .from('agenda_events')
        .select('titel, start_op, eind_op, hele_dag')
        .eq('user_id', userId)
        .gte('start_op', new Date(nu.getTime() - band).toISOString())
        .lte('start_op', new Date(nu.getTime() + band).toISOString())
        .order('start_op', { ascending: true }),
      naarAgendaEvent,
    ),
    haalVak(
      admin
        .from('taken')
        .select('titel, klaar, datum, top3_positie')
        .eq('user_id', userId)
        .eq('klaar', false)
        .order('top3_positie', { ascending: true, nullsFirst: false }),
      naarTaak,
    ),
    haalVak(
      admin
        .from('vita_geheugen')
        .select('soort, inhoud, bron')
        .eq('user_id', userId)
        .order('laatst_gebruikt_op', { ascending: false, nullsFirst: false })
        .limit(GEHEUGEN_LIMIET),
      naarGeheugen,
    ),
  ])

  // ── De spine samenstellen ──────────────────────────────────────────────────
  const slaapMap = slaapRuw.ok ? slaapPerDag(slaapRuw.waarde) : new Map<string, number | null>()
  const bewegingMap = bewegingVak.ok
    ? actieveMinutenPerDag(bewegingVak.waarde, dagen)
    : new Map<string, number | null>()

  // Faalde ALLES van herstel, dan is de spine een fout — anders bestaat hij, met
  // per veld `null` waar die bron faalde. De motor blijft op een null-veld stil.
  const herstel: Vak<HerstelDag[]> =
    !slaapRuw.ok && !bewegingVak.ok
      ? { ok: false, melding: 'Herstelgegevens niet op te halen.' }
      : {
          ok: true,
          waarde: dagen.map((dag) => ({
            datum: dag,
            slaapMinuten: slaapMap.get(dag) ?? null,
            actieveMinuten: bewegingMap.get(dag) ?? null,
          })),
        }

  // `slaapBron` draagt alleen de ok/fout-status van de slaapquery, voor de tekst
  // en de foutrapportage. De echte slaapwaarden zitten al in de spine.
  const slaapBron: Vak<true> = slaapRuw.ok
    ? { ok: true, waarde: true }
    : { ok: false, melding: slaapRuw.melding }

  const agendaVandaag: Vak<AgendaEvent[]> = agendaRuw.ok
    ? { ok: true, waarde: agendaRuw.waarde.filter((e) => lokaleTijd(e.startOp).datum === vandaag) }
    : agendaRuw

  return { herstel, slaapBron, beweging: bewegingVak, agendaVandaag, taken, geheugen, nu }
}

// ─── Schrijven ──────────────────────────────────────────────────────────────

/**
 * De regel die een kapot vak markeert. Bewust hard geformuleerd: het model moet
 * dit als "ik weet het niet" lezen, niet als "er is niets".
 */
const FOUT_REGEL = 'NIET OP TE HALEN (technische storing). Zeg dit eerlijk; doe geen uitspraak alsof dit vak leeg is.'

const KLOK_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const TIJD_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIJDZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Rendert een vak: fout, leeg of regels. Nooit twee daarvan door elkaar. */
function schrijfVak<T>(
  kop: string,
  vak: Vak<readonly T[]>,
  leegTekst: string,
  regel: (item: T) => string,
): string {
  if (!vak.ok) return `## ${kop}\n${FOUT_REGEL}`
  if (vak.waarde.length === 0) return `## ${kop}\n${leegTekst}`
  return `## ${kop}\n${vak.waarde.map(regel).join('\n')}`
}

function slaapTekst(minuten: number | null): string {
  if (minuten === null) return 'niet gemeten'
  return `${Math.floor(minuten / 60)}u${String(minuten % 60).padStart(2, '0')}`
}

/**
 * De slaap-sectie. Keyt op `slaapBron`: faalde de slaapquery, dan FOUT_REGEL —
 * ook al bestaat de spine (die kan uit de bewegingbron komen). Zo blijft "niet
 * op te halen" gescheiden van "niet gemeten".
 */
function schrijfSlaap(context: VitaContext): string {
  const kop = `Slaap (laatste ${HERSTEL_DAGEN} dagen)`
  if (!context.slaapBron.ok) return `## ${kop}\n${FOUT_REGEL}`
  if (!context.herstel.ok) return `## ${kop}\n${FOUT_REGEL}`

  const gemeten = context.herstel.waarde.filter((d) => d.slaapMinuten !== null)
  if (gemeten.length === 0) {
    return `## ${kop}\nGeen slaap gemeten. Er is niets gemeten — dat is geen slecht cijfer, het is geen cijfer.`
  }
  return `## ${kop}\n${gemeten.map((d) => `- ${d.datum} — ${slaapTekst(d.slaapMinuten)}`).join('\n')}`
}

/**
 * De beweging-sectie. Keyt op `beweging` (de trainingen-bron): een gefaalde
 * query toont FOUT_REGEL, niet "je bewoog niet". Toont de dagen mét een gemeten
 * waarde; een dag zonder meting (null) is stilte, geen nul.
 */
function schrijfBeweging(context: VitaContext): string {
  const kop = `Beweging (laatste ${HERSTEL_DAGEN} dagen)`
  if (!context.beweging.ok) return `## ${kop}\n${FOUT_REGEL}`
  if (!context.herstel.ok) return `## ${kop}\n${FOUT_REGEL}`

  const gemeten = context.herstel.waarde.filter((d) => d.actieveMinuten !== null)
  if (gemeten.length === 0) {
    return `## ${kop}\nGeen beweging gelogd. Dit beschrijft het logboek, niet je lichaam — een niet-synchroniserende meter is geen luiheid.`
  }
  return `## ${kop}\n${gemeten.map((d) => `- ${d.datum} — ${d.actieveMinuten} min actief`).join('\n')}`
}

function agendaRegel(event: AgendaEvent): string {
  if (event.heleDag) return `- hele dag — ${event.titel}`
  const start = TIJD_FMT.format(event.startOp)
  const eind = event.eindOp ? TIJD_FMT.format(event.eindOp) : 'eindtijd onbekend'
  return `- ${start}–${eind} — ${event.titel}`
}

function taakRegel(taak: Taak): string {
  const plek = taak.top3Positie === null ? 'overig' : `top-3 #${taak.top3Positie}`
  const dag = taak.datum ?? 'geen dag'
  return `- [${plek}] ${taak.titel} (${dag})`
}

function geheugenRegel(item: Geheugen): string {
  const bron = item.bron ? ` (bron: ${item.bron})` : ' (bron onbekend — onbevestigd)'
  return `- ${item.soort}: ${item.inhoud}${bron}`
}

/** Zet een opgehaalde context om in het tekstblok voor de prompt. */
export function schrijfContextBlok(context: VitaContext): string {
  return [
    `# Context — opgebouwd op ${KLOK_FMT.format(context.nu)} (${TIJDZONE})`,
    '',
    schrijfSlaap(context),
    '',
    schrijfBeweging(context),
    '',
    schrijfVak('Agenda vandaag', context.agendaVandaag, 'Geen afspraken vandaag.', agendaRegel),
    '',
    schrijfVak('Open taken', context.taken, 'Geen open taken.', taakRegel),
    '',
    schrijfVak(
      'Wat ik over Kane onthoud',
      context.geheugen,
      'Nog niets onthouden.',
      geheugenRegel,
    ),
  ].join('\n')
}

/**
 * Haalt de context op en schrijft hem als één compact tekstblok.
 *
 * Dit blok is volatiel (het verandert elk uur) en hoort dus ACHTER de gecachete
 * persona in de systeemprompt — zie `persona.ts` en de vraag-route.
 */
export async function bouwContextBlok(
  userId: string,
  admin: SupabaseClient,
  nu: Date = new Date(),
): Promise<string> {
  return schrijfContextBlok(await haalContext(userId, admin, nu))
}
