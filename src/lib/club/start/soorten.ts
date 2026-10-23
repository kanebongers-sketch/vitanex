// ─── Club startwizard: slimme standaarden per soort sportschool (PUUR) ──────
// De eigenaar kiest eerst wat voor sportschool het is. Daaruit volgt een
// startpakket: welke onderdelen aan of uit staan, welke lestypen er alvast
// komen, openingstijden, regels voor reserveren en wat elke rol ziet. Het zijn
// gangbare standaarden, geen beloftes: in de stappen daarna pas je alles aan.

import { MODULES, MODULE_LABEL, type Module } from '@/lib/club/kern/organisatie'
import { MEDEWERKER_ROLLEN, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { standaardRechten, type Rechten } from '@/lib/club/kern/org-instellingen'
import { STANDAARD_REGELS, type RoosterRegels } from '@/lib/club/rooster/regels'
import type { Openingstijd, Openingstijden } from '@/lib/club/rooster/openingstijden'
import { ALLE_LESSEN, VOORBEELD_LESTYPEN, lestypeOpNaam, zelfdeNaam, type VoorbeeldLes, type VoorbeeldLestype } from './voorbeelden'

export const SPORTSCHOOL_SOORTEN = ['gym', 'boutique', 'pt', 'keten', 'yoga', 'vechtsport', 'bootcamp'] as const
export type SportschoolSoort = (typeof SPORTSCHOOL_SOORTEN)[number]

export interface SoortInfo {
  titel: string
  /** Een regel onder de titel op de keuzekaart. */
  kort: string
}

export const SOORT_INFO: Record<SportschoolSoort, SoortInfo> = {
  gym: { titel: 'Fitnessclub', kort: 'Vrij trainen met begeleiding, plus groepslessen' },
  boutique: { titel: 'Boutique studio', kort: 'Kleine groepen, altijd op reservering' },
  pt: { titel: 'PT-studio', kort: 'Personal training en kleine groepjes op afspraak' },
  keten: { titel: 'Keten', kort: 'Meerdere vestigingen onder een naam' },
  yoga: { titel: 'Yoga en pilates', kort: 'Lessen op de mat, rustig tempo' },
  vechtsport: { titel: 'Vechtsport', kort: 'Trainingen per niveau en leeftijd' },
  bootcamp: { titel: 'Bootcamp', kort: 'Binnen of buiten trainen in groepen' },
}

export function isSportschoolSoort(v: unknown): v is SportschoolSoort {
  return typeof v === 'string' && (SPORTSCHOOL_SOORTEN as readonly string[]).includes(v)
}

// ── Openingstijden ────────────────────────────────────────────────────────

/** De standaard van een gewone sportschool: elke dag van 06:00 tot 23:00. */
export const STANDAARD_TIJD: Openingstijd = { van: '06:00', tot: '23:00' }

type Dag = Openingstijd | null

function tijd(van: string, tot: string): Openingstijd {
  return { van, tot }
}

/** Een week met dezelfde tijden op werkdagen en eigen tijden in het weekend. */
export function weekMet(werkdag: Dag, zaterdag: Dag = werkdag, zondag: Dag = zaterdag): Openingstijden {
  return [werkdag, werkdag, werkdag, werkdag, werkdag, zaterdag, zondag]
}

/** Elke dag dezelfde tijden (standaard 06:00 tot 23:00). */
export function standaardWeek(t: Openingstijd = STANDAARD_TIJD): Openingstijden {
  return weekMet(t)
}

function zelfdeDag(a: Dag, b: Dag): boolean {
  return a === null || b === null ? a === b : a.van === b.van && a.tot === b.tot
}

/** Heeft de week minstens een open dag? */
export function heeftOpenDag(week: Openingstijden): boolean {
  return week.some((d) => d !== null)
}

const KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function dagenTekst(van: number, tot: number): string {
  if (van === tot) return KORT[van]
  if (tot === van + 1) return `${KORT[van]} en ${KORT[tot]}`
  return `${KORT[van]} tot ${KORT[tot]}`
}

/** "Elke dag 06:00 tot 23:00" of "Ma tot vr 07:00 tot 21:00, za 08:00 tot 14:00, zo dicht". */
export function weekTekst(week: Openingstijden): string {
  if (!heeftOpenDag(week)) return 'Elke dag dicht'
  if (week.every((d) => zelfdeDag(d, week[0]))) return `Elke dag ${week[0]?.van} tot ${week[0]?.tot}`
  const delen: string[] = []
  let begin = 0
  for (let i = 1; i <= 7; i++) {
    if (i < 7 && zelfdeDag(week[i], week[begin])) continue
    const d = week[begin]
    delen.push(`${dagenTekst(begin, i - 1)} ${d ? `${d.van} tot ${d.tot}` : 'dicht'}`)
    begin = i
  }
  const tekst = delen.join(', ')
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

// ── Het startpakket per soort ─────────────────────────────────────────────

export interface SoortPakket {
  soort: SportschoolSoort
  /** Onderdelen die uit gaan; de rest staat aan. */
  uit: Module[]
  /** De lestypen die alvast klaar komen te staan. */
  lestypen: VoorbeeldLestype[]
  /** Voorstellen voor de vaste lessen in de week (bij de stap Lessen). */
  lessen: VoorbeeldLes[]
  openingstijden: Openingstijden
  regels: RoosterRegels
  rechten: Rechten
}

interface Recept {
  uit: Module[]
  lestypen: string[]
  openingstijden: Openingstijden
  regels: Partial<RoosterRegels>
  /** Extra onderdelen per rol bovenop de standaard. */
  extraRechten: Partial<Record<MedewerkerRol, string[]>>
}

const GANGBAAR = VOORBEELD_LESTYPEN.map((v) => v.naam)
/** Bij lesstudio's checkt de instructeur zelf de deelnemers in. */
const INSTRUCTEUR_BIJ_LES: Partial<Record<MedewerkerRol, string[]>> = { instructeur: ['checkin', 'leden'] }

const RECEPTEN: Record<SportschoolSoort, Recept> = {
  gym: {
    uit: [],
    lestypen: ['Spinning', 'Bootcamp', 'Circuittraining', 'Kracht in de groep', 'HIIT', 'Core'],
    openingstijden: standaardWeek(),
    regels: {},
    extraRechten: {},
  },
  keten: {
    uit: [],
    lestypen: GANGBAAR,
    openingstijden: standaardWeek(),
    regels: {},
    extraRechten: {},
  },
  boutique: {
    uit: ['taken'],
    lestypen: ['HIIT', 'Kracht in de groep', 'Spinning', 'Core', 'Pilates'],
    openingstijden: weekMet(tijd('06:30', '21:30'), tijd('08:00', '13:00'), tijd('09:00', '13:00')),
    regels: { annuleerUren: 12, noShowDrempel: 2, reserveerDagenVooruit: 14, maxOpenReserveringen: 8, checkinVensterMin: 10 },
    extraRechten: INSTRUCTEUR_BIJ_LES,
  },
  pt: {
    uit: ['taken'],
    lestypen: ['Small group training', 'Personal training', 'Kracht in de groep', 'Circuittraining', 'Intake'],
    openingstijden: weekMet(tijd('07:00', '21:00'), tijd('08:00', '14:00'), null),
    regels: {},
    extraRechten: {},
  },
  yoga: {
    uit: ['training', 'taken'],
    lestypen: ['Yoga', 'Yin yoga', 'Vinyasa flow', 'Pilates', 'Meditatie'],
    openingstijden: weekMet(tijd('07:00', '21:30'), tijd('08:30', '13:00'), tijd('09:00', '12:30')),
    regels: { annuleerUren: 12, reserveerDagenVooruit: 14, maxOpenReserveringen: 6, checkinVensterMin: 10 },
    extraRechten: INSTRUCTEUR_BIJ_LES,
  },
  vechtsport: {
    uit: ['training', 'taken'],
    lestypen: ['Kickboksen', 'Boksen', 'Grappling', 'Jeugd vechtsport', 'Conditietraining'],
    openingstijden: weekMet(tijd('16:00', '22:00'), tijd('09:00', '13:00'), null),
    regels: { maxOpenReserveringen: 6 },
    extraRechten: INSTRUCTEUR_BIJ_LES,
  },
  bootcamp: {
    uit: ['personeel', 'taken'],
    lestypen: ['Bootcamp', 'HIIT', 'Circuittraining', 'Core'],
    openingstijden: weekMet(tijd('06:30', '21:00'), tijd('08:00', '12:00'), tijd('09:00', '11:00')),
    regels: { annuleerUren: 6, reserveerDagenVooruit: 14, maxOpenReserveringen: 8, checkinVensterMin: 10 },
    extraRechten: INSTRUCTEUR_BIJ_LES,
  },
}

/**
 * Welke onderdelen (zie shell/onderdelen.ts) bij een module horen. Staat de
 * module uit, dan ziet geen enkele rol die onderdelen.
 */
export const MODULE_ONDERDELEN: Record<Module, readonly string[]> = {
  leden: ['leden'],
  checkin: ['checkin'],
  rooster: ['rooster'],
  afspraken: ['afspraken'],
  personeel: ['personeel'],
  taken: ['taken'],
  leads: ['leads'],
  training: ['schemas'],
  cijfers: ['cijfers'],
  app: ['app', 'community'],
}

/** De standaardrechten, met extra's per rol en zonder de onderdelen van modules die uit staan. */
export function rechtenVoor(uit: readonly Module[], extra: Partial<Record<MedewerkerRol, string[]>> = {}): Rechten {
  const dicht = new Set(uit.flatMap((m) => MODULE_ONDERDELEN[m]))
  const basis = standaardRechten()
  return Object.fromEntries(
    MEDEWERKER_ROLLEN.map((rol) => [rol, [...new Set([...basis[rol], ...(extra[rol] ?? [])])].filter((o) => !dicht.has(o))]),
  ) as Rechten
}

/** De lestypen die bij een soort passen, ook als de groepslessen (nog) uit staan. */
export function voorstelLestypen(soort: SportschoolSoort): VoorbeeldLestype[] {
  return RECEPTEN[soort].lestypen.map(lestypeOpNaam).filter((v): v is VoorbeeldLestype => v !== null)
}

/** Het startpakket voor een soort sportschool. */
export function pakketVoor(soort: SportschoolSoort): SoortPakket {
  const r = RECEPTEN[soort]
  const lestypen = r.uit.includes('rooster') ? [] : r.lestypen.map(lestypeOpNaam).filter((v): v is VoorbeeldLestype => v !== null)
  return {
    soort,
    uit: [...r.uit],
    lestypen,
    lessen: ALLE_LESSEN.filter((l) => lestypen.some((t) => zelfdeNaam(t.naam, l.lestype))),
    openingstijden: r.openingstijden,
    regels: { ...STANDAARD_REGELS, ...r.regels },
    rechten: rechtenVoor(r.uit, r.extraRechten),
  }
}

// ── Wat we de eigenaar laten zien ("We hebben dit alvast klaargezet") ─────

export interface KlaargezetRegel {
  sleutel: 'onderdelen' | 'lestypen' | 'openingstijden' | 'reserveren' | 'rechten'
  titel: string
  tekst: string
}

function lijstTekst(namen: readonly string[]): string {
  if (namen.length <= 1) return namen.join('')
  return `${namen.slice(0, -1).join(', ')} en ${namen[namen.length - 1]}`
}

export function onderdelenTekst(uit: readonly Module[]): string {
  const aan = MODULES.length - uit.length
  if (uit.length === 0) return `Alle ${MODULES.length} onderdelen staan aan.`
  return `${aan} van de ${MODULES.length} onderdelen aan. Uit: ${lijstTekst(uit.map((m) => MODULE_LABEL[m].label.toLowerCase()))}.`
}

export function reserverenTekst(r: RoosterRegels): string {
  return `Boeken tot ${r.reserveerDagenVooruit} dagen vooruit, kosteloos annuleren tot ${r.annuleerUren} uur voor de les, na ${r.noShowDrempel} keer niet komen ${r.noShowBlokkadeDagen} dagen niet boeken.`
}

const ROL_MEERVOUD: Record<MedewerkerRol, string> = {
  trainer: 'trainers',
  instructeur: 'groepslesinstructeurs',
  manager: 'clubmanagers',
  administratie: 'de administratie',
}

/** "Trainers zien 11 onderdelen, groepslesinstructeurs 3, ..." */
export function rechtenTekst(rechten: Rechten): string {
  const [eerste, ...rest] = MEDEWERKER_ROLLEN
  const delen = rest.map((rol) => `${ROL_MEERVOUD[rol]} ${rechten[rol].length}`)
  const naam = ROL_MEERVOUD[eerste]
  const kop = `${naam.charAt(0).toUpperCase()}${naam.slice(1)} zien ${rechten[eerste].length} onderdelen`
  return `${lijstTekst([kop, ...delen])}. Jij als eigenaar ziet alles.`
}

/** De regels voor de kaart "We hebben dit alvast voor je klaargezet". */
export function klaargezet(p: SoortPakket): KlaargezetRegel[] {
  const lessen = !p.uit.includes('rooster')
  return [
    { sleutel: 'onderdelen', titel: 'Onderdelen', tekst: onderdelenTekst(p.uit) },
    {
      sleutel: 'lestypen',
      titel: 'Lestypen',
      tekst: lessen && p.lestypen.length > 0 ? lijstTekst(p.lestypen.map((l) => l.naam)) : 'Geen groepslessen. Geef je ze toch, zet dan Groepslessen aan bij Onderdelen.',
    },
    { sleutel: 'openingstijden', titel: 'Openingstijden', tekst: weekTekst(p.openingstijden) },
    ...(lessen ? [{ sleutel: 'reserveren' as const, titel: 'Reserveren', tekst: reserverenTekst(p.regels) }] : []),
    { sleutel: 'rechten', titel: 'Wat je team ziet', tekst: rechtenTekst(p.rechten) },
  ]
}

// ── Toepassen zonder iets kwijt te raken ──────────────────────────────────

export interface BestaandeVestiging {
  sleutel: string
  /** Heeft de vestiging al openingstijden? Dan blijven die (en de regels) staan. */
  heeftTijden: boolean
}

export interface ToepasPlan {
  uit: Module[]
  rechten: Rechten
  /** Vestigingen die openingstijden en regels krijgen. */
  vestigingen: string[]
  /** Lestypen die er nog niet zijn. */
  lestypen: VoorbeeldLestype[]
}

/**
 * Wat er bij "Klopt" echt verandert. Onderdelen en rechten volgen de keuze;
 * openingstijden alleen voor vestigingen zonder tijden en alleen lestypen die
 * er nog niet zijn. Zo overschrijft een tweede keer kiezen nooit eigen werk.
 */
export function toepasPlan(p: SoortPakket, vestigingen: readonly BestaandeVestiging[], bestaandeLestypen: readonly string[]): ToepasPlan {
  return {
    uit: p.uit,
    rechten: p.rechten,
    vestigingen: vestigingen.filter((v) => !v.heeftTijden).map((v) => v.sleutel),
    lestypen: p.lestypen.filter((l) => !bestaandeLestypen.some((n) => zelfdeNaam(n, l.naam))),
  }
}

/** Zonder lestypen en zonder soort: een les die bij elke sportschool past. */
export const NEUTRALE_LES = 'Groepsles'

/**
 * De les in het voorbeeld van de ledenapp: eerst een eigen lestype dat bij de
 * soort past, dan het eerste eigen lestype, dan de eerste les van de soort,
 * en anders een neutrale les. Nooit een les die niet bij de sportschool past.
 */
export function voorbeeldLes(eigen: readonly string[], soort: SportschoolSoort | null): string {
  const passend = soort ? voorstelLestypen(soort).map((v) => v.naam) : []
  const namen = eigen.map((n) => n.trim()).filter(Boolean)
  return namen.find((n) => passend.some((p) => zelfdeNaam(p, n))) ?? namen[0] ?? passend[0] ?? NEUTRALE_LES
}
