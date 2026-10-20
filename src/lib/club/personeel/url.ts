// ─── Fit Factory Club, personeel: de staat in de URL (PUUR) ─────────────────
// Tabblad, week, periode, gekozen medewerker en het open zijpaneel staan in de
// zoekparameters: deelbaar, en terug/vooruit werkt.

import { isDatum, isTijd } from '@/lib/club/rooster/tijd'
import { isUuid } from './invoer'
import { PERIODE_SOORTEN, type PeriodeSoort } from './uren'

export const TABBLADEN = ['week', 'team', 'mijn', 'uren'] as const
export type Tabblad = (typeof TABBLADEN)[number]

export const TAB_LABEL: Record<Tabblad, string> = {
  week: 'Weekrooster',
  team: 'Beschikbaarheid',
  mijn: 'Mijn diensten',
  uren: 'Uren',
}

export const PANELEN = ['patroon', 'notitie'] as const
export type Paneel = (typeof PANELEN)[number]

export interface PersoneelStaat {
  v: string
  tab: Tabblad
  week: string | null
  /** Open dienst in het zijpaneel. */
  dienst: string | null
  /** Nieuwe dienst: datum, en optioneel tijden en medewerker. */
  nieuw: string | null
  van: string | null
  tot: string | null
  mw: string | null
  paneel: Paneel | null
  periode: PeriodeSoort
  /** Ankerdatum van de urenperiode. */
  op: string | null
}

export type RuweParams = Record<string, string | string[] | undefined>

function een(v: string | string[] | undefined): string | null {
  const w = Array.isArray(v) ? v[0] : v
  return typeof w === 'string' && w !== '' ? w : null
}

function kies<T extends string>(lijst: readonly T[], v: string | null): T | null {
  return lijst.find((x) => x === v) ?? null
}

export function leesStaat(p: RuweParams, vestiging: string): PersoneelStaat {
  const week = een(p.week)
  const tijd = (k: string) => {
    const w = een(p[k])
    return isTijd(w) ? w : null
  }
  const nieuw = een(p.nieuw)
  const op = een(p.op)
  return {
    v: vestiging,
    tab: kies(TABBLADEN, een(p.tab)) ?? 'week',
    week: week && /^\d{4}-W\d{2}$/.test(week) ? week : null,
    dienst: isUuid(een(p.dienst)) ? een(p.dienst) : null,
    nieuw: isDatum(nieuw) ? nieuw : null,
    van: tijd('van'),
    tot: tijd('tot'),
    mw: isUuid(een(p.mw)) ? een(p.mw) : null,
    paneel: kies(PANELEN, een(p.paneel)),
    periode: kies(PERIODE_SOORTEN, een(p.periode)) ?? 'week',
    op: isDatum(op) ? op : null,
  }
}

/** Een personeel-URL met wijzigingen; null haalt een parameter weg. */
export function personeelHref(staat: PersoneelStaat, wijziging: Partial<PersoneelStaat> = {}): string {
  const s = { ...staat, ...wijziging }
  const p = new URLSearchParams({ v: s.v })
  // Altijd het tabblad erbij: zonder tab opent een medewerker zijn eigen diensten (zie personeel/page.tsx).
  p.set('tab', s.tab)
  if (s.week) p.set('week', s.week)
  if (s.mw) p.set('mw', s.mw)
  if (s.tab === 'uren') {
    if (s.periode !== 'week') p.set('periode', s.periode)
    if (s.op) p.set('op', s.op)
  }
  if (s.dienst) p.set('dienst', s.dienst)
  if (s.nieuw) p.set('nieuw', s.nieuw)
  if (s.van) p.set('van', s.van)
  if (s.tot) p.set('tot', s.tot)
  if (s.paneel) p.set('paneel', s.paneel)
  return `/clubkane/personeel?${p.toString()}`
}

/** Zonder open paneel (voor sluiten). */
export function zonderPaneel(staat: PersoneelStaat): PersoneelStaat {
  const mw = staat.tab === 'week' ? null : staat.mw
  return { ...staat, dienst: null, nieuw: null, van: null, tot: null, paneel: null, mw }
}
