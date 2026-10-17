// ─── Club, sluitingsdagen: het model (PUUR) ─────────────────────────────────
// Een rij in club_sluitingen: een dag waarop een vestiging dicht is, of open
// met andere tijden. vestiging = null geldt voor alle vestigingen van de
// sportschool; een regel voor een vestiging zelf gaat daar altijd boven.

import { isDatum, normaliseerTijd } from '@/lib/club/rooster/tijd'

export const SLUITING_SOORTEN = ['gesloten', 'afwijkend'] as const
export type SluitingSoort = (typeof SLUITING_SOORTEN)[number]

export interface Sluiting {
  id: string
  /** null = alle vestigingen van de sportschool. */
  vestiging: string | null
  /** "2026-12-26" */
  datum: string
  soort: SluitingSoort
  /** Alleen bij 'afwijkend': open van en tot ("09:00"). */
  van: string | null
  tot: string | null
  reden: string
  demo: boolean
}

export const SLUITING_KOLOMMEN = 'id, vestiging, datum, soort, open_van, open_tot, reden, demo'
export const MAX_REDEN = 80

export function isSluitingSoort(v: unknown): v is SluitingSoort {
  return typeof v === 'string' && (SLUITING_SOORTEN as readonly string[]).includes(v)
}

/** Systeemgrens: een databaserij naar een Sluiting, of null als hij niet klopt. */
export function sluitingUitRij(rij: unknown): Sluiting | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || !isDatum(r.datum) || !isSluitingSoort(r.soort)) return null
  const vestiging = typeof r.vestiging === 'string' && r.vestiging !== '' ? r.vestiging : null
  const van = normaliseerTijd(r.open_van)
  const tot = normaliseerTijd(r.open_tot)
  if (r.soort === 'afwijkend' && (!van || !tot)) return null
  return {
    id: r.id,
    vestiging,
    datum: r.datum,
    soort: r.soort,
    van: r.soort === 'afwijkend' ? van : null,
    tot: r.soort === 'afwijkend' ? tot : null,
    reden: typeof r.reden === 'string' ? r.reden : '',
    demo: r.demo === true,
  }
}

export function sluitingenUitRijen(rijen: readonly unknown[] | null | undefined): Sluiting[] {
  return (rijen ?? []).flatMap((r) => {
    const s = sluitingUitRij(r)
    return s ? [s] : []
  })
}

/** Op datum, en per datum eerst de regel voor alle vestigingen. */
export function sorteerSluitingen(lijst: readonly Sluiting[]): Sluiting[] {
  return [...lijst].sort((a, b) => {
    if (a.datum !== b.datum) return a.datum < b.datum ? -1 : 1
    if (a.vestiging === b.vestiging) return 0
    if (a.vestiging === null) return -1
    if (b.vestiging === null) return 1
    return a.vestiging < b.vestiging ? -1 : 1
  })
}
