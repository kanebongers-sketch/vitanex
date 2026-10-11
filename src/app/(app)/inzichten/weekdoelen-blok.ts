// ─── Pure helpers voor het Weekdoelen-blok op /inzichten ──────────────────────
// Eerlijke noemer: target_waarde is een dágwaarde per doel (bv. "8 uur" of
// "30 minuten"), géén aantal momenten per week — die optellen zou een verzonnen
// noemer geven. De data ondersteunt alleen wat er echt gelogd is:
// noemer = gelogde doelmomenten, teller = daarvan gehaald.
// De historie bewaart per doel alleen het aantal gehaalde logs (geen totaal),
// dus de vorige-week-regel is een kaal aantal, zonder noemer.

import type { WeekDoel, WeekHistorieEntry } from '@/lib/doelen/weekdoelen'
import type { Taalset } from '@/lib/i18n/taalset'
import { NL_VOORTGANG } from '@/lib/pijlers/teksten'

export interface WeekMomenten {
  gehaald: number
  gelogd: number
}

/** Telt over alle doelen hoeveel momenten er gelogd zijn en hoeveel daarvan gehaald. */
export function telWeekMomenten(doelen: WeekDoel[]): WeekMomenten {
  return doelen.reduce<WeekMomenten>((acc, doel) => ({
    gehaald: acc.gehaald + doel.logs.filter(l => l.gehaald).length,
    gelogd: acc.gelogd + doel.logs.length,
  }), { gehaald: 0, gelogd: 0 })
}

/** Som van de gehaalde momenten in een afgeronde week uit de historie. */
export function telHistorieGehaald(entry: WeekHistorieEntry): number {
  return entry.doelen.reduce((som, doel) => som + doel.gehaald, 0)
}

/** Meest recente afgeronde week; de actieve week wordt (defensief) overgeslagen. */
export function vorigeWeek(
  historie: WeekHistorieEntry[],
  actieveWeekStart?: string,
): WeekHistorieEntry | null {
  return historie.find(h => h.weekStart !== actieveWeekStart) ?? null
}

/** "X van Y doelmomenten gehaald deze week" — alleen zinvol als er iets gelogd is. */
export function doelmomentenTekst({ gehaald, gelogd }: WeekMomenten, ts: Taalset = NL_VOORTGANG): string {
  return ts.t(gelogd === 1 ? 'voortgang.weekdoelen.momentenEen' : 'voortgang.weekdoelen.momentenMeer', { gehaald, gelogd })
}

/** Schuldvrije vorige-week-regel; null bij 0 — geen vergelijking, geen nullen. */
export function vorigeWeekTekst(gehaald: number, ts: Taalset = NL_VOORTGANG): string | null {
  if (gehaald <= 0) return null
  return ts.t(gehaald === 1 ? 'voortgang.weekdoelen.vorigeEen' : 'voortgang.weekdoelen.vorigeMeer', { n: gehaald })
}
