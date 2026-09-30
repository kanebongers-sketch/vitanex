// ─── LifeOS — open taken op tijd gegroepeerd (puur) ─────────────────────────
// Overzicht in één blik: wat is te laat, wat moet vandaag, morgen, deze week,
// later, en wat is "ooit". Lege groepen verdwijnen. Afgevinkte taken tellen niet.

import type { Taak } from './taken'

export type TijdGroepSleutel = 'te_laat' | 'vandaag' | 'morgen' | 'deze_week' | 'later' | 'ooit'

export interface TijdGroep {
  sleutel: TijdGroepSleutel
  kop: string
  taken: Taak[]
}

const KOPPEN: Record<TijdGroepSleutel, string> = {
  te_laat: 'Te laat',
  vandaag: 'Vandaag',
  morgen: 'Morgen',
  deze_week: 'Deze week',
  later: 'Later',
  ooit: 'Ooit',
}

const VOLGORDE: readonly TijdGroepSleutel[] = ['te_laat', 'vandaag', 'morgen', 'deze_week', 'later', 'ooit']

function dagPlus(vandaag: string, n: number): string {
  const [j, m, d] = vandaag.split('-').map(Number)
  const t = new Date(Date.UTC(j, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

/** Zondag van de week van `vandaag` (maandag = begin van de week). */
function zondagVan(vandaag: string): string {
  const [j, m, d] = vandaag.split('-').map(Number)
  const weekdag = new Date(Date.UTC(j, m - 1, d)).getUTCDay() // 0 = zondag
  return dagPlus(vandaag, weekdag === 0 ? 0 : 7 - weekdag)
}

function groepVan(datum: string | null, vandaag: string): TijdGroepSleutel {
  if (datum === null) return 'ooit'
  if (datum < vandaag) return 'te_laat'
  if (datum === vandaag) return 'vandaag'
  if (datum === dagPlus(vandaag, 1)) return 'morgen'
  if (datum <= zondagVan(vandaag)) return 'deze_week'
  return 'later'
}

/** De open taken per tijdgroep, in vaste volgorde; binnen een groep op datum, dan op volgorde van aanmaken. */
export function groepeerOpTijd(taken: readonly Taak[], vandaag: string): TijdGroep[] {
  const per = new Map<TijdGroepSleutel, Taak[]>()
  for (const t of taken) {
    if (t.klaar) continue
    const g = groepVan(t.datum, vandaag)
    per.set(g, [...(per.get(g) ?? []), t])
  }
  return VOLGORDE.filter((g) => per.has(g)).map((g) => ({
    sleutel: g,
    kop: KOPPEN[g],
    taken: [...(per.get(g) ?? [])].sort(
      (a, b) => (a.datum ?? '').localeCompare(b.datum ?? '') || a.aangemaaktOp.localeCompare(b.aangemaaktOp),
    ),
  }))
}
