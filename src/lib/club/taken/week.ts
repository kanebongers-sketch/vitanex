// ─── Fit Factory Club, taken: de gekozen week (PUUR) ────────────────────────

import { dagenVanWeek, isoWeek, maandagUitWeekParam, plusDagen, weekParam } from '@/lib/club/rooster/tijd'

export interface WeekContext {
  vandaag: string
  maandag: string
  zondag: string
  dagen: string[]
  weekNummer: number
  vorige: string
  volgende: string
  isDezeWeek: boolean
}

/** Alles over de week uit de URL ("2026-W42"); leeg of ongeldig = de week van vandaag. */
export function weekContext(week: string | null, vandaag: string): WeekContext {
  const maandag = maandagUitWeekParam(week, vandaag)
  const dagen = dagenVanWeek(maandag)
  return {
    vandaag,
    maandag,
    zondag: dagen[6],
    dagen,
    weekNummer: isoWeek(maandag).week,
    vorige: weekParam(plusDagen(maandag, -7)),
    volgende: weekParam(plusDagen(maandag, 7)),
    isDezeWeek: dagen.includes(vandaag),
  }
}
