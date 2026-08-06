// ─── LifeOS — het 4-weken blok: voortgang & evaluatie (puur) ────────────────
// Rekent uit hoe ver je in het blok bent: per week welke van de 6 loggbare
// sessies je hebt afgerond, en het totaal over de vier weken. PUUR — datums en
// afgeronde sessies komen als argument binnen, zodat dit testbaar is zonder DB of
// klok (dezelfde afspraak als programma.ts).
//
// Een rustdag telt niet mee: die log je niet, dus 6 sessies per week, 24 in het
// hele blok. "Gedaan" = er is een afgeronde sessie met die (week, code).

import { BLOK_WEEK, BLOK_WEKEN, blokWeekVoorDatum } from './programma'

/** Eén afgeronde sessie zoals het overzicht 'm nodig heeft (subset van SessieRij). */
export interface AfgerondeSessie {
  sessieCode: string | null
  blokWeek: number | null
  voltooidOp: string | null
}

export interface SessieStatus {
  code: string
  titel: string
  soort: 'kracht' | 'cardio'
  gedaan: boolean
}

export interface WeekOverzicht {
  week: 1 | 2 | 3 | 4
  gedaan: number
  totaal: number
  sessies: SessieStatus[]
}

export interface BlokOverzicht {
  huidigeWeek: number | null
  totaalGedaan: number
  totaalGepland: number
  weken: WeekOverzicht[]
}

/** De 6 loggbare sessies per week (rust valt weg) in weekvolgorde. */
const LOGBARE_SESSIES = BLOK_WEEK.filter((d) => d.soort !== 'rust').map((d) => ({
  code: d.code,
  titel: d.titel,
  soort: d.soort as 'kracht' | 'cardio',
}))

/**
 * Bouwt het volledige blok-overzicht. `sessies` mag alle afgeronde sessies van de
 * gebruiker bevatten; alleen die met een geldige (week, code) tellen mee.
 */
export function bouwOverzicht(startDatum: string, vandaag: string, sessies: readonly AfgerondeSessie[]): BlokOverzicht {
  // Set van "week#code" voor de afgeronde sessies — één lookup per cel.
  const gedaan = new Set<string>()
  for (const s of sessies) {
    if (s.voltooidOp === null || s.sessieCode === null || s.blokWeek === null) continue
    gedaan.add(`${s.blokWeek}#${s.sessieCode}`)
  }

  const weken: WeekOverzicht[] = []
  for (let week = 1 as 1 | 2 | 3 | 4; week <= BLOK_WEKEN; week = (week + 1) as 1 | 2 | 3 | 4) {
    const statusPerSessie = LOGBARE_SESSIES.map((s) => ({
      code: s.code,
      titel: s.titel,
      soort: s.soort,
      gedaan: gedaan.has(`${week}#${s.code}`),
    }))
    weken.push({
      week,
      gedaan: statusPerSessie.filter((s) => s.gedaan).length,
      totaal: LOGBARE_SESSIES.length,
      sessies: statusPerSessie,
    })
  }

  return {
    huidigeWeek: blokWeekVoorDatum(startDatum, vandaag),
    totaalGedaan: weken.reduce((som, w) => som + w.gedaan, 0),
    totaalGepland: LOGBARE_SESSIES.length * BLOK_WEKEN,
    weken,
  }
}
