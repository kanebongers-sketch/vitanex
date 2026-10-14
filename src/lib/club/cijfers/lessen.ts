// ─── Fit Factory Club: lescijfers (PUUR) ────────────────────────────────────
// Per les tellen we de reserveringen op status. Daaruit volgen bezetting,
// no-show en wachtlijstdruk, per lestype en per tijdslot.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { tijdNl } from './tijd'

export const RESERVERING_STATUSSEN = ['geboekt', 'wachtlijst', 'geannuleerd', 'aanwezig', 'no_show'] as const
export type ReserveringStatus = (typeof RESERVERING_STATUSSEN)[number]

export function isReserveringStatus(v: unknown): v is ReserveringStatus {
  return typeof v === 'string' && (RESERVERING_STATUSSEN as readonly string[]).includes(v)
}

export interface LesTelling {
  id: string
  vestiging: Vestiging
  lestype: string
  start: Date
  capaciteit: number
  geannuleerd: boolean
  /** Niet geannuleerde plekken: geboekt, aanwezig of no-show. */
  bezet: number
  aanwezig: number
  noShow: number
  wachtlijst: number
}

export interface LesBasis {
  id: string
  vestiging: Vestiging
  lestype: string
  start: Date
  capaciteit: number
  geannuleerd: boolean
}

/** Lessen plus losse reserveringen naar een telling per les. */
export function telPerLes(lessen: readonly LesBasis[], reserveringen: readonly { lesId: string; status: ReserveringStatus }[]): LesTelling[] {
  const tellers = new Map<string, LesTelling>(lessen.map((l) => [l.id, { ...l, bezet: 0, aanwezig: 0, noShow: 0, wachtlijst: 0 }]))
  for (const r of reserveringen) {
    const t = tellers.get(r.lesId)
    if (!t) continue
    tellers.set(r.lesId, {
      ...t,
      bezet: t.bezet + (r.status === 'geboekt' || r.status === 'aanwezig' || r.status === 'no_show' ? 1 : 0),
      aanwezig: t.aanwezig + (r.status === 'aanwezig' ? 1 : 0),
      noShow: t.noShow + (r.status === 'no_show' ? 1 : 0),
      wachtlijst: t.wachtlijst + (r.status === 'wachtlijst' ? 1 : 0),
    })
  }
  return [...tellers.values()]
}

/** Lessen die doorgingen en al begonnen zijn voor `nu`. */
export function geweestVoor(lessen: readonly LesTelling[], nu: Date): LesTelling[] {
  return lessen.filter((l) => !l.geannuleerd && l.start.getTime() < nu.getTime())
}

export interface BezettingGroep {
  label: string
  lessen: number
  bezet: number
  capaciteit: number
  /** 0..1 */
  bezetting: number
}

function groepeer(lessen: readonly LesTelling[], sleutel: (l: LesTelling) => string): BezettingGroep[] {
  const groepen = new Map<string, { lessen: number; bezet: number; capaciteit: number }>()
  for (const l of lessen) {
    const k = sleutel(l)
    const g = groepen.get(k) ?? { lessen: 0, bezet: 0, capaciteit: 0 }
    groepen.set(k, { lessen: g.lessen + 1, bezet: g.bezet + Math.min(l.bezet, l.capaciteit), capaciteit: g.capaciteit + l.capaciteit })
  }
  return [...groepen.entries()].map(([label, g]) => ({ label, ...g, bezetting: g.capaciteit > 0 ? g.bezet / g.capaciteit : 0 }))
}

/** Bezetting per lestype, hoogste eerst. */
export function bezettingPerLestype(lessen: readonly LesTelling[]): BezettingGroep[] {
  return groepeer(lessen, (l) => l.lestype).sort((a, b) => b.bezetting - a.bezetting || a.label.localeCompare(b.label))
}

/** Bezetting per begintijd ("07:00"), op tijd gesorteerd. */
export function bezettingPerTijdslot(lessen: readonly LesTelling[]): BezettingGroep[] {
  return groepeer(lessen, (l) => tijdNl(l.start)).sort((a, b) => a.label.localeCompare(b.label))
}

export interface Totalen {
  lessen: number
  bezetting: number
  aanwezig: number
  noShow: number
  /** no-show / (aanwezig + no-show), 0..1; null als er niets af te lezen valt. */
  noShowAandeel: number | null
}

export function lesTotalen(lessen: readonly LesTelling[]): Totalen {
  const bezet = lessen.reduce((s, l) => s + Math.min(l.bezet, l.capaciteit), 0)
  const capaciteit = lessen.reduce((s, l) => s + l.capaciteit, 0)
  const aanwezig = lessen.reduce((s, l) => s + l.aanwezig, 0)
  const noShow = lessen.reduce((s, l) => s + l.noShow, 0)
  return {
    lessen: lessen.length,
    bezetting: capaciteit > 0 ? bezet / capaciteit : 0,
    aanwezig,
    noShow,
    noShowAandeel: aanwezig + noShow > 0 ? noShow / (aanwezig + noShow) : null,
  }
}

export interface Wachtlijstdruk {
  lessen: number
  vol: number
  metWachtlijst: number
  wachtenden: number
  /** Lestypen met de meeste wachtenden, hoogste eerst. */
  perLestype: { label: string; wachtenden: number; lessen: number }[]
}

/** Druk op de wachtlijst voor lessen die nog komen (niet geannuleerd). */
export function wachtlijstdruk(komend: readonly LesTelling[]): Wachtlijstdruk {
  const lessen = komend.filter((l) => !l.geannuleerd)
  const per = new Map<string, { wachtenden: number; lessen: number }>()
  for (const l of lessen) {
    if (l.wachtlijst === 0) continue
    const g = per.get(l.lestype) ?? { wachtenden: 0, lessen: 0 }
    per.set(l.lestype, { wachtenden: g.wachtenden + l.wachtlijst, lessen: g.lessen + 1 })
  }
  return {
    lessen: lessen.length,
    vol: lessen.filter((l) => l.bezet >= l.capaciteit).length,
    metWachtlijst: lessen.filter((l) => l.wachtlijst > 0).length,
    wachtenden: lessen.reduce((s, l) => s + l.wachtlijst, 0),
    perLestype: [...per.entries()].map(([label, g]) => ({ label, ...g })).sort((a, b) => b.wachtenden - a.wachtenden),
  }
}
