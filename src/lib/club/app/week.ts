// ─── Fit Factory Club, ledenapp: trainingen deze week (PUUR) ────────────────
// Het doel per week is het aantal trainingsdagen in het schema (A, B, C: drie
// keer). Weken beginnen op maandag, in Nederlandse tijd.

import { dagSleutel, maandagVan, plusDagen } from '@/lib/club/cijfers/tijd'

export interface WeekVoortgang {
  gedaan: number
  doel: number
}

/** Aantal trainingen (afgevinkt of gelogd) in de week van `nu`. `extra`: nog niet geladen, net afgerond. */
export function weekVoortgang(logs: readonly { op: string }[], aantalDagen: number, nu: Date, extra = 0): WeekVoortgang {
  const maandag = maandagVan(dagSleutel(nu))
  const zondag = plusDagen(maandag, 6)
  const gedaan = logs.filter((l) => {
    const dag = dagSleutel(new Date(l.op))
    return dag >= maandag && dag <= zondag
  }).length
  return { gedaan: gedaan + Math.max(0, extra), doel: Math.min(7, Math.max(1, aantalDagen)) }
}
