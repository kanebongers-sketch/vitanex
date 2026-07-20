// ─── LifeOS — taken & top-3 ─────────────────────────────────────────────────
// Vervangt Todoist. Niet door Todoist na te bouwen — door de enige vraag te
// beantwoorden die 's ochtends telt: welke drie dingen doe ik vandaag?
//
// Puur bestand: geen fetch, geen DB, geen React. De validatie hieronder is de
// systeemgrens (user input), en die is hier testbaar zonder database.
//
// De regels staan óók in de database (migratie 020). Dat is geen duplicatie
// maar diepteverdediging met verschillende doelen: de database garandeert dat
// er nooit twee taken op positie 1 staan, deze laag geeft je een nette
// Nederlandse foutmelding in plaats van "23505".

// Relatief, niet via `@/`: er is (nog) geen vitest-config met die alias, en de
// hele lib-laag draait daarom op relatieve imports. Zie `pijlers/score.ts`.
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import { isProjectId } from '@/lib/lifeos/projecten/projecten'
// De vier feiten worden HIER gelezen maar DAAR gedefinieerd: `prioriteit.ts` is
// de canonieke laag voor wat impact/inspanning/energie betekenen en welke
// waarden geldig zijn. Deze module leent die kennis in plaats van 'm te kopiëren.
//
// Let op de richting: `prioriteit.ts` importeert hier alleen `type Taak` — een
// type-only import, die bij het compileren verdwijnt. Er is dus geen cyclus op
// runtime; alleen dit bestand hangt écht van `prioriteit.ts` af.
import {
  isEnergieNiveau,
  leesImpact,
  leesInspanning,
  MAX_IMPACT,
  MAX_INSPANNING,
  MIN_IMPACT,
  MIN_INSPANNING,
  type EnergieNiveau,
} from '@/lib/lifeos/taken/prioriteit'

export const MAX_TITEL_LENGTE = 500
export const MAX_NOTITIE_LENGTE = 4000

export type Top3Positie = 1 | 2 | 3
export const TOP3_POSITIES: readonly Top3Positie[] = Object.freeze([1, 2, 3])

/**
 * Een taak, zoals hij uit de database komt én over de draad gaat.
 *
 * De vier feiten (impact, inspanning, energie, deadline) zijn allemaal nullable,
 * en dat is de belangrijkste eigenschap van dit type: `null` betekent "hier is
 * nog geen oordeel over geveld" en NOOIT "midden" of "nul". Een net gedumpte
 * taak weet niets van zichzelf, en dat mag. `prioriteit.ts` weigert dan te
 * scoren in plaats van iets te verzinnen.
 *
 * Er staat bewust géén `prioriteit`-veld bij: dat is een conclusie uit deze
 * feiten, geen feit. Zie de kop van migratie 100.
 */
export interface Taak {
  id: string
  titel: string
  notitie: string | null
  klaar: boolean
  /** ISO-moment waarop je 'm afvinkte, of null. */
  klaarOp: string | null
  /** Dagsleutel (YYYY-MM-DD), of null = "ooit". Het VOORNEMEN: welke dag plan je 'm. */
  datum: string | null
  top3Positie: Top3Positie | null
  /** 1-5. Hoeveel maakt dit uit? null = nog geen oordeel (≠ 3). */
  impact: number | null
  /** Wat kost het, in minuten? null = onbekend (≠ 0, en ≠ "past vast wel"). */
  inspanningMinuten: number | null
  energie: EnergieNiveau | null
  /** Dagsleutel. De VERPLICHTING: wanneer moet het áf. Los van `datum`. */
  deadline: string | null
  projectId: string | null
  aangemaaktOp: string
}

/**
 * De vier feiten en het project zijn optioneel bij het aanmaken: een taak die je
 * snel dumpt — of die via Telegram binnenkomt — heeft ze nog niet, en dat is een
 * geldige staat, geen halve taak. Weglaten is iets anders dan op null zetten
 * bedoelen; hier komen ze allebei op null uit, want er ís nog geen oordeel.
 */
export interface NieuweTaak {
  titel: string
  notitie: string | null
  datum: string | null
  top3Positie: Top3Positie | null
  impact?: number | null
  inspanningMinuten?: number | null
  energie?: EnergieNiveau | null
  deadline?: string | null
  projectId?: string | null
}

/** Alleen de velden die je meestuurt worden gewijzigd. */
export interface TaakWijziging {
  titel?: string
  notitie?: string | null
  klaar?: boolean
  datum?: string | null
  top3Positie?: Top3Positie | null
  impact?: number | null
  inspanningMinuten?: number | null
  energie?: EnergieNiveau | null
  deadline?: string | null
  projectId?: string | null
}

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function leesTitel(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Titel ontbreekt.' }
  const titel = v.trim()
  if (titel.length === 0) return { ok: false, fout: 'Een taak zonder titel is geen taak.' }
  if (titel.length > MAX_TITEL_LENGTE) {
    return { ok: false, fout: `Titel mag maximaal ${MAX_TITEL_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: titel }
}

function leesNotitie(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: 'Notitie moet tekst zijn.' }
  const notitie = v.trim()
  if (notitie.length === 0) return { ok: true, waarde: null }
  if (notitie.length > MAX_NOTITIE_LENGTE) {
    return { ok: false, fout: `Notitie mag maximaal ${MAX_NOTITIE_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: notitie }
}

/**
 * Een dagsleutel (YYYY-MM-DD) of niets. `veld` staat in de melding, zodat een
 * verkeerde deadline niet klaagt over "de datum" — dat zijn twee verschillende
 * dingen op dezelfde taak.
 */
function leesDagsleutel(v: unknown, veld: string): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (typeof v !== 'string') return { ok: false, fout: `${veld} moet YYYY-MM-DD zijn.` }
  if (leesDatumSleutel(v) === null) return { ok: false, fout: `${veld} moet YYYY-MM-DD zijn.` }
  return { ok: true, waarde: v }
}

function leesDatum(v: unknown): Validatie<string | null> {
  return leesDagsleutel(v, 'Datum')
}

function leesDeadline(v: unknown): Validatie<string | null> {
  return leesDagsleutel(v, 'Deadline')
}

// De drie feiten-lezers hieronder vertalen het drie-statenmodel van
// `prioriteit.ts` (`null` = niet opgegeven, `undefined` = fout) naar de
// `Validatie<T>` van deze laag. De grenzen zelf staan daar; hier staat alleen
// hoe we het in het Nederlands zeggen.

function leesImpactVeld(v: unknown): Validatie<number | null> {
  const impact = leesImpact(v)
  if (impact === undefined) {
    return { ok: false, fout: `Impact is een heel getal van ${MIN_IMPACT} tot en met ${MAX_IMPACT}.` }
  }
  return { ok: true, waarde: impact }
}

function leesInspanningVeld(v: unknown): Validatie<number | null> {
  const minuten = leesInspanning(v)
  if (minuten === undefined) {
    return {
      ok: false,
      fout: `Inspanning is een heel aantal minuten van ${MIN_INSPANNING} tot en met ${MAX_INSPANNING}. Meer dan dat is geen taak maar een project.`,
    }
  }
  return { ok: true, waarde: minuten }
}

function leesEnergie(v: unknown): Validatie<EnergieNiveau | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (!isEnergieNiveau(v)) return { ok: false, fout: "Energie is 'laag', 'midden' of 'hoog'." }
  return { ok: true, waarde: v }
}

function leesProject(v: unknown): Validatie<string | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (!isProjectId(v)) return { ok: false, fout: 'Dat is geen geldig project.' }
  return { ok: true, waarde: v }
}

export function isTop3Positie(v: unknown): v is Top3Positie {
  return v === 1 || v === 2 || v === 3
}

function leesTop3(v: unknown): Validatie<Top3Positie | null> {
  if (v === null || v === undefined) return { ok: true, waarde: null }
  if (!isTop3Positie(v)) return { ok: false, fout: 'Top-3-positie is 1, 2 of 3.' }
  return { ok: true, waarde: v }
}

/**
 * De vier feiten + het project uit een body. Apart van `leesNieuweTaak`, want
 * `leesTaakWijziging` leest exact dezelfde velden met exact dezelfde regels —
 * en twee kopieën daarvan lopen gegarandeerd uit elkaar.
 */
type Feiten = Required<Pick<NieuweTaak, 'impact' | 'inspanningMinuten' | 'energie' | 'deadline' | 'projectId'>>

function leesFeiten(body: Record<string, unknown>): Validatie<Feiten> {
  const impact = leesImpactVeld(body.impact)
  if (!impact.ok) return impact
  const inspanningMinuten = leesInspanningVeld(body.inspanningMinuten)
  if (!inspanningMinuten.ok) return inspanningMinuten
  const energie = leesEnergie(body.energie)
  if (!energie.ok) return energie
  const deadline = leesDeadline(body.deadline)
  if (!deadline.ok) return deadline
  const projectId = leesProject(body.projectId)
  if (!projectId.ok) return projectId

  return {
    ok: true,
    waarde: {
      impact: impact.waarde,
      inspanningMinuten: inspanningMinuten.waarde,
      energie: energie.waarde,
      deadline: deadline.waarde,
      projectId: projectId.waarde,
    },
  }
}

/** Nieuwe taak uit een request-body. Faalt met een leesbare melding. */
export function leesNieuweTaak(body: unknown): Validatie<NieuweTaak> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const titel = leesTitel(body.titel)
  if (!titel.ok) return titel
  const notitie = leesNotitie(body.notitie)
  if (!notitie.ok) return notitie
  const datum = leesDatum(body.datum)
  if (!datum.ok) return datum
  const top3Positie = leesTop3(body.top3Positie)
  if (!top3Positie.ok) return top3Positie
  const feiten = leesFeiten(body)
  if (!feiten.ok) return feiten

  // Spiegelt de check-constraint in de database: een top-3 is de top-3 VAN EEN
  // DAG. Zonder dag bestaat positie 1 niet.
  if (top3Positie.waarde !== null && datum.waarde === null) {
    return { ok: false, fout: 'Een top-3-positie hoort bij een dag; geef ook een datum mee.' }
  }

  return {
    ok: true,
    waarde: {
      titel: titel.waarde,
      notitie: notitie.waarde,
      datum: datum.waarde,
      top3Positie: top3Positie.waarde,
      ...feiten.waarde,
    },
  }
}

/**
 * Wijziging uit een request-body. Alleen aanwezige velden tellen — zo kun je
 * afvinken zonder de rest van de taak mee te sturen, en zo blijft "veld
 * weggelaten" (laat maar staan) iets anders dan "veld op null" (haal weg).
 */
export function leesTaakWijziging(body: unknown): Validatie<TaakWijziging> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const kern = leesKernWijziging(body)
  if (!kern.ok) return kern
  const feiten = leesFeitenWijziging(body)
  if (!feiten.ok) return feiten

  const wijziging: TaakWijziging = { ...kern.waarde, ...feiten.waarde }

  if (Object.keys(wijziging).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }

  return { ok: true, waarde: wijziging }
}

/** Wat de taak ís: titel, notitie, klaar, dag, top-3-plek. */
function leesKernWijziging(body: Record<string, unknown>): Validatie<TaakWijziging> {
  const wijziging: TaakWijziging = {}

  if ('titel' in body) {
    const titel = leesTitel(body.titel)
    if (!titel.ok) return titel
    wijziging.titel = titel.waarde
  }
  if ('notitie' in body) {
    const notitie = leesNotitie(body.notitie)
    if (!notitie.ok) return notitie
    wijziging.notitie = notitie.waarde
  }
  if ('klaar' in body) {
    if (typeof body.klaar !== 'boolean') return { ok: false, fout: 'Klaar is waar of niet waar.' }
    wijziging.klaar = body.klaar
  }
  if ('datum' in body) {
    const datum = leesDatum(body.datum)
    if (!datum.ok) return datum
    wijziging.datum = datum.waarde
  }
  if ('top3Positie' in body) {
    const top3 = leesTop3(body.top3Positie)
    if (!top3.ok) return top3
    wijziging.top3Positie = top3.waarde
  }

  return { ok: true, waarde: wijziging }
}

/** Wat we over de taak weten: de vier feiten + het project. */
function leesFeitenWijziging(body: Record<string, unknown>): Validatie<TaakWijziging> {
  const wijziging: TaakWijziging = {}

  if ('impact' in body) {
    const impact = leesImpactVeld(body.impact)
    if (!impact.ok) return impact
    wijziging.impact = impact.waarde
  }
  if ('inspanningMinuten' in body) {
    const minuten = leesInspanningVeld(body.inspanningMinuten)
    if (!minuten.ok) return minuten
    wijziging.inspanningMinuten = minuten.waarde
  }
  if ('energie' in body) {
    const energie = leesEnergie(body.energie)
    if (!energie.ok) return energie
    wijziging.energie = energie.waarde
  }
  if ('deadline' in body) {
    const deadline = leesDeadline(body.deadline)
    if (!deadline.ok) return deadline
    wijziging.deadline = deadline.waarde
  }
  if ('projectId' in body) {
    const projectId = leesProject(body.projectId)
    if (!projectId.ok) return projectId
    wijziging.projectId = projectId.waarde
  }

  return { ok: true, waarde: wijziging }
}

// ─── Systeemgrens: rijen uit de database ────────────────────────────────────

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/** Een dagsleutel, of null als het er geen is. */
function dagsleutel(v: unknown): string | null {
  const s = tekst(v)
  if (s === null) return null
  return leesDatumSleutel(s) === null ? null : s
}

/**
 * De vier feiten uit een rij/antwoord, ongeacht de schrijfwijze van de sleutels.
 *
 * Een waarde buiten de schaal wordt `null`, niet een fout: dezelfde keuze als
 * bij `top3_positie` hierboven. Een kapotte waarde uit de database betekent dat
 * we het niet weten — en "we weten het niet" is precies wat null hier zegt. De
 * database bewaakt de grenzen (migratie 100); dit is de tweede verdediging.
 */
function feitenVan(bron: Record<string, unknown>, sleutels: FeitSleutels): TaakFeitenVelden {
  // Eerst uit de bak halen, dán narrowen: een type-guard grijpt niet op
  // `bron[sleutels.energie]` — bij een sleutel die pas op runtime bekend is,
  // blijft de uitkomst `unknown`. Via een lokale const werkt de narrowing wél.
  const energie = bron[sleutels.energie]
  const projectId = bron[sleutels.projectId]

  return {
    impact: leesImpact(bron[sleutels.impact]) ?? null,
    inspanningMinuten: leesInspanning(bron[sleutels.inspanning]) ?? null,
    energie: isEnergieNiveau(energie) ? energie : null,
    deadline: dagsleutel(bron[sleutels.deadline]),
    projectId: isProjectId(projectId) ? projectId : null,
  }
}

interface FeitSleutels {
  impact: string
  inspanning: string
  energie: string
  deadline: string
  projectId: string
}

type TaakFeitenVelden = Pick<
  Taak,
  'impact' | 'inspanningMinuten' | 'energie' | 'deadline' | 'projectId'
>

/** De database schrijft snake_case. */
const RIJ_SLEUTELS: FeitSleutels = {
  impact: 'impact',
  inspanning: 'inspanning_minuten',
  energie: 'energie',
  deadline: 'deadline',
  projectId: 'project_id',
}

/** Onze eigen API schrijft camelCase. */
const JSON_SLEUTELS: FeitSleutels = {
  impact: 'impact',
  inspanning: 'inspanningMinuten',
  energie: 'energie',
  deadline: 'deadline',
  projectId: 'projectId',
}

export function taakVanRij(rij: unknown): Taak | null {
  if (!isObject(rij)) return null

  const id = tekst(rij.id)
  const titel = tekst(rij.titel)
  const aangemaaktOp = tekst(rij.aangemaakt_op)
  if (id === null || titel === null || aangemaaktOp === null) return null

  return {
    id,
    titel,
    notitie: tekst(rij.notitie),
    klaar: rij.klaar === true,
    klaarOp: tekst(rij.klaar_op),
    datum: tekst(rij.datum),
    top3Positie: isTop3Positie(rij.top3_positie) ? rij.top3_positie : null,
    ...feitenVan(rij, RIJ_SLEUTELS),
    aangemaaktOp,
  }
}

export function takenVanRijen(rijen: readonly unknown[]): Taak[] {
  return rijen.map(taakVanRij).filter((t): t is Taak => t !== null)
}

// ─── Systeemgrens: het antwoord van onze eigen API ──────────────────────────
// De database geeft snake_case, de API camelCase. Dat is geen duplicatie maar
// twee echt verschillende vormen — en beide worden gelezen, niet gecast.

/** Eén taak zoals hij over de draad komt. */
export function leesTaakJson(ruw: unknown): Taak | null {
  if (!isObject(ruw)) return null

  const id = tekst(ruw.id)
  const titel = tekst(ruw.titel)
  const aangemaaktOp = tekst(ruw.aangemaaktOp)
  if (id === null || titel === null || aangemaaktOp === null) return null

  return {
    id,
    titel,
    notitie: tekst(ruw.notitie),
    klaar: ruw.klaar === true,
    klaarOp: tekst(ruw.klaarOp),
    datum: tekst(ruw.datum),
    top3Positie: isTop3Positie(ruw.top3Positie) ? ruw.top3Positie : null,
    ...feitenVan(ruw, JSON_SLEUTELS),
    aangemaaktOp,
  }
}

/** Het antwoord van `GET /api/taken`. */
export function leesTakenAntwoord(ruw: unknown): Taak[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.taken)) return null

  const taken = ruw.taken.map(leesTaakJson)
  if (taken.some((t) => t === null)) return null
  return taken.filter((t): t is Taak => t !== null)
}

/** Het antwoord van `POST /api/taken` en `PATCH /api/taken/[id]`. */
export function leesTaakAntwoord(ruw: unknown): Taak | null {
  if (!isObject(ruw)) return null
  return leesTaakJson(ruw.taak)
}

/**
 * De drie plekken van de top-3, op volgorde. Een lege plek is `null` — geen
 * ingeschoven taak, want dan zou positie 3 stilletjes positie 1 worden.
 */
export function top3Van(taken: readonly Taak[]): (Taak | null)[] {
  return TOP3_POSITIES.map((positie) => taken.find((t) => t.top3Positie === positie) ?? null)
}

/** De laagste vrije top-3-plek, of null als alle drie bezet zijn. */
export function eersteVrijePositie(taken: readonly Taak[]): Top3Positie | null {
  return TOP3_POSITIES.find((positie) => !taken.some((t) => t.top3Positie === positie)) ?? null
}

/**
 * Alle taken van één dag — open ÉN afgevinkt.
 *
 * Dit is de invoer voor `top3Van` en `eersteVrijePositie`, en dat "ÉN afgevinkt"
 * is geen detail. Een afgevinkte top-3-taak houdt zijn plek: de unieke index uit
 * migratie 020 kijkt niet naar `klaar`, dus plek 1 blijft bezet zolang die taak
 * er staat. Zou je hier alleen de open taken doorgeven, dan liet de UI plek 1
 * als "Nog leeg" zien, bood hij 'm opnieuw aan, en kreeg je een 409 van de
 * database — terwijl je alleen maar je belangrijkste taak had afgemaakt.
 *
 * En het is ook gewoon waar: je koos vanochtend drie dingen. Dat er één af is,
 * maakt de keuze niet ongedaan.
 */
export function takenVanDag(taken: readonly Taak[], dagSleutel: string): Taak[] {
  return taken.filter((t) => t.datum === dagSleutel)
}

// ─── De volledige lijst, gegroepeerd ────────────────────────────────────────
// `top3Van` beantwoordt "welke drie vandaag?". Deze groepering beantwoordt de
// andere helft: waar staat de rest? Bot-taken (via Telegram) komen als
// positie-loze taken binnen — met of zonder dag — en waren nergens zichtbaar
// tot de taken-UI ze hier toont.

export interface GegroepeerdeTaken {
  /** Open taken van vandaag; de top-3 staat hier vooraan (positie oplopend). */
  vandaag: Taak[]
  /** Open taken waarvan de deadline verstreken is — of, zonder deadline, de dag. */
  teLaat: Taak[]
  /** Open taken die nog moeten komen: een dag of deadline in de toekomst. */
  later: Taak[]
  /** Open taken zonder dag én zonder deadline — de "ooit"-bak; hier landen ook dagloze bot-taken. */
  ooit: Taak[]
  /** Afgevinkte taken, nieuwste afvinking eerst. */
  gedaan: Taak[]
}

/**
 * De dag waarop een taak wordt afgerekend: de deadline als die er is, anders de
 * geplande dag.
 *
 * Dit is de kern van de splitsing. `datum` is een VOORNEMEN ("ik doe dit
 * maandag") en `deadline` een VERPLICHTING ("dit moet vrijdag af"). Loopt een
 * voornemen uit maar staat de verplichting nog open, dan ben je niet te laat —
 * je hebt optimistisch gepland. De deadline heeft dus het laatste woord, en pas
 * zonder deadline is de geplande dag het enige signaal dat we hebben.
 *
 * Eerlijke prijs: een taak die je maandag wilde doen met een deadline volgende
 * maand staat niet bij "te laat", terwijl hij wél over zijn geplande dag is. Dat
 * is met opzet — hem rood maken zou een alarm zijn dat nergens op slaat, en een
 * alarm dat vaak onterecht is, leer je negeren.
 */
function afrekendag(taak: Taak): string | null {
  return taak.deadline ?? taak.datum
}

/**
 * Is deze taak over tijd? Dagsleutels zijn YYYY-MM-DD en dus lexicografisch
 * gelijk aan chronologisch — `<` is hier een echte datumvergelijking, geen truc.
 */
function isTeLaat(taak: Taak, vandaagSleutel: string): boolean {
  const dag = afrekendag(taak)
  return dag !== null && dag < vandaagSleutel
}

/**
 * Verdeelt alle taken over de vijf bakken van de lijst. Elke taak zit in precies
 * één bak: 'gedaan' wint van alles (een afgevinkte taak is klaar, waar hij ook
 * stond), dan 'vandaag' (wat je vandaag van plan bent), en pas daarna splitst de
 * tijd de rest in te laat / later / ooit.
 *
 * Waarom 'vandaag' vóór 'te laat' gaat: een taak die je op vandaag zette staat
 * op je lijst voor vandaag — ook als zijn deadline gisteren was. Dat hij te laat
 * is, hoor je van zijn score ("Deadline was gisteren"), niet van een tweede plek
 * in de lijst. De bak is de kalender; de score is de urgentie.
 *
 * Puur en immutable: filtert naar nieuwe arrays, sorteert op een kopie. De
 * volgorde bínnen een bak volgt de serverorde (top-3 vooraan, dan aanmaak),
 * behalve 'gedaan' — daar is de nieuwste afvinking het interessantst.
 */
export function groepeerTaken(
  taken: readonly Taak[],
  vandaagSleutel: string,
): GegroepeerdeTaken {
  const open = taken.filter((t) => !t.klaar)
  const gedaan = taken.filter((t) => t.klaar).slice().sort(nieuwsteAfvinkingEerst)

  const rest = open.filter((t) => t.datum !== vandaagSleutel)
  const komtNog = rest.filter((t) => !isTeLaat(t, vandaagSleutel))

  return {
    vandaag: open.filter((t) => t.datum === vandaagSleutel),
    teLaat: rest.filter((t) => isTeLaat(t, vandaagSleutel)),
    // Een taak zonder dag maar mét een deadline is geen "ooit": hij moet ergens
    // voor die datum gebeuren, je hebt alleen nog niet gezegd wanneer.
    later: komtNog.filter((t) => t.datum !== null || t.deadline !== null),
    ooit: komtNog.filter((t) => t.datum === null && t.deadline === null),
    gedaan,
  }
}

/** Nieuwste afvinking eerst; zonder afvink-moment val terug op de aanmaak. */
function nieuwsteAfvinkingEerst(a: Taak, b: Taak): number {
  const aMoment = a.klaarOp ?? a.aangemaaktOp
  const bMoment = b.klaarOp ?? b.aangemaaktOp
  return bMoment.localeCompare(aMoment)
}
