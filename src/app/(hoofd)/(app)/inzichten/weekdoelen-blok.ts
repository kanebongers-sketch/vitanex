// ─── Pure helpers voor het Weekdoelen-blok op /inzichten ──────────────────────
// Eerlijke noemer: target_waarde is een dágwaarde per doel (bv. "8 uur" of
// "30 minuten"), géén aantal momenten per week — die optellen zou een verzonnen
// noemer geven. De data ondersteunt alleen wat er echt gelogd is:
// noemer = gelogde doelmomenten, teller = daarvan gehaald.
// De historie bewaart per doel alleen het aantal gehaalde logs (geen totaal),
// dus de vorige-week-regel is een kaal aantal, zonder noemer.

import type { WeekDoel, WeekHistorieEntry } from '@/lib/doelen/weekdoelen'

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

function momentWoord(aantal: number): string {
  return aantal === 1 ? 'doelmoment' : 'doelmomenten'
}

/** "X van Y doelmomenten gehaald deze week" — alleen zinvol als er iets gelogd is. */
export function doelmomentenTekst({ gehaald, gelogd }: WeekMomenten): string {
  return `${gehaald} van ${gelogd} ${momentWoord(gelogd)} gehaald deze week`
}

/** Schuldvrije vorige-week-regel; null bij 0 — geen vergelijking, geen nullen. */
export function vorigeWeekTekst(gehaald: number): string | null {
  if (gehaald <= 0) return null
  return `Vorige week: ${gehaald} ${momentWoord(gehaald)} gehaald.`
}
