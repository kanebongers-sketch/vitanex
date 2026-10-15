// ─── Fit Factory Club: lessen per dag (PUUR) ────────────────────────────────
// Voor maandcijfers en vergelijkingen tellen we lessen per vestiging per dag:
// zo kan elk venster (hele maand, of de eerste 14 dagen) uit dezelfde rijen
// worden opgeteld. De database levert dit via club_cijfers_lessen_dag
// (migratie 396); zonder die functie maken we het hier uit tellingen per les.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { LesTelling } from './lessen'
import { inVenster, type Venster } from './maand'
import { dagSleutel } from './tijd'
import { aandeel } from './vergelijking'

export interface LesDag {
  vestiging: Vestiging
  dag: string
  /** Lessen die doorgingen en al begonnen waren. */
  lessen: number
  capaciteit: number
  /** Geboekte plekken, per les hoogstens de capaciteit. */
  bezet: number
  aanwezig: number
  noShow: number
}

/** Tellingen per les naar tellingen per dag: alleen lessen die doorgingen en voor `nu` begonnen. */
export function lesDagen(lessen: readonly LesTelling[], nu: Date): LesDag[] {
  const per = new Map<string, LesDag>()
  for (const l of lessen) {
    if (l.geannuleerd || l.start.getTime() >= nu.getTime()) continue
    const dag = dagSleutel(l.start)
    const k = `${l.vestiging}|${dag}`
    const d = per.get(k) ?? { vestiging: l.vestiging, dag, lessen: 0, capaciteit: 0, bezet: 0, aanwezig: 0, noShow: 0 }
    per.set(k, {
      ...d,
      lessen: d.lessen + 1,
      capaciteit: d.capaciteit + l.capaciteit,
      bezet: d.bezet + Math.min(l.bezet, l.capaciteit),
      aanwezig: d.aanwezig + l.aanwezig,
      noShow: d.noShow + l.noShow,
    })
  }
  return [...per.values()]
}

export interface LesSom {
  lessen: number
  capaciteit: number
  bezet: number
  aanwezig: number
  noShow: number
  /** bezet / capaciteit; null zonder lessen. */
  bezetting: number | null
  /** no-show / (aanwezig + no-show); null zonder afgeronde reserveringen. */
  noShowAandeel: number | null
}

/** Alle lesdagen in een venster opgeteld. `vestigingen` null = alle. */
export function lesSomIn(dagen: readonly LesDag[], v: Venster, vestigingen: ReadonlySet<Vestiging> | null): LesSom {
  let lessen = 0
  let capaciteit = 0
  let bezet = 0
  let aanwezig = 0
  let noShow = 0
  for (const d of dagen) {
    if (!inVenster(d.dag, v) || (vestigingen !== null && !vestigingen.has(d.vestiging))) continue
    lessen += d.lessen
    capaciteit += d.capaciteit
    bezet += d.bezet
    aanwezig += d.aanwezig
    noShow += d.noShow
  }
  return {
    lessen,
    capaciteit,
    bezet,
    aanwezig,
    noShow,
    bezetting: lessen > 0 ? aandeel(bezet, capaciteit) : null,
    noShowAandeel: aandeel(noShow, aanwezig + noShow),
  }
}
