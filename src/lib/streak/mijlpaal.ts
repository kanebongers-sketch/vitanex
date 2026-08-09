// ─── Streak-mijlpalen (puur) ────────────────────────────────────────────────
// Vier échte vooruitgang op vaste drempels, en toon hoe ver de volgende weg is.
// Geen valse urgentie of straf — alleen erkenning van wat je al deed.

export interface Mijlpaal {
  dagen: number
  titel: string
  emoji: string
}

const MIJLPALEN: readonly Mijlpaal[] = [
  { dagen: 3, titel: 'Drie dagen op rij!', emoji: '🔥' },
  { dagen: 7, titel: 'Een week volgehouden!', emoji: '⭐' },
  { dagen: 14, titel: 'Twee weken — sterk bezig!', emoji: '💪' },
  { dagen: 30, titel: 'Een hele maand!', emoji: '🏆' },
  { dagen: 50, titel: '50 dagen — indrukwekkend!', emoji: '🚀' },
  { dagen: 100, titel: '100 dagen. Legendarisch.', emoji: '👑' },
]

/** De mijlpaal die je vandaag exact bereikt (om te vieren), of null. */
export function huidigeMijlpaal(streak: number): Mijlpaal | null {
  return MIJLPALEN.find((m) => m.dagen === streak) ?? null
}

/** De eerstvolgende mijlpaal boven je huidige streak, of null als je alles hebt. */
export function volgendeMijlpaal(streak: number): Mijlpaal | null {
  return MIJLPALEN.find((m) => m.dagen > streak) ?? null
}

/** Aantal dagen tot de volgende mijlpaal, of null. */
export function dagenTotVolgende(streak: number): number | null {
  const volgende = volgendeMijlpaal(streak)
  return volgende ? volgende.dagen - streak : null
}
