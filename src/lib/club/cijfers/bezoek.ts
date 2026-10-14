// ─── Fit Factory Club: bezoekcijfers (PUUR) ─────────────────────────────────
// Een bezoek is een check-in (balie, QR, bandje of les). De database telt ze
// het liefst zelf per week en per weekdag en uur (functie club_cijfers_bezoek,
// migratie 386); zonder die functie tellen we hier dezelfde vorm uit losse rijen.

import type { Vestiging } from '@/lib/club/kern/vestiging'
import { maandagVan, nlMoment } from './tijd'

export type BezoekSoort = 'week' | 'uur'

/** Een getelde groep: per week (sleutel = maandag) of per weekdag en uur (sleutel = "3-19"). */
export interface BezoekTelling {
  vestiging: Vestiging
  soort: BezoekSoort
  sleutel: string
  aantal: number
}

export interface Checkin {
  vestiging: Vestiging
  op: Date
}

/** Losse check-ins naar dezelfde tellingen als de databasefunctie geeft. */
export function telBezoek(checkins: readonly Checkin[]): BezoekTelling[] {
  const tellers = new Map<string, BezoekTelling>()
  const tel = (vestiging: Vestiging, soort: BezoekSoort, sleutel: string): void => {
    const k = `${vestiging}|${soort}|${sleutel}`
    const huidig = tellers.get(k)
    tellers.set(k, { vestiging, soort, sleutel, aantal: (huidig?.aantal ?? 0) + 1 })
  }
  for (const c of checkins) {
    const m = nlMoment(c.op)
    tel(c.vestiging, 'week', maandagVan(m.dag))
    tel(c.vestiging, 'uur', `${m.weekdag}-${m.uur}`)
  }
  return [...tellers.values()]
}

function binnen(t: BezoekTelling, vestigingen: ReadonlySet<Vestiging> | null): boolean {
  return vestigingen === null || vestigingen.has(t.vestiging)
}

/** Bezoeken per week voor de gegeven maandagen. `vestigingen` null = alle. */
export function bezoekPerWeek(
  tellingen: readonly BezoekTelling[],
  maandagen: readonly string[],
  vestigingen: ReadonlySet<Vestiging> | null,
): number[] {
  const perWeek = new Map<string, number>()
  for (const t of tellingen) {
    if (t.soort !== 'week' || !binnen(t, vestigingen)) continue
    perWeek.set(t.sleutel, (perWeek.get(t.sleutel) ?? 0) + t.aantal)
  }
  return maandagen.map((ma) => perWeek.get(ma) ?? 0)
}

/** Drukte: [weekdag 0..6][uur 0..23], opgeteld over de periode. */
export function drukteRaster(tellingen: readonly BezoekTelling[], vestigingen: ReadonlySet<Vestiging> | null): number[][] {
  const raster = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  for (const t of tellingen) {
    if (t.soort !== 'uur' || !binnen(t, vestigingen)) continue
    const [d, u] = t.sleutel.split('-').map(Number)
    if (d >= 1 && d <= 7 && u >= 0 && u <= 23) raster[d - 1][u] += t.aantal
  }
  return raster
}

/** De uren waarin ooit iemand binnenkwam, met minstens 06:00 tot 22:00 zichtbaar. */
export function zichtbareUren(raster: readonly number[][]): number[] {
  let van = 6
  let tot = 22
  raster.forEach((rij) =>
    rij.forEach((n, uur) => {
      if (n > 0) {
        van = Math.min(van, uur)
        tot = Math.max(tot, uur)
      }
    }),
  )
  return Array.from({ length: tot - van + 1 }, (_, i) => van + i)
}

/** Het drukste uur: weekdag (1..7), uur en aantal; null als er geen bezoek is. */
export function piekUur(raster: readonly number[][]): { weekdag: number; uur: number; aantal: number } | null {
  let piek: { weekdag: number; uur: number; aantal: number } | null = null
  raster.forEach((rij, d) =>
    rij.forEach((n, uur) => {
      if (n > 0 && (!piek || n > piek.aantal)) piek = { weekdag: d + 1, uur, aantal: n }
    }),
  )
  return piek
}

export function som(reeks: readonly number[]): number {
  return reeks.reduce((a, b) => a + b, 0)
}
