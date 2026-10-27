import type { RolSleutel } from '@/components/aiyourgym/inhoud/systeem'

// ─── AI Your Gym: de momenten van de werkdag op de voorpagina (PUUR) ────────
// Elke sectie van de voorpagina is een moment van dezelfde dag in een
// sportschool (docs/aiyourgym/scroll-craft/BRIEF.md). De namen staan per taal
// in woorden/website/dag.ts (DAG.momenten); hier alleen id en tijd.

export const DAG_MOMENTEN = [
  { id: 'open', minuten: 6 * 60 },
  { id: 'dag', minuten: 7 * 60 },
  { id: 'schema', minuten: 10 * 60 + 30 },
  { id: 'wie', minuten: 21 * 60 + 30 },
  { id: 'dicht', minuten: 22 * 60 },
] as const

export type MomentId = (typeof DAG_MOMENTEN)[number]['id']

/** De tijd van een moment in minuten na middernacht. */
export function momentTijd(id: MomentId): number {
  return DAG_MOMENTEN.find((m) => m.id === id)?.minuten ?? 0
}

/** Wanneer elke plek in de club op een gewone dag aan de beurt is (de oogopslag als dienstrooster). */
export const ROL_TIJD: Readonly<Record<RolSleutel, number>> = {
  balie: 6 * 60,
  vloer: 7 * 60,
  trainer: 10 * 60 + 30,
  lid: 18 * 60 + 30,
  eigenaar: 21 * 60,
}
