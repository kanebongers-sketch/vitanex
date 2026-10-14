// ─── Fit Factory Club, taken: voortgang en achterstand (PUUR) ───────────────
// Alles wat de pagina's uitrekenen staat hier, zonder database of klok: de
// datum van vandaag en de dagen van de week komen altijd als argument binnen.
// Datums zijn kalenderdagen "2026-10-14" (Nederlandse dag), dus vergelijken
// als tekst klopt.

import type { Afvinking, Moment, Taak } from './typen'

/** gehaald: minimum binnen. bezig: nog haalbaar. achter: geen speling meer of week voorbij. vrij: geen minimum. */
export type WeekStatus = 'gehaald' | 'bezig' | 'achter' | 'vrij'

export interface WeekTeller {
  gedaan: number
  minimum: number | null
  status: WeekStatus
}

export function vakSleutel(taakId: string, datum: string): string {
  return `${taakId}|${datum}`
}

/** Snel opzoeken: welk vinkje staat er in vakje (taak, dag)? */
export function afvinkIndex(afvinkingen: readonly Afvinking[]): Map<string, Afvinking> {
  return new Map(afvinkingen.map((a) => [vakSleutel(a.taakId, a.datum), a]))
}

/** Hoe vaak per week moet deze taak minimaal? Elke dag = 7, indien nodig en extra = geen minimum. */
export function normPerWeek(taak: Pick<Taak, 'frequentie' | 'perWeekMin'>): number | null {
  if (taak.frequentie === 'dagelijks') return 7
  if (taak.frequentie === 'per_week') return taak.perWeekMin ?? 1
  return null
}

/** Hoeveel dagen van deze week zijn er nog, vandaag meegeteld. Week voorbij = 0, week in de toekomst = 7. */
export function resterendeDagen(dagen: readonly string[], vandaag: string): number {
  return dagen.filter((d) => d >= vandaag).length
}

/** Hoe vaak is deze taak gedaan op deze dagen? */
export function telGedaan(taakId: string, afvinkingen: readonly Afvinking[], dagen: readonly string[]): number {
  const set = new Set(dagen)
  return afvinkingen.filter((a) => a.taakId === taakId && set.has(a.datum)).length
}

/**
 * De teller voor een weektaak ("2 van 3"). Achter = het minimum is niet meer
 * met speling te halen: er moet op elke resterende dag iets gebeuren, of meer.
 */
export function weekTeller(taak: Taak, afvinkingen: readonly Afvinking[], dagen: readonly string[], vandaag: string): WeekTeller {
  const gedaan = telGedaan(taak.id, afvinkingen, dagen)
  if (taak.frequentie !== 'per_week') return { gedaan, minimum: null, status: 'vrij' }
  const minimum = taak.perWeekMin ?? 1
  if (gedaan >= minimum) return { gedaan, minimum, status: 'gehaald' }
  const nodig = minimum - gedaan
  const rest = resterendeDagen(dagen, vandaag)
  return { gedaan, minimum, status: nodig >= rest ? 'achter' : 'bezig' }
}

export type VandaagSoort = 'verplicht' | 'optioneel'

export interface VandaagTaak {
  taak: Taak
  afgevinkt: Afvinking | null
  soort: VandaagSoort
  /** Alleen bij weektaken: de stand deze week, het vinkje van vandaag meegeteld. */
  teller: WeekTeller | null
}

function hoortVandaag(taak: Taak, gedaanVoorVandaag: number, vandaagGedaan: boolean): VandaagSoort | null {
  if (taak.frequentie === 'dagelijks') return 'verplicht'
  if (taak.frequentie === 'per_week') {
    if (vandaagGedaan) return 'verplicht'
    return gedaanVoorVandaag < (taak.perWeekMin ?? 1) ? 'verplicht' : null
  }
  return 'optioneel'
}

/**
 * De taken van vandaag voor de balie: elke dagtaak, de weektaken waarvan het
 * minimum nog niet gehaald is (of die vandaag al gedaan zijn), en de taken
 * voor als er tijd is (indien nodig, extra).
 */
export function takenVanVandaag(taken: readonly Taak[], afvinkingen: readonly Afvinking[], dagen: readonly string[], vandaag: string): VandaagTaak[] {
  const index = afvinkIndex(afvinkingen)
  const ervoor = dagen.filter((d) => d < vandaag)
  const uit: VandaagTaak[] = []
  for (const taak of taken) {
    if (!taak.actief) continue
    const afgevinkt = index.get(vakSleutel(taak.id, vandaag)) ?? null
    const soort = hoortVandaag(taak, telGedaan(taak.id, afvinkingen, ervoor), afgevinkt !== null)
    if (!soort) continue
    const teller = taak.frequentie === 'per_week' ? weekTeller(taak, afvinkingen, dagen, vandaag) : null
    uit.push({ taak, afgevinkt, soort, teller })
  }
  return uit
}

/** Groepeer per moment in vaste volgorde; lege momenten vallen weg. */
export function perMoment(items: readonly VandaagTaak[]): { moment: Moment; items: VandaagTaak[] }[] {
  const volgorde: Moment[] = ['ochtend', 'vrij', 'middag', 'afsluiten']
  return volgorde
    .map((moment) => ({ moment, items: items.filter((i) => i.taak.moment === moment) }))
    .filter((g) => g.items.length > 0)
}

/** Hoeveel verplichte taken staan vandaag nog open? */
export function nogOpen(items: readonly VandaagTaak[]): number {
  return items.filter((i) => i.soort === 'verplicht' && !i.afgevinkt).length
}
