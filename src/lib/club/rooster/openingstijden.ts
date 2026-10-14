// ─── Fit Factory Club: openingstijden per weekdag (PUUR) ────────────────────
// In club_vestigingen.openingstijden: { "1": ["06:00","23:00"], ... } met
// 1 = maandag. Een ontbrekende dag is gesloten.

import { isTijd, normaliseerTijd, tijdNaarMinuten } from './tijd'

export interface Openingstijd {
  van: string
  tot: string
}

/** Index 0 = maandag ... 6 = zondag; null = gesloten. */
export type Week<T> = [T, T, T, T, T, T, T]
export type Openingstijden = Week<Openingstijd | null>

export const WEEKDAG_LABEL: Week<string> = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
export const WEEKDAG_KORT: Week<string> = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

function dagUitJson(v: unknown): Openingstijd | null {
  if (!Array.isArray(v) || v.length !== 2) return null
  const van = normaliseerTijd(v[0])
  const tot = normaliseerTijd(v[1])
  if (!van || !tot || tijdNaarMinuten(tot) <= tijdNaarMinuten(van)) return null
  return { van, tot }
}

/** Systeemgrens: de jsonb naar zeven dagen. */
export function openingstijdenUitJson(ruw: unknown): Openingstijden {
  const bron = typeof ruw === 'object' && ruw !== null && !Array.isArray(ruw) ? (ruw as Record<string, unknown>) : {}
  return naarWeek([1, 2, 3, 4, 5, 6, 7].map((d) => dagUitJson(bron[String(d)])))
}

/** Een lijst van zeven naar een week. */
function naarWeek<T>(lijst: readonly T[]): Week<T> {
  return [lijst[0], lijst[1], lijst[2], lijst[3], lijst[4], lijst[5], lijst[6]]
}

export function openingstijdenNaarJson(o: Openingstijden): Record<string, [string, string]> {
  const uit: Record<string, [string, string]> = {}
  o.forEach((dag, i) => {
    if (dag) uit[String(i + 1)] = [dag.van, dag.tot]
  })
  return uit
}

/** Controleer openingstijden uit een formulier; geeft de fout of null. */
export function controleerOpeningstijden(ruw: unknown): { ok: true; waarde: Openingstijden } | { ok: false; fout: string } {
  if (!Array.isArray(ruw) || ruw.length !== 7) return { ok: false, fout: 'Geef voor elke dag de openingstijden.' }
  const dagen: Array<Openingstijd | null> = []
  for (let i = 0; i < 7; i++) {
    const d: unknown = ruw[i]
    if (d === null) {
      dagen.push(null)
      continue
    }
    const o = typeof d === 'object' && d !== null ? (d as Record<string, unknown>) : null
    if (!o || !isTijd(o.van) || !isTijd(o.tot)) return { ok: false, fout: `${WEEKDAG_LABEL[i]}: vul een open- en sluittijd in.` }
    if (tijdNaarMinuten(o.tot) <= tijdNaarMinuten(o.van)) return { ok: false, fout: `${WEEKDAG_LABEL[i]}: sluiten moet na openen.` }
    dagen.push({ van: o.van.slice(0, 5), tot: o.tot.slice(0, 5) })
  }
  return { ok: true, waarde: naarWeek(dagen) }
}

/** De ruimste openingstijd van de week (voor het raster), of null als alles dicht is. */
export function ruimsteOpening(o: Openingstijden): Openingstijd | null {
  const open = o.filter((d): d is Openingstijd => d !== null)
  if (open.length === 0) return null
  const van = open.reduce((m, d) => (d.van < m ? d.van : m), open[0].van)
  const tot = open.reduce((m, d) => (d.tot > m ? d.tot : m), open[0].tot)
  return { van, tot }
}
