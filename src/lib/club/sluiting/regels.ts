// ─── Club, sluitingsdagen: wat geldt op een dag (PUUR) ──────────────────────
// Voorrang: een regel voor de vestiging zelf gaat boven een regel voor alle
// vestigingen. Zonder regel gelden de gewone openingstijden van die weekdag.

import type { Openingstijd, Openingstijden } from '@/lib/club/rooster/openingstijden'
import { isoWeekdag, nlDelen, plusDagen, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Feestdag, FeestdagSleutel } from './feestdagen'
import { sorteerSluitingen, type Sluiting, type SluitingSoort } from './model'

/** De sluiting die op deze datum voor deze vestiging geldt, of null. */
export function sluitingOp(datum: string, vestiging: string, sluitingen: readonly Sluiting[]): Sluiting | null {
  let algemeen: Sluiting | null = null
  for (const s of sluitingen) {
    if (s.datum !== datum) continue
    if (s.vestiging === vestiging) return s
    if (s.vestiging === null && !algemeen) algemeen = s
  }
  return algemeen
}

export type DagOpening =
  | { status: 'open'; tijd: Openingstijd; sluiting: null }
  | { status: 'afwijkend'; tijd: Openingstijd; sluiting: Sluiting }
  | { status: 'gesloten'; tijd: null; sluiting: Sluiting | null }

/** Wanneer is deze vestiging op deze datum open? Gesloten zonder sluiting = gewoon dicht op die weekdag. */
export function openingstijdenOp(datum: string, vestiging: string, standaard: Openingstijden, sluitingen: readonly Sluiting[]): DagOpening {
  const s = sluitingOp(datum, vestiging, sluitingen)
  if (s?.soort === 'gesloten') return { status: 'gesloten', tijd: null, sluiting: s }
  if (s?.soort === 'afwijkend' && s.van && s.tot) return { status: 'afwijkend', tijd: { van: s.van, tot: s.tot }, sluiting: s }
  const gewoon = standaard[isoWeekdag(datum) - 1]
  return gewoon ? { status: 'open', tijd: gewoon, sluiting: null } : { status: 'gesloten', tijd: null, sluiting: null }
}

/**
 * Voor de lesgenerator: per datum null (dicht, geen lessen) of de afwijkende
 * openingstijd (alleen lessen die daar helemaal binnen vallen).
 */
export function uitzonderingenVoor(vestiging: string, sluitingen: readonly Sluiting[]): Map<string, Openingstijd | null> {
  const uit = new Map<string, Openingstijd | null>()
  for (const datum of new Set(sluitingen.map((s) => s.datum))) {
    const s = sluitingOp(datum, vestiging, sluitingen)
    if (!s) continue
    uit.set(datum, s.soort === 'afwijkend' && s.van && s.tot ? { van: s.van, tot: s.tot } : null)
  }
  return uit
}

/** Valt een les (kloktijden in minuten) buiten de opening van deze dag? null = dicht. */
export function buitenOpening(startMin: number, eindMin: number, opening: Openingstijd | null): boolean {
  if (!opening) return true
  return startMin < tijdNaarMinuten(opening.van) || eindMin > tijdNaarMinuten(opening.tot)
}

export interface LesMoment {
  id: string
  vestiging: string
  startOp: string
  eindOp: string
}

/** Minuten sinds middernacht van een eindtijd; middernacht van de volgende dag telt als 1440. */
function eindMinuten(start: ReturnType<typeof nlDelen>, eindOp: string): number {
  const eind = nlDelen(new Date(eindOp))
  return eind.datum > start.datum ? 1440 + eind.minuten : eind.minuten
}

/** De lessen die door deze sluiting niet door kunnen gaan (een andere regel met voorrang telt niet mee). */
export function geraakteLessen(sluiting: Sluiting, lessen: readonly LesMoment[], alle: readonly Sluiting[]): LesMoment[] {
  return lessen.filter((les) => {
    const start = nlDelen(new Date(les.startOp))
    if (start.datum !== sluiting.datum) return false
    if (sluiting.vestiging !== null && les.vestiging !== sluiting.vestiging) return false
    if (sluitingOp(start.datum, les.vestiging, alle)?.id !== sluiting.id) return false
    const opening = sluiting.soort === 'afwijkend' && sluiting.van && sluiting.tot ? { van: sluiting.van, tot: sluiting.tot } : null
    return buitenOpening(start.minuten, eindMinuten(start, les.eindOp), opening)
  })
}

/** Per sluiting het aantal geraakte lessen (alleen sluitingen met minstens een les). */
export function geraaktPerSluiting(sluitingen: readonly Sluiting[], lessen: readonly LesMoment[]): Record<string, number> {
  const uit: Record<string, number> = {}
  for (const s of sluitingen) {
    const n = geraakteLessen(s, lessen, sluitingen).length
    if (n > 0) uit[s.id] = n
  }
  return uit
}

export interface KomendeAfwijking {
  datum: string
  sluiting: Sluiting
}

/** Sluitingen en afwijkende dagen voor deze vestiging van vandaag tot en met `dagen` dagen verder. */
export function komendeAfwijkingen(vestiging: string, vandaag: string, dagen: number, sluitingen: readonly Sluiting[]): KomendeAfwijking[] {
  const uit: KomendeAfwijking[] = []
  for (let i = 0; i <= dagen; i++) {
    const datum = plusDagen(vandaag, i)
    const s = sluitingOp(datum, vestiging, sluitingen)
    if (s) uit.push({ datum, sluiting: s })
  }
  return uit
}

export interface Maandgroep {
  /** 1 = januari. */
  maand: number
  sluitingen: Sluiting[]
}

/** Het jaaroverzicht: alleen maanden met sluitingen, op volgorde. */
export function perMaand(sluitingen: readonly Sluiting[]): Maandgroep[] {
  const groepen = new Map<number, Sluiting[]>()
  for (const s of sorteerSluitingen(sluitingen)) {
    const maand = Number(s.datum.slice(5, 7))
    groepen.set(maand, [...(groepen.get(maand) ?? []), s])
  }
  return [...groepen.entries()].sort(([a], [b]) => a - b).map(([maand, lijst]) => ({ maand, sluitingen: lijst }))
}

export interface FeestdagKeuze {
  sleutel: FeestdagSleutel
  soort: SluitingSoort
  van: string | null
  tot: string | null
}

export interface NieuweSluiting {
  vestiging: string | null
  datum: string
  soort: SluitingSoort
  van: string | null
  tot: string | null
  reden: string
}

/** Bestaat er al een regel op deze datum voor precies deze vestiging (of voor alle)? */
export function bestaatAl(datum: string, vestiging: string | null, bestaande: readonly Sluiting[]): boolean {
  return bestaande.some((s) => s.datum === datum && s.vestiging === vestiging)
}

/** De gekozen feestdagen als nieuwe regels, zonder de dagen die er al staan. */
export function nieuweFeestdagen(
  feestdagen: readonly Feestdag[],
  keuzes: readonly FeestdagKeuze[],
  vestiging: string | null,
  bestaande: readonly Sluiting[],
): NieuweSluiting[] {
  const gehad = new Set<string>()
  return keuzes.flatMap((k) => {
    const dag = feestdagen.find((f) => f.sleutel === k.sleutel)
    if (!dag || gehad.has(dag.datum) || bestaatAl(dag.datum, vestiging, bestaande)) return []
    gehad.add(dag.datum)
    const afwijkend = k.soort === 'afwijkend'
    return [{ vestiging, datum: dag.datum, soort: k.soort, van: afwijkend ? k.van : null, tot: afwijkend ? k.tot : null, reden: dag.naam }]
  })
}
