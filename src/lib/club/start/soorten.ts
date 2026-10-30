// ─── Club startwizard: soorten sportschool en openingstijden (PUUR) ─────────
// Besluit Kane (30-10-2026): de startwizard zet NIETS automatisch klaar op
// basis van de soort sportschool. De eigenaar kiest alles zelf; voorbeelden
// staan er alleen als keuze die niet is aangevinkt. De namen van de soorten
// blijven hier voor de website (voorbeeldschermen). Verder: hulp bij
// openingstijden (een week als tekst) en de les in het ledenapp-voorbeeld.

import type { Openingstijd, Openingstijden } from '@/lib/club/rooster/openingstijden'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

// De Nederlandse teksten komen uit het woordenboek (bron); in beeld met de taal erbij (weekTekst).
const SO = START_LIB.nl.soorten

export const SPORTSCHOOL_SOORTEN = ['gym', 'boutique', 'pt', 'keten', 'yoga', 'vechtsport', 'bootcamp'] as const
export type SportschoolSoort = (typeof SPORTSCHOOL_SOORTEN)[number]

export interface SoortInfo {
  titel: string
  /** Een regel onder de titel op de keuzekaart. */
  kort: string
}

export const SOORT_INFO: Record<SportschoolSoort, SoortInfo> = {
  gym: { titel: SO.gym.titel, kort: SO.gym.kort },
  boutique: { titel: SO.boutique.titel, kort: SO.boutique.kort },
  pt: { titel: SO.pt.titel, kort: SO.pt.kort },
  keten: { titel: SO.keten.titel, kort: SO.keten.kort },
  yoga: { titel: SO.yoga.titel, kort: SO.yoga.kort },
  vechtsport: { titel: SO.vechtsport.titel, kort: SO.vechtsport.kort },
  bootcamp: { titel: SO.bootcamp.titel, kort: SO.bootcamp.kort },
}

// ── Openingstijden ────────────────────────────────────────────────────────

/** De standaard van een gewone sportschool: elke dag van 06:00 tot 23:00. */
export const STANDAARD_TIJD: Openingstijd = { van: '06:00', tot: '23:00' }

type Dag = Openingstijd | null

/** Een week met dezelfde tijden op werkdagen en eigen tijden in het weekend. */
export function weekMet(werkdag: Dag, zaterdag: Dag = werkdag, zondag: Dag = zaterdag): Openingstijden {
  return [werkdag, werkdag, werkdag, werkdag, werkdag, zaterdag, zondag]
}

/** Alle dagen dicht: zo begint een vestiging zonder eigen tijden in de wizard (de eigenaar kiest zelf). */
export function legeWeek(): Openingstijden {
  return [null, null, null, null, null, null, null]
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

function dagenTekst(van: number, tot: number, taal: Taal): string {
  const w = START_LIB[taal].week
  if (van === tot) return w.dagKort[van]
  if (tot === van + 1) return w.tweeDagen(w.dagKort[van], w.dagKort[tot])
  return w.reeks(w.dagKort[van], w.dagKort[tot])
}

/** "Elke dag 06:00 tot 23:00" of "Ma tot vr 07:00 tot 21:00, za 08:00 tot 14:00, zo dicht". */
export function weekTekst(week: Openingstijden, taal: Taal = 'nl'): string {
  const w = START_LIB[taal].week
  if (!heeftOpenDag(week)) return w.elkeDagDicht
  if (week.every((d) => zelfdeDag(d, week[0]))) return w.elkeDag(week[0]?.van ?? '', week[0]?.tot ?? '')
  const delen: string[] = []
  let begin = 0
  for (let i = 1; i <= 7; i++) {
    if (i < 7 && zelfdeDag(week[i], week[begin])) continue
    const d = week[begin]
    delen.push(`${dagenTekst(begin, i - 1, taal)} ${d ? w.tijden(d.van, d.tot) : w.dicht}`)
    begin = i
  }
  const tekst = delen.join(', ')
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

/** Zonder lestypen en zonder soort: een les die bij elke sportschool past. */
export const NEUTRALE_LES = 'Groepsles'

/**
 * De les in het voorbeeld van de ledenapp: het eerste eigen lestype, en
 * zonder eigen lestypen een neutrale les. Nooit een les die de sportschool
 * niet zelf koos.
 */
export function voorbeeldLes(eigen: readonly string[]): string {
  const namen = eigen.map((n) => n.trim()).filter(Boolean)
  return namen[0] ?? NEUTRALE_LES
}
