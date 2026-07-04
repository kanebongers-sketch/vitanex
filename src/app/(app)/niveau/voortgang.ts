// ─── Voortgangsberekeningen voor de niveau-pagina ─────────────────────────────
// Pure helpers die uit de al geladen XP-history afleiden hoe actief deze en
// voorgaande weken waren. Geen nieuwe databronnen: alles komt uit XPData dat
// de pagina toch al ophaalt. "Actief" betekent: minstens één gelogd XP-event
// (check-in, doelregistratie, streak of mijlpaal) op die dag.
//
// Kanttekening: de history is gemaximeerd op 50 events (zie lib/xp.ts), dus
// heel oude weken kunnen onvolledig zijn — daarom kijken we maximaal 4 weken
// terug.

import type { XPEvent } from '@/lib/xp'

export interface WeekDag {
  /** Kort NL-label: 'ma' … 'zo'. */
  label: string
  /** Lokale kalenderdatum YYYY-MM-DD. */
  datum: string
  actief: boolean
  isVandaag: boolean
  inToekomst: boolean
}

export interface WeekOverzichtData {
  dagen: WeekDag[]
  actieveDagen: number
  vorigeWeekActieveDagen: number
  checkinDezeWeek: boolean
}

export interface WeekActiviteit {
  /** Startdatum (maandag) van de week, YYYY-MM-DD. */
  start: string
  actieveDagen: number
}

const DAG_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const

/** Lokale kalenderdatum als YYYY-MM-DD (géén UTC-shift zoals toISOString). */
export function dagKey(d: Date): string {
  const maand = `${d.getMonth() + 1}`.padStart(2, '0')
  const dag = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${maand}-${dag}`
}

/** Parseert YYYY-MM-DD als lokale datum. Ongeldig → Invalid Date (vergelijkt altijd false). */
export function parseDatum(s: string): Date {
  const delen = s.split('-').map(Number)
  if (delen.length !== 3 || delen.some(Number.isNaN)) return new Date(NaN)
  return new Date(delen[0], delen[1] - 1, delen[2])
}

/** Maandag 00:00 (lokaal) van de week waarin `d` valt. */
export function weekStart(d: Date): Date {
  const kopie = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dagVanWeek = kopie.getDay() === 0 ? 6 : kopie.getDay() - 1
  kopie.setDate(kopie.getDate() - dagVanWeek)
  return kopie
}

function datumPlusDagen(d: Date, dagen: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dagen)
}

function actieveDagenSet(history: readonly XPEvent[]): Set<string> {
  return new Set(history.map(e => e.datum))
}

function telActieveDagenInWeek(actief: ReadonlySet<string>, start: Date): number {
  let telling = 0
  for (let i = 0; i < 7; i++) {
    if (actief.has(dagKey(datumPlusDagen(start, i)))) telling++
  }
  return telling
}

/** Het weekoverzicht voor de week waarin `nu` valt, plus vergelijking met vorige week. */
export function berekenWeekOverzicht(
  history: readonly XPEvent[],
  lastCheckinDatum: string | null,
  nu: Date,
): WeekOverzichtData {
  const actief = actieveDagenSet(history)
  const start = weekStart(nu)
  const vandaagKey = dagKey(nu)

  const dagen: WeekDag[] = DAG_LABELS.map((label, i) => {
    const key = dagKey(datumPlusDagen(start, i))
    return {
      label,
      datum: key,
      actief: actief.has(key),
      isVandaag: key === vandaagKey,
      inToekomst: key > vandaagKey,
    }
  })

  const checkinDezeWeek = lastCheckinDatum !== null
    && weekStart(parseDatum(lastCheckinDatum)).getTime() === start.getTime()

  return {
    dagen,
    actieveDagen: dagen.filter(d => d.actief).length,
    vorigeWeekActieveDagen: telActieveDagenInWeek(actief, datumPlusDagen(start, -7)),
    checkinDezeWeek,
  }
}

/** Actieve dagen per week voor de laatste `aantal` weken, oudste eerst (incl. huidige week). */
export function laatsteWeken(
  history: readonly XPEvent[],
  nu: Date,
  aantal = 4,
): WeekActiviteit[] {
  const actief = actieveDagenSet(history)
  const huidigeStart = weekStart(nu)
  const weken: WeekActiviteit[] = []
  for (let terug = aantal - 1; terug >= 0; terug--) {
    const start = datumPlusDagen(huidigeStart, -7 * terug)
    weken.push({ start: dagKey(start), actieveDagen: telActieveDagenInWeek(actief, start) })
  }
  return weken
}

function dagWoord(n: number): string {
  return n === 1 ? 'dag' : 'dagen'
}

/** Nuchtere momentum-zin — nooit schuld-framing bij een mindere week. */
export function momentumTekst(actieveDagen: number, vorigeWeek: number): string {
  if (actieveDagen === 0 && vorigeWeek === 0) {
    return 'Nog geen activiteit gelogd — een korte check-in is een prima eerste stap.'
  }
  if (vorigeWeek === 0) {
    return 'Vorige week geen gelogde activiteit — deze week ben je al begonnen.'
  }
  if (actieveDagen > vorigeWeek) {
    return `Meer dan vorige week (${vorigeWeek} ${dagWoord(vorigeWeek)}) — rustig opgebouwd momentum.`
  }
  if (actieveDagen === vorigeWeek) {
    return `Hetzelfde ritme als vorige week (${vorigeWeek} ${dagWoord(vorigeWeek)}).`
  }
  return `Vorige week ${vorigeWeek} ${dagWoord(vorigeWeek)} — elke actieve dag telt, ook deze week.`
}
