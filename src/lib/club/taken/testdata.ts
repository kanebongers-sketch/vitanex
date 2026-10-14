// ─── Fit Factory Club, taken: bouwstenen voor de tests (PUUR) ───────────────

import type { Afvinking, Taak } from './typen'

export function maakTaak(deel: Partial<Taak> & { id: string }): Taak {
  return {
    lijstId: 'lijst-1',
    naam: deel.id,
    groep: null,
    frequentie: 'dagelijks',
    perWeekMin: null,
    moment: 'vrij',
    volgorde: 0,
    actief: true,
    ...deel,
  }
}

export function vink(taakId: string, datum: string, wie = 'Lynn Maas'): Afvinking {
  return { id: `${taakId}-${datum}`, taakId, datum, afgevinktOp: `${datum}T10:00:00Z`, medewerkerId: null, wie, notitie: null }
}

/** De week van maandag 12 oktober 2026. */
export const WEEK = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18']
