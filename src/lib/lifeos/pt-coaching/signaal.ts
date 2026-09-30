// ─── LifeOS — signaal uit je coachgesprekken (puur) ─────────────────────────
// Geeft een PT'er twee gesprekken op rij een lage score (≤ 2) op hetzelfde vlak,
// dan meldt LifeOS dat — vroeg, vóór iemand afhaakt. Eén lage score is een
// slechte dag; twee op rij is een patroon. Nooit op basis van één gesprek.

import type { EvaluatieJson, EvaluatieScores } from './pt-coaching'

const LAAG = 2
const LABEL: Record<keyof EvaluatieScores, string> = {
  algemeen: 'Algemeen gevoel',
  energie: 'Energie',
  voortgang: 'Voortgang',
}

export interface CoachSignaal {
  naam: string
  tekst: string
}

/** `evaluaties` = per persoon, nieuwste eerst (minstens de laatste twee). */
export function coachSignalen(
  team: readonly { id: string; naam: string }[],
  evaluaties: ReadonlyMap<string, readonly EvaluatieJson[]>,
): CoachSignaal[] {
  const uit: CoachSignaal[] = []
  for (const p of team) {
    const [laatste, vorige] = evaluaties.get(p.id) ?? []
    if (!laatste || !vorige) continue
    for (const vlak of Object.keys(LABEL) as (keyof EvaluatieScores)[]) {
      const a = laatste.scores[vlak]
      const b = vorige.scores[vlak]
      if (a <= LAAG && b <= LAAG) {
        uit.push({ naam: p.naam, tekst: `${LABEL[vlak]} van ${p.naam} 2× op rij laag (${b} en ${a}) — bespreek dit` })
      }
    }
  }
  return uit
}
