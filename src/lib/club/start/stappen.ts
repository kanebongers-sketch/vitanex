// ─── Club: de startwizard van een nieuwe sportschool (PUUR) ─────────────────
// Na aanmelden en betalen loopt de eigenaar acht korte stappen door, elk over
// te slaan en later te hervatten. De eerste stap is de soort sportschool: die
// zet alvast slimme standaarden klaar, zodat de rest vooral "Klopt" is.
// De voortgang staat per sportschool in club_organisaties.instellingen onder
// `start`: { stap, klaar[], afgerond_op, soort, streefdatum }.
// Wat al af is, leiden we daarnaast af uit de echte data (een logo, een
// vestiging met adres, lestypen, medewerkers, leden): wie het via een andere
// weg al deed, hoeft hier niets dubbel te doen.
// Lezen is vergevingsgezind (kapot = geen voortgang), opslaan is streng.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { heeftEigenOpeningstijden } from '@/lib/club/instellingen/vestigingen-invoer'
import { isSportschoolSoort, type SportschoolSoort } from './soorten'

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
  { sleutel: 'soort', titel: 'Je sportschool', kort: 'Kies de soort, wij zetten de rest klaar', minuten: 1 },
  { sleutel: 'huisstijl', titel: 'Huisstijl', kort: 'Logo uploaden, de kleur komt er vanzelf uit', minuten: 2 },
  { sleutel: 'vestigingen', titel: 'Vestiging', kort: 'Adres en openingstijden', minuten: 2 },
  { sleutel: 'onderdelen', titel: 'Onderdelen', kort: 'Wat je sportschool gebruikt', minuten: 1 },
  { sleutel: 'lessen', titel: 'Lessen', kort: 'Lestypen en een paar vaste lessen', minuten: 2 },
  { sleutel: 'team', titel: 'Team', kort: 'Naam, e-mail en rol van je medewerkers', minuten: 2 },
  { sleutel: 'leden', titel: 'Leden', kort: 'Je ledenbestand inlezen, of later', minuten: 2 },
  { sleutel: 'klaar', titel: 'Klaar', kort: 'Klaar voor je eerste dag', minuten: 1 },
]

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
}

export const NIEUWE_START: StartVoortgang = { stap: 1, klaar: [], afgerondOp: null, soort: null, streefdatum: null }

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
  return {
    stap: isStapNummer(s.stap) ? s.stap : 1,
    klaar: STAP_SLEUTELS.filter((k) => klaar.includes(k)),
    afgerondOp: isIsoDatum(s.afgerond_op) ? s.afgerond_op : null,
    soort: isSportschoolSoort(s.soort) ? s.soort : null,
    streefdatum: isStreefdatum(s.streefdatum) ? s.streefdatum : null,
  }
}

/** Naar de database (snake_case zoals de rest van de kolom). */
export function startNaarJson(v: StartVoortgang): Record<string, unknown> {
  return { stap: v.stap, klaar: v.klaar, afgerond_op: v.afgerondOp, soort: v.soort, streefdatum: v.streefdatum }
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
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const VELDEN = new Set(['stap', 'klaar', 'open', 'afronden', 'soort', 'streefdatum'])

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
    },
  }
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
  }
}

// ── Wat al af is volgens de echte data ────────────────────────────────────

export interface StartFeiten {
  heeftLogo: boolean
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

/** De stappen die de data al af maakt. Een stap van een onderdeel dat uit staat is niet nodig, dus af. */
export function afUitData(f: StartFeiten): StapSleutel[] {
  const uit = (m: string) => f.uit.includes(m)
  const af: Record<StapSleutel, boolean> = {
    soort: false,
    huisstijl: f.heeftLogo,
    vestigingen: f.vestigingenIngericht > 0,
    onderdelen: false,
    lessen: uit('rooster') || f.lestypen > 0,
    team: f.medewerkers > 0,
    leden: uit('leden') || f.leden > 0,
    klaar: false,
  }
  return STAP_SLEUTELS.filter((k) => af[k])
}

export interface StapStand extends StapInfo {
  nummer: number
  af: boolean
  /** Af door de data (niet zelf aangevinkt). */
  vanzelf: boolean
}

/** Per stap: af of open, zelf aangevinkt of door de data. */
export function stappenStand(v: StartVoortgang | null, f: StartFeiten): StapStand[] {
  const vanzelf = afUitData(f)
  const zelf = v?.klaar ?? []
  return STAPPEN.map((s, i) => {
    const doorData = vanzelf.includes(s.sleutel)
    const isKlaar = s.sleutel === 'klaar' ? Boolean(v?.afgerondOp) : zelf.includes(s.sleutel) || (s.sleutel === 'soort' && Boolean(v?.soort))
    return { ...s, nummer: i + 1, af: isKlaar || doorData, vanzelf: doorData && !isKlaar }
  })
}

export function aantalAf(stand: readonly StapStand[]): number {
  return stand.filter((s) => s.af).length
}

/** Hoeveel minuten de open stappen samen nog ongeveer kosten. */
export function minutenOver(stand: readonly Pick<StapStand, 'af' | 'minuten'>[]): number {
  return stand.filter((s) => !s.af).reduce((som, s) => som + s.minuten, 0)
}

/** "Nog ongeveer 9 minuten", in gewone taal. */
export function minutenTekst(minuten: number): string {
  if (minuten <= 0) return 'Alles staat'
  if (minuten === 1) return 'Nog ongeveer een minuut'
  return `Nog ongeveer ${minuten} minuten`
}

/** Komt de eigenaar terug zonder stap in de URL, ergens halverwege? Dan heten we hem welkom terug. */
export function isHervatten(v: StartVoortgang | null, stapInUrl: number | null): boolean {
  return stapInUrl === null && v !== null && v.afgerondOp === null && v.stap > 1
}

// ── Streefdatum voor livegang ─────────────────────────────────────────────

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const

function dagNummer(datum: string): number {
  const [j, m, d] = datum.split('-').map(Number)
  return Math.round(Date.UTC(j, m - 1, d) / 86_400_000)
}

/** Hoeveel dagen het nog is tot de streefdatum (negatief = voorbij). Beide als YYYY-MM-DD. */
export function dagenTot(streefdatum: string, vandaag: string): number {
  return dagNummer(streefdatum) - dagNummer(vandaag)
}

/** "1 november", met het jaar erbij als het niet dit jaar is. */
export function datumTekst(datum: string, vandaag: string): string {
  const [j, m, d] = datum.split('-').map(Number)
  const jaar = j === Number(vandaag.slice(0, 4)) ? '' : ` ${j}`
  return `${d} ${MAANDEN[m - 1]}${jaar}`
}

function stappenTekst(open: number): string {
  if (open <= 0) return 'alle stappen staan'
  return open === 1 ? 'nog 1 stap' : `nog ${open} stappen`
}

/** Zonder druk: hoeveel dagen nog, of dat de datum voorbij is (zonder punt aan het eind). */
export function dagenTekst(dagen: number): string {
  if (dagen < 0) return 'De datum is voorbij, kies gerust een nieuwe'
  if (dagen === 0) return 'Vandaag'
  if (dagen === 1) return 'Morgen'
  return `Nog ${dagen} dagen`
}

export interface StreefStand {
  /** "Live op 1 november, nog 3 stappen". */
  kop: string
  /** "Nog 9 dagen". */
  dagen: string
  voorbij: boolean
}

/** De streefdatum met de open stappen, voor de kaart op Vandaag en de wizard. */
export function streefStand(streefdatum: string, vandaag: string, open: number): StreefStand {
  const dagen = dagenTot(streefdatum, vandaag)
  return { kop: `Live op ${datumTekst(streefdatum, vandaag)}, ${stappenTekst(open)}`, dagen: dagenTekst(dagen), voorbij: dagen < 0 }
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
