// ─── Stappen-statistiek (puur) ───────────────────────────────────────────────
// Doel-streak, afgeleide afstand, weekgemiddelde en één eerlijke Vita-viering.
// Alles puur en deterministisch (klok/history als argument), los te testen.

import { berekenStreak } from '@/lib/streak/streak'

export interface DagStap {
  datum: string // YYYY-MM-DD
  stappen: number | null
}

/** Gemiddelde staplengte in meter — grove maar eerlijke schatting (getoond als "~"). */
const STAPLENGTE_M = 0.762

/** Afstand in km, afgeleid uit stappen. Bewust een schatting, geen GPS. */
export function afstandKm(stappen: number, staplengteM: number = STAPLENGTE_M): number {
  if (!Number.isFinite(stappen) || stappen <= 0) return 0
  return (stappen * staplengteM) / 1000
}

/** De datums (YYYY-MM-DD) waarop het dagdoel gehaald is. */
export function doelHitDatums(dagen: readonly DagStap[], doel: number): string[] {
  return dagen.filter((d) => (d.stappen ?? 0) >= doel && doel > 0).map((d) => d.datum)
}

/**
 * Aantal dagen op rij dat je je stappendoel haalde — vergevend (vandaag nog niet
 * gehaald = open dag, geen breuk), via dezelfde regel als de activiteit-streak.
 */
export function doelStreak(
  dagen: readonly DagStap[],
  doel: number,
  dagTerug: (n: number) => string,
  maxDagen = 90,
): number {
  return berekenStreak(doelHitDatums(dagen, doel), dagTerug, maxDagen)
}

/** Gemiddelde stappen over de laatste N dagen met data (lege dagen tellen niet mee). */
export function gemiddeldePerDag(dagen: readonly DagStap[], n = 7): number | null {
  const metData = dagen.filter((d) => typeof d.stappen === 'number' && d.stappen > 0).slice(-n)
  if (metData.length === 0) return null
  return Math.round(metData.reduce((a, d) => a + (d.stappen ?? 0), 0) / metData.length)
}

export interface StappenViering {
  tekst: string
  emoji: string
}

const STREAK_MIJLPALEN = [30, 14, 7, 3]

/**
 * Kiest één eerlijke viering voor Vita, of null. Prioriteit: een streak-mijlpaal,
 * dan een nieuw dagrecord, dan de eerste keer 10k. Nooit iets verzinnen — alles
 * is af te leiden uit de meegegeven dagen (venster-scoped, dus eerlijk benoemd).
 */
export function kiesStappenViering(dagen: readonly DagStap[], doel: number, dagTerug: (n: number) => string): StappenViering | null {
  const vandaag = dagTerug(0)
  const vandaagRij = dagen.find((d) => d.datum === vandaag)
  const vandaagStappen = vandaagRij?.stappen ?? 0
  if (vandaagStappen <= 0) return null

  // 1. Streak-mijlpaal (exact op de drempel, zodat 'ie één keer verschijnt).
  const streak = doelStreak(dagen, doel, dagTerug)
  const mijlpaal = STREAK_MIJLPALEN.find((m) => streak === m)
  if (mijlpaal) {
    return { tekst: `${mijlpaal} dagen op rij je stappendoel gehaald — sterk volgehouden.`, emoji: '🔥' }
  }

  // 2. Nieuw dagrecord in dit venster (vandaag is strikt het hoogst).
  const eerdereMax = Math.max(0, ...dagen.filter((d) => d.datum !== vandaag).map((d) => d.stappen ?? 0))
  if (dagen.length > 1 && vandaagStappen > eerdereMax) {
    return { tekst: `Nieuw dagrecord: ${vandaagStappen.toLocaleString('nl-NL')} stappen. Beste dag tot nu toe!`, emoji: '🏆' }
  }

  // 3. Eerste keer 10.000 in dit venster.
  const eerder10k = dagen.some((d) => d.datum !== vandaag && (d.stappen ?? 0) >= 10000)
  if (vandaagStappen >= 10000 && !eerder10k) {
    return { tekst: 'Je knalde vandaag door de 10.000 stappen. 🎉', emoji: '🎉' }
  }

  return null
}
