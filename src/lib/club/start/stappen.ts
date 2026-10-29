// ─── Club: de startwizard van een nieuwe sportschool (PUUR) ─────────────────
// Na aanmelden en betalen loopt de eigenaar acht korte stappen door, te
// hervatten waar hij was. De eerste stap is de soort sportschool: die vult de
// stappen daarna alvast in; elke stap stelt zijn deel echt en volledig in.
// De voortgang staat per sportschool in club_organisaties.instellingen onder
// `start`: { stap, klaar[], afgerond_op, soort, streefdatum, bevestigd[] }.
// Of een stap af is, volgt uit de echte data (zie stapAf): een stap telt pas
// als zijn inhoud er staat, of als de eigenaar bewust koos voor "geen" (ik
// werk alleen, ik begin zonder leden). Wie het via een andere weg al deed,
// hoeft hier niets dubbel te doen.
// Lezen is vergevingsgezind (kapot = geen voortgang), opslaan is streng.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { heeftEigenOpeningstijden } from '@/lib/club/instellingen/vestigingen-invoer'
import { isSportschoolSoort, type SportschoolSoort } from './soorten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

// De Nederlandse namen komen uit het woordenboek (bron); in beeld via stapInTaal().
const ST = START_LIB.nl.stappen

export const STAP_SLEUTELS = ['soort', 'huisstijl', 'vestigingen', 'onderdelen', 'lessen', 'team', 'leden', 'klaar'] as const
export type StapSleutel = (typeof STAP_SLEUTELS)[number]

export const AANTAL_STAPPEN = STAP_SLEUTELS.length

export interface StapInfo {
  sleutel: StapSleutel
  titel: string
  /** Een regel voor de stappenlijst en de kaart op Vandaag. */
  kort: string
  /** Hoe lang het ongeveer duurt, in minuten (samen binnen een kwartier). */
  minuten: number
}

export const STAPPEN: readonly StapInfo[] = [
  { sleutel: 'soort', ...ST.soort, minuten: 1 },
  { sleutel: 'huisstijl', ...ST.huisstijl, minuten: 2 },
  { sleutel: 'vestigingen', ...ST.vestigingen, minuten: 2 },
  { sleutel: 'onderdelen', ...ST.onderdelen, minuten: 1 },
  { sleutel: 'lessen', ...ST.lessen, minuten: 3 },
  { sleutel: 'team', ...ST.team, minuten: 2 },
  { sleutel: 'leden', ...ST.leden, minuten: 2 },
  { sleutel: 'klaar', ...ST.klaar, minuten: 1 },
]

/** Een stap met titel en korte uitleg in de gekozen taal. */
export function stapInTaal<T extends Pick<StapInfo, 'sleutel' | 'titel' | 'kort'>>(s: T, taal: Taal): T {
  const t = START_LIB[taal].stappen[s.sleutel]
  return { ...s, titel: t.titel, kort: t.kort }
}

export interface StartVoortgang {
  /** De stap waar de eigenaar is gebleven (1 tot en met het aantal stappen). */
  stap: number
  /** Stappen die de eigenaar zelf op klaar zette. */
  klaar: StapSleutel[]
  /** Wanneer de wizard is afgerond (ISO), of null. */
  afgerondOp: string | null
  /** De gekozen soort sportschool (bepaalt de standaarden), of null. */
  soort: SportschoolSoort | null
  /** Wanneer de eigenaar live wil (YYYY-MM-DD, zelf gekozen en optioneel), of null. */
  streefdatum: string | null
  /** Keuzes die de eigenaar zelf bevestigde, zoals "Ik werk alleen" (zie BEVESTIGINGEN). */
  bevestigd: Bevestiging[]
}

/**
 * Wat een stap zonder inhoud toch af maakt, als de eigenaar het zelf bevestigt:
 * geen vaste lessen (alleen afspraken of vrij trainen), alleen werken (geen
 * team), en beginnen zonder ledenbestand.
 */
export const BEVESTIGINGEN = ['geen_vaste_lessen', 'alleen', 'zonder_leden'] as const
export type Bevestiging = (typeof BEVESTIGINGEN)[number]

export function isBevestiging(v: unknown): v is Bevestiging {
  return typeof v === 'string' && (BEVESTIGINGEN as readonly string[]).includes(v)
}

export const NIEUWE_START: StartVoortgang = { stap: 1, klaar: [], afgerondOp: null, soort: null, streefdatum: null, bevestigd: [] }

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function isStapSleutel(v: unknown): v is StapSleutel {
  return typeof v === 'string' && (STAP_SLEUTELS as readonly string[]).includes(v)
}

export function isStapNummer(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= AANTAL_STAPPEN
}

/** Het stapnummer van een sleutel. */
export function stapNummer(sleutel: StapSleutel): number {
  return STAP_SLEUTELS.indexOf(sleutel) + 1
}

/** Het adres van een stap, met de gekozen vestiging erbij als die er is. */
export function startPad(stap: number, vestiging: Vestiging | null): string {
  return vestiging ? clubPad('/start', vestiging, { stap: String(stap) }) : `/club/start?stap=${stap}`
}

/** De eerste stap die nog open staat (de laatste als alles af is). */
export function volgendeOpen(stand: readonly { af: boolean; nummer: number }[]): number {
  return stand.find((s) => !s.af)?.nummer ?? AANTAL_STAPPEN
}

/** De stap bij een nummer uit de URL; onbekend = null. */
export function stapUitParam(ruw: string | string[] | undefined): number | null {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  if (!w || !/^\d{1,2}$/.test(w)) return null
  const n = Number(w)
  return isStapNummer(n) ? n : null
}

function isIsoDatum(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v))
}

/** Een echte kalenderdag als YYYY-MM-DD, tussen 2020 en 2100 (geen 31 februari). */
export function isStreefdatum(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [j, m, d] = v.split('-').map(Number)
  if (j < 2020 || j > 2100) return false
  const dag = new Date(Date.UTC(j, m - 1, d))
  return dag.getUTCFullYear() === j && dag.getUTCMonth() === m - 1 && dag.getUTCDate() === d
}

/**
 * Uit de jsonb van club_organisaties.instellingen de voortgang, of null als er
 * (nog) geen voortgang is. Kapotte velden worden de standaard.
 */
export function leesStart(instellingen: unknown): StartVoortgang | null {
  const s = object(object(instellingen)?.start)
  if (!s) return null
  const klaar = Array.isArray(s.klaar) ? [...new Set(s.klaar.filter(isStapSleutel))] : []
  const bevestigd = Array.isArray(s.bevestigd) ? s.bevestigd.filter(isBevestiging) : []
  return {
    stap: isStapNummer(s.stap) ? s.stap : 1,
    klaar: STAP_SLEUTELS.filter((k) => klaar.includes(k)),
    afgerondOp: isIsoDatum(s.afgerond_op) ? s.afgerond_op : null,
    soort: isSportschoolSoort(s.soort) ? s.soort : null,
    streefdatum: isStreefdatum(s.streefdatum) ? s.streefdatum : null,
    bevestigd: BEVESTIGINGEN.filter((b) => bevestigd.includes(b)),
  }
}

/** Naar de database (snake_case zoals de rest van de kolom). */
export function startNaarJson(v: StartVoortgang): Record<string, unknown> {
  return { stap: v.stap, klaar: v.klaar, afgerond_op: v.afgerondOp, soort: v.soort, streefdatum: v.streefdatum, bevestigd: v.bevestigd }
}

/** De hele kolom met de nieuwe voortgang erin; andere sleutels (ledenapp, rechten) blijven staan. */
export function instellingenMetStart(ruw: unknown, v: StartVoortgang): Record<string, unknown> {
  return { ...(object(ruw) ?? {}), start: startNaarJson(v) }
}

// ── Wat de pagina mag sturen ──────────────────────────────────────────────

export interface StartInvoer {
  /** Naar deze stap (de eigenaar gaat verder of terug). */
  stap?: number
  /** Deze stap is klaar. */
  klaar?: StapSleutel
  /** Deze stap toch weer open zetten. */
  open?: StapSleutel
  /** true = afronden, false = weer openen. */
  afronden?: boolean
  /** De gekozen soort sportschool. */
  soort?: SportschoolSoort
  /** De streefdatum voor livegang (YYYY-MM-DD); null = weghalen. */
  streefdatum?: string | null
  /** Bevestigingen aan (true) of weer uit (false), zoals { alleen: true }. */
  bevestig?: Partial<Record<Bevestiging, boolean>>
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const VELDEN = new Set(['stap', 'klaar', 'open', 'afronden', 'soort', 'streefdatum', 'bevestig'])

/** { alleen: true } en dergelijke: alleen bekende sleutels met true of false, en minstens een. */
function leesBevestig(v: unknown): Partial<Record<Bevestiging, boolean>> | null {
  const o = object(v)
  if (!o) return null
  const sleutels = Object.keys(o)
  if (sleutels.length === 0 || sleutels.some((k) => !isBevestiging(k) || typeof o[k] !== 'boolean')) return null
  return Object.fromEntries(sleutels.map((k) => [k, o[k] as boolean])) as Partial<Record<Bevestiging, boolean>>
}

/** Streng: alleen bekende velden met geldige waarden, en minstens een. */
export function leesStartInvoer(body: unknown): Uitslag<StartInvoer> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'Ongeldige invoer.' }
  if (Object.keys(o).some((k) => !VELDEN.has(k))) return { ok: false, fout: 'Onbekend veld.' }
  if ('stap' in o && !isStapNummer(o.stap)) return { ok: false, fout: 'Onbekende stap.' }
  if ('klaar' in o && !isStapSleutel(o.klaar)) return { ok: false, fout: 'Onbekende stap.' }
  if ('open' in o && !isStapSleutel(o.open)) return { ok: false, fout: 'Onbekende stap.' }
  if ('afronden' in o && typeof o.afronden !== 'boolean') return { ok: false, fout: 'Kies afronden of openen.' }
  if ('soort' in o && !isSportschoolSoort(o.soort)) return { ok: false, fout: 'Onbekende soort sportschool.' }
  if ('streefdatum' in o && o.streefdatum !== null && !isStreefdatum(o.streefdatum)) return { ok: false, fout: 'Kies een geldige datum.' }
  const bevestig = 'bevestig' in o ? leesBevestig(o.bevestig) : null
  if ('bevestig' in o && !bevestig) return { ok: false, fout: 'Onbekende keuze.' }
  if (Object.keys(o).length === 0) return { ok: false, fout: 'Er is niets om op te slaan.' }
  return {
    ok: true,
    waarde: {
      ...(isStapNummer(o.stap) ? { stap: o.stap } : {}),
      ...(isStapSleutel(o.klaar) ? { klaar: o.klaar } : {}),
      ...(isStapSleutel(o.open) ? { open: o.open } : {}),
      ...(typeof o.afronden === 'boolean' ? { afronden: o.afronden } : {}),
      ...(isSportschoolSoort(o.soort) ? { soort: o.soort } : {}),
      ...('streefdatum' in o ? { streefdatum: isStreefdatum(o.streefdatum) ? o.streefdatum : null } : {}),
      ...(bevestig ? { bevestig } : {}),
    },
  }
}

function metBevestig(huidig: readonly Bevestiging[], wijziging: Partial<Record<Bevestiging, boolean>> | undefined): Bevestiging[] {
  if (!wijziging) return [...huidig]
  return BEVESTIGINGEN.filter((b) => wijziging[b] ?? huidig.includes(b))
}

/** De nieuwe voortgang na een wijziging (nooit in place). */
export function pasToe(huidig: StartVoortgang, invoer: StartInvoer, nu: Date): StartVoortgang {
  let klaar = huidig.klaar.filter((k) => k !== invoer.open)
  if (invoer.klaar && !klaar.includes(invoer.klaar)) klaar = [...klaar, invoer.klaar]
  let afgerondOp = huidig.afgerondOp
  if (invoer.afronden === true) {
    afgerondOp = afgerondOp ?? nu.toISOString()
    if (!klaar.includes('klaar')) klaar = [...klaar, 'klaar']
  }
  if (invoer.afronden === false) {
    afgerondOp = null
    klaar = klaar.filter((k) => k !== 'klaar')
  }
  return {
    stap: invoer.stap ?? huidig.stap,
    klaar: STAP_SLEUTELS.filter((k) => klaar.includes(k)),
    afgerondOp,
    soort: invoer.soort ?? huidig.soort,
    streefdatum: invoer.streefdatum === undefined ? huidig.streefdatum : invoer.streefdatum,
    bevestigd: metBevestig(huidig.bevestigd, invoer.bevestig),
  }
}

// ── Wat al af is volgens de echte data ────────────────────────────────────

export interface StartFeiten {
  heeftLogo: boolean
  /** Is er een eigen adres gekozen (aiyourgym.com/<slug>)? */
  heeftAdres: boolean
  /** Alle vestigingen van de sportschool. */
  vestigingen: number
  /** Vestigingen met een adres (leden zien het in de app, dus nodig om live te gaan). */
  vestigingenMetAdres: number
  /** Vestigingen met een adres of openingstijden. */
  vestigingenIngericht: number
  lestypen: number
  vasteLessen: number
  medewerkers: number
  leden: number
  /** Onderdelen die uit staan (zie MODULES). */
  uit: readonly string[]
}

/**
 * Een vestiging telt als ingericht met een adres of met zelf gekozen
 * openingstijden. De plaatshouder-tijden van een nieuwe vestiging tellen niet:
 * anders staat de stap Vestiging bij een nieuwe sportschool meteen op af.
 */
export function vestigingIngericht(rij: { adres?: unknown; openingstijden?: unknown }): boolean {
  const adres = typeof rij.adres === 'string' && rij.adres.trim() !== ''
  return adres || heeftEigenOpeningstijden(rij.openingstijden)
}

/**
 * Wanneer een stap echt af is: alleen als de inhoud er staat. Zelf op Klaar
 * drukken telt alleen bij stappen waar altijd iets staat (huisstijl zonder
 * logo, onderdelen). Een stap zonder inhoud (geen vaste lessen, geen team,
 * geen leden) is alleen af als de eigenaar dat zelf bevestigt. Een stap van
 * een onderdeel dat uit staat is niet nodig, dus af.
 *
 * - soort: er is een soort gekozen.
 * - huisstijl: eigen adres gekozen, plus een logo of zelf op klaar gezet.
 * - vestigingen: elke vestiging heeft een adres.
 * - onderdelen: zelf op klaar gezet.
 * - lessen: groepslessen uit, of minstens een lestype en (vaste lessen of "geen vaste lessen").
 * - team: minstens een medewerker, of "ik werk alleen".
 * - leden: leden uit, minstens een lid, of "ik begin zonder leden".
 * - klaar: afgerond en alle stappen hiervoor af.
 */
export function stapAf(sleutel: Exclude<StapSleutel, 'klaar'>, v: StartVoortgang | null, f: StartFeiten): boolean {
  const zelf = v?.klaar ?? []
  const bevestigd = (b: Bevestiging) => Boolean(v?.bevestigd.includes(b))
  const uit = (m: string) => f.uit.includes(m)
  switch (sleutel) {
    case 'soort':
      return Boolean(v?.soort)
    case 'huisstijl':
      return f.heeftAdres && (f.heeftLogo || zelf.includes('huisstijl'))
    case 'vestigingen':
      return f.vestigingen > 0 && f.vestigingenMetAdres >= f.vestigingen
    case 'onderdelen':
      return zelf.includes('onderdelen')
    case 'lessen':
      return uit('rooster') || (f.lestypen > 0 && (f.vasteLessen > 0 || bevestigd('geen_vaste_lessen')))
    case 'team':
      return f.medewerkers > 0 || bevestigd('alleen')
    case 'leden':
      return uit('leden') || f.leden > 0 || bevestigd('zonder_leden')
  }
}

export interface StapStand extends StapInfo {
  nummer: number
  af: boolean
}

/** Per stap: af of open, volgens de regels van stapAf (titels in de gekozen taal). */
export function stappenStand(v: StartVoortgang | null, f: StartFeiten, taal: Taal = 'nl'): StapStand[] {
  const voor = STAPPEN.filter((s) => s.sleutel !== 'klaar').map((s) => stapAf(s.sleutel as Exclude<StapSleutel, 'klaar'>, v, f))
  const allesAf = voor.every(Boolean)
  return STAPPEN.map((s, i) => ({ ...stapInTaal(s, taal), nummer: i + 1, af: s.sleutel === 'klaar' ? Boolean(v?.afgerondOp) && allesAf : voor[i] }))
}

export function aantalAf(stand: readonly StapStand[]): number {
  return stand.filter((s) => s.af).length
}

/** De stappen voor Klaar die nog niet af zijn: die moeten eerst, voordat je live gaat. */
export function nogOpen(stand: readonly StapStand[]): StapStand[] {
  return stand.filter((s) => s.sleutel !== 'klaar' && !s.af)
}

/** Mag de wizard worden afgerond? Alleen als alle stappen ervoor echt af zijn. */
export function klaarVoorLive(stand: readonly StapStand[]): boolean {
  return nogOpen(stand).length === 0
}

/** "Nog niet alles staat: Lessen en Team." voor de fout bij afronden. */
export function nogOpenTekst(open: readonly Pick<StapStand, 'titel'>[], taal: Taal = 'nl'): string {
  const t = START_LIB[taal]
  const namen = open.map((s) => s.titel)
  const lijst = namen.length <= 1 ? namen.join('') : `${namen.slice(0, -1).join(', ')} ${t.en} ${namen[namen.length - 1]}`
  return t.nogOpen(lijst)
}

/** Hoeveel minuten de open stappen samen nog ongeveer kosten. */
export function minutenOver(stand: readonly Pick<StapStand, 'af' | 'minuten'>[]): number {
  return stand.filter((s) => !s.af).reduce((som, s) => som + s.minuten, 0)
}

/** "Nog ongeveer 9 minuten", in gewone taal. */
export function minutenTekst(minuten: number, taal: Taal = 'nl'): string {
  const t = START_LIB[taal].minuten
  if (minuten <= 0) return t.allesStaat
  if (minuten === 1) return t.een
  return t.meer(minuten)
}

/** Komt de eigenaar terug zonder stap in de URL, ergens halverwege? Dan heten we hem welkom terug. */
export function isHervatten(v: StartVoortgang | null, stapInUrl: number | null): boolean {
  return stapInUrl === null && v !== null && v.afgerondOp === null && v.stap > 1
}

// ── Streefdatum voor livegang ─────────────────────────────────────────────

function dagNummer(datum: string): number {
  const [j, m, d] = datum.split('-').map(Number)
  return Math.round(Date.UTC(j, m - 1, d) / 86_400_000)
}

/** Hoeveel dagen het nog is tot de streefdatum (negatief = voorbij). Beide als YYYY-MM-DD. */
export function dagenTot(streefdatum: string, vandaag: string): number {
  return dagNummer(streefdatum) - dagNummer(vandaag)
}

/** "1 november", met het jaar erbij als het niet dit jaar is. */
export function datumTekst(datum: string, vandaag: string, taal: Taal = 'nl'): string {
  const t = START_LIB[taal]
  const [j, m, d] = datum.split('-').map(Number)
  const jaar = j === Number(vandaag.slice(0, 4)) ? '' : ` ${j}`
  return `${t.datum(d, t.maanden[m - 1])}${jaar}`
}

function stappenTekst(open: number, taal: Taal): string {
  const t = START_LIB[taal].stappenOver
  if (open <= 0) return t.geen
  return open === 1 ? t.een : t.meer(open)
}

/** Zonder druk: hoeveel dagen nog, of dat de datum voorbij is (zonder punt aan het eind). */
export function dagenTekst(dagen: number, taal: Taal = 'nl'): string {
  const t = START_LIB[taal].dagen
  if (dagen < 0) return t.voorbij
  if (dagen === 0) return t.vandaag
  if (dagen === 1) return t.morgen
  return t.meer(dagen)
}

export interface StreefStand {
  /** "Live op 1 november, nog 3 stappen". */
  kop: string
  /** "Nog 9 dagen". */
  dagen: string
  voorbij: boolean
}

/** De streefdatum met de open stappen, voor de kaart op Vandaag en de wizard. */
export function streefStand(streefdatum: string, vandaag: string, open: number, taal: Taal = 'nl'): StreefStand {
  const dagen = dagenTot(streefdatum, vandaag)
  return { kop: START_LIB[taal].streefKop(datumTekst(streefdatum, vandaag, taal), stappenTekst(open, taal)), dagen: dagenTekst(dagen, taal), voorbij: dagen < 0 }
}

// ── Wie de wizard krijgt ──────────────────────────────────────────────────

export interface WizardOrg {
  id: string
  demo: boolean
}

/**
 * Een nieuwe sportschool gaat na het inloggen naar de wizard: nog geen
 * voortgang en niet afgerond. Fit Factory (de eigen omgeving van de
 * beheerder) en een demo krijgen hem nooit automatisch.
 */
export function moetNaarWizard(org: WizardOrg, beheerderId: string, v: StartVoortgang | null): boolean {
  if (org.demo || org.id === beheerderId) return false
  return v === null
}

/** De kaart "Maak je sportschool af" op Vandaag: begonnen en nog niet afgerond. */
export function toonStartKaart(v: StartVoortgang | null): boolean {
  return v !== null && v.afgerondOp === null
}
