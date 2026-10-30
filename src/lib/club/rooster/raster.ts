// ─── Fit Factory Club, rooster: rekenwerk voor het weekraster (PUUR) ────────
// Bezetting, weekcijfers, het uurbereik van het raster en de banen voor lessen
// die tegelijk lopen. De pagina tekent alleen wat hier berekend is.

import type { ReserveringStatus } from './regels'
import type { LesSoort } from './typen'
import { nlDelen, tijdNaarMinuten } from './tijd'

export interface LesOverzicht {
  id: string
  vestiging: string
  serieId: string | null
  startOp: string
  eindOp: string
  capaciteit: number
  geannuleerd: boolean
  annuleerReden: string | null
  lestype: { id: string; naam: string; soort: LesSoort } | null
  zaal: { id: string; naam: string } | null
  instructeur: { id: string; naam: string; foto?: string | null } | null
  /** Bezette plekken: geboekt, aanwezig of no-show. */
  geboekt: number
  wachtlijst: number
  aanwezig: number
  noShow: number
}

export interface LesTelling {
  geboekt: number
  wachtlijst: number
  aanwezig: number
  noShow: number
}

const LEGE_TELLING: LesTelling = { geboekt: 0, wachtlijst: 0, aanwezig: 0, noShow: 0 }

/** Tel de reserveringen per les. */
export function telPerLes(reserveringen: ReadonlyArray<{ lesId: string; status: ReserveringStatus }>): Map<string, LesTelling> {
  const uit = new Map<string, LesTelling>()
  for (const r of reserveringen) {
    const t = uit.get(r.lesId) ?? LEGE_TELLING
    uit.set(r.lesId, {
      geboekt: t.geboekt + (r.status === 'geboekt' || r.status === 'aanwezig' || r.status === 'no_show' ? 1 : 0),
      wachtlijst: t.wachtlijst + (r.status === 'wachtlijst' ? 1 : 0),
      aanwezig: t.aanwezig + (r.status === 'aanwezig' ? 1 : 0),
      noShow: t.noShow + (r.status === 'no_show' ? 1 : 0),
    })
  }
  return uit
}

export function legeTelling(): LesTelling {
  return { ...LEGE_TELLING }
}

export type BezettingNiveau = 'rustig' | 'goed' | 'bijna' | 'vol'

/** Hoe vol is de les? Vol = koraal in het raster, bijna vol = amber. */
export function bezettingNiveau(geboekt: number, capaciteit: number): BezettingNiveau {
  if (capaciteit <= 0 || geboekt >= capaciteit) return 'vol'
  const deel = geboekt / capaciteit
  if (deel >= 0.85) return 'bijna'
  if (deel >= 0.5) return 'goed'
  return 'rustig'
}

/** Bezetting als fractie 0 tot 1 (voor de breedte van het balkje). */
export function bezettingDeel(geboekt: number, capaciteit: number): number {
  if (capaciteit <= 0) return 1
  return Math.min(1, Math.max(0, geboekt / capaciteit))
}

export interface WeekCijfers {
  lessen: number
  /** Gemiddelde bezetting van de lessen die doorgaan, 0 tot 1; null zonder lessen. */
  gemiddeldeBezetting: number | null
  wachtlijst: number
  noShows: number
  geannuleerd: number
}

export function weekCijfers(lessen: readonly LesOverzicht[]): WeekCijfers {
  const door = lessen.filter((l) => !l.geannuleerd)
  const som = door.reduce((s, l) => s + bezettingDeel(l.geboekt, l.capaciteit), 0)
  return {
    lessen: door.length,
    gemiddeldeBezetting: door.length > 0 ? som / door.length : null,
    wachtlijst: door.reduce((s, l) => s + l.wachtlijst, 0),
    noShows: door.reduce((s, l) => s + l.noShow, 0),
    geannuleerd: lessen.length - door.length,
  }
}

export interface RoosterFilters {
  zaal: string | null
  lestype: string | null
  instructeur: string | null
}

export function filterLessen(lessen: readonly LesOverzicht[], f: RoosterFilters): LesOverzicht[] {
  return lessen.filter(
    (l) =>
      (!f.zaal || l.zaal?.id === f.zaal) &&
      (!f.lestype || l.lestype?.id === f.lestype) &&
      (!f.instructeur || l.instructeur?.id === f.instructeur),
  )
}

/** Een les in Nederlandse tijd op het raster: datum, start- en eindminuut. */
export interface RasterPlek {
  datum: string
  van: number
  tot: number
}

export function rasterPlek(les: Pick<LesOverzicht, 'startOp' | 'eindOp'>): RasterPlek {
  const start = nlDelen(new Date(les.startOp))
  const eind = nlDelen(new Date(les.eindOp))
  const tot = eind.datum === start.datum ? eind.minuten : 24 * 60
  return { datum: start.datum, van: start.minuten, tot: Math.max(tot, start.minuten + 15) }
}

/** Per datum de lessen van die dag, op starttijd. */
export function groepeerPerDag(lessen: readonly LesOverzicht[], dagen: readonly string[]): Record<string, LesOverzicht[]> {
  const uit: Record<string, LesOverzicht[]> = Object.fromEntries(dagen.map((d) => [d, []]))
  for (const les of lessen) {
    const datum = rasterPlek(les).datum
    if (uit[datum]) uit[datum] = [...uit[datum], les]
  }
  for (const d of dagen) uit[d] = [...uit[d]].sort((a, b) => (a.startOp < b.startOp ? -1 : a.startOp > b.startOp ? 1 : 0))
  return uit
}

/** Het uurbereik van het raster: hele uren rond alle lessen, minstens 07:00 tot 21:00 of de openingstijden. */
export function uurBereik(lessen: readonly LesOverzicht[], open?: { van: string; tot: string } | null): { van: number; tot: number } {
  let van = open ? tijdNaarMinuten(open.van) : 7 * 60
  let tot = open ? tijdNaarMinuten(open.tot) : 21 * 60
  for (const les of lessen) {
    const p = rasterPlek(les)
    van = Math.min(van, p.van)
    tot = Math.max(tot, p.tot)
  }
  const vanUur = Math.floor(van / 60) * 60
  const totUur = Math.min(24 * 60, Math.ceil(tot / 60) * 60)
  return { van: vanUur, tot: Math.max(totUur, vanUur + 60) }
}

/**
 * Lessen die tegelijk lopen komen naast elkaar: elke les krijgt een baan en
 * het aantal banen van zijn groep overlappende lessen.
 */
export function verdeelBanen(lessen: ReadonlyArray<{ id: string; van: number; tot: number }>): Map<string, { baan: number; banen: number }> {
  const gesorteerd = [...lessen].sort((a, b) => a.van - b.van || b.tot - a.tot)
  const uit = new Map<string, { baan: number; banen: number }>()
  let groep: Array<{ id: string; baan: number }> = []
  let banenEind: number[] = []
  let groepEind = -1
  const sluitGroep = () => {
    const banen = Math.max(1, banenEind.length)
    for (const g of groep) uit.set(g.id, { baan: g.baan, banen })
    groep = []
    banenEind = []
  }
  for (const les of gesorteerd) {
    if (les.van >= groepEind) sluitGroep()
    let baan = banenEind.findIndex((eind) => eind <= les.van)
    if (baan === -1) baan = banenEind.length
    banenEind = [...banenEind.slice(0, baan), les.tot, ...banenEind.slice(baan + 1)]
    groep = [...groep, { id: les.id, baan }]
    groepEind = Math.max(groepEind, les.tot)
  }
  sluitGroep()
  return uit
}
