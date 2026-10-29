// ─── Club, voedingsdagboek: rekenen (PUUR) ──────────────────────────────────
// Geporteerd uit MentaForce (components/voeding/berekeningen.ts): de dagtotaal
// en het schalen van per-100-gram naar een portie, op een plek zodat elk
// invoerpad (zoeken, barcode, eigen product, foto) hetzelfde rekent. Plus het
// weekoverzicht en welk doel geldt (plan van de coach of eigen doel).

import type { Doelen } from '../model'
import type { DagboekRegel, Macros, Maaltijd, Per100 } from './model'
import { MAALTIJDEN } from './model'

export interface GeschaaldeMacros extends Macros {
  vezelsG: number | null
}

const NUL: Macros = { kcal: 0, eiwitG: 0, koolhydratenG: 0, vetG: 0 }

const eenDecimaal = (n: number): number => Math.round(n * 10) / 10

/** De som van een rij regels. kcal heel, macro's op een decimaal. */
export function telOp(regels: readonly Macros[]): Macros {
  const s = regels.reduce<Macros>(
    (acc, r) => ({ kcal: acc.kcal + r.kcal, eiwitG: acc.eiwitG + r.eiwitG, koolhydratenG: acc.koolhydratenG + r.koolhydratenG, vetG: acc.vetG + r.vetG }),
    NUL,
  )
  return { kcal: Math.round(s.kcal), eiwitG: eenDecimaal(s.eiwitG), koolhydratenG: eenDecimaal(s.koolhydratenG), vetG: eenDecimaal(s.vetG) }
}

/**
 * Schaalt waarden per 100 gram naar een portie in gram. Kcal heel, macro's op
 * een decimaal, zoals MentaForce. Een ongeldige portie telt als 0 gram.
 */
export function schaalNaarPortie(per100: Per100, gram: number): GeschaaldeMacros {
  const factor = Number.isFinite(gram) && gram > 0 ? gram / 100 : 0
  return {
    kcal: Math.round(per100.kcal * factor),
    eiwitG: eenDecimaal(per100.eiwitG * factor),
    koolhydratenG: eenDecimaal(per100.koolhydratenG * factor),
    vetG: eenDecimaal(per100.vetG * factor),
    vezelsG: per100.vezelsG === null ? null : eenDecimaal(per100.vezelsG * factor),
  }
}

/** Andersom: macro's van een portie naar per 100 gram (voor foto en schatten, zodat gram aanpassen meeschaalt). */
export function naarPer100(m: Macros, gram: number): Per100 {
  const f = Number.isFinite(gram) && gram > 0 ? 100 / gram : 1
  return { kcal: m.kcal * f, eiwitG: m.eiwitG * f, koolhydratenG: m.koolhydratenG * f, vetG: m.vetG * f, vezelsG: null }
}

/** De regels per maaltijd, in vaste volgorde, met het totaal per maaltijd. */
export function perMaaltijd(regels: readonly DagboekRegel[]): { maaltijd: Maaltijd; regels: DagboekRegel[]; totaal: Macros }[] {
  return MAALTIJDEN.map((maaltijd) => {
    const eigen = regels.filter((r) => r.maaltijd === maaltijd)
    return { maaltijd, regels: eigen, totaal: telOp(eigen) }
  })
}

/** Het doel dat geldt: het voedingsplan van de coach wint, anders het eigen doel van het lid. */
export type DoelBron = 'coach' | 'eigen' | 'geen'

export function geldendDoel(plan: Doelen | null, eigen: Macros | null): { doel: Macros | null; bron: DoelBron } {
  if (plan) return { doel: { kcal: plan.kcal, eiwitG: plan.eiwitG, koolhydratenG: plan.koolhydratenG, vetG: plan.vetG }, bron: 'coach' }
  if (eigen) return { doel: eigen, bron: 'eigen' }
  return { doel: null, bron: 'geen' }
}

/** Deel van het doel tussen 0 en 1 voor een ring; boven het doel blijft 1 (over = apart getoond). */
export function deelVanDoel(waarde: number, doel: number): number {
  if (!Number.isFinite(waarde) || !Number.isFinite(doel) || doel <= 0) return 0
  return Math.min(1, Math.max(0, waarde / doel))
}

/** Resterend (positief) of over het doel (negatief). */
export function resterend(waarde: number, doel: number): number {
  return Math.round(doel - waarde)
}

const DAG_MS = 86_400_000

/** Een dagsleutel plus n dagen (JJJJ-MM-DD, rekent in UTC zodat zomertijd niet meetelt). */
export function plusDag(dag: string, n: number): string {
  return new Date(Date.parse(`${dag}T00:00:00Z`) + n * DAG_MS).toISOString().slice(0, 10)
}

export interface WeekDag {
  datum: string
  totaal: Macros
  /** Is er die dag iets gelogd? Een lege dag telt niet mee in het gemiddelde. */
  gelogd: boolean
}

/** De zeven dagen tot en met `tot`, oudste eerst, met per dag het totaal. */
export function weekOverzicht(regels: readonly DagboekRegel[], tot: string): WeekDag[] {
  return Array.from({ length: 7 }, (_, i) => {
    const datum = plusDag(tot, i - 6)
    const eigen = regels.filter((r) => r.datum === datum)
    return { datum, totaal: telOp(eigen), gelogd: eigen.length > 0 }
  })
}

/** Gemiddelde per gelogde dag over de week; null als er niets is gelogd. */
export function weekGemiddelde(week: readonly WeekDag[]): (Macros & { dagen: number }) | null {
  const gelogd = week.filter((d) => d.gelogd)
  if (gelogd.length === 0) return null
  const som = telOp(gelogd.map((d) => d.totaal))
  const n = gelogd.length
  return { kcal: Math.round(som.kcal / n), eiwitG: eenDecimaal(som.eiwitG / n), koolhydratenG: eenDecimaal(som.koolhydratenG / n), vetG: eenDecimaal(som.vetG / n), dagen: n }
}

/** De standaardmaaltijd voor dit uur (Nederlandse tijd), zodat loggen een tik minder kost. */
export function maaltijdVoorUur(uur: number): Maaltijd {
  if (uur >= 4 && uur < 11) return 'ontbijt'
  if (uur >= 11 && uur < 15) return 'lunch'
  if (uur >= 17 && uur < 21) return 'diner'
  return 'tussendoor'
}

/**
 * Recente producten uit de regels: uniek op productsleutel, nieuwste eerst, met
 * de laatst gelogde portie als standaard. Handmatige regels (zonder sleutel) niet.
 */
export function recenteProducten(regels: readonly DagboekRegel[], max = 12): { sleutel: string; naam: string; merk: string | null; per100: Per100; gram: number | null }[] {
  const gezien = new Set<string>()
  const uit: { sleutel: string; naam: string; merk: string | null; per100: Per100; gram: number | null }[] = []
  const nieuwsteEerst = [...regels].sort((a, b) => (a.aangemaaktOp < b.aangemaaktOp ? 1 : a.aangemaaktOp > b.aangemaaktOp ? -1 : 0))
  for (const r of nieuwsteEerst) {
    if (!r.productSleutel || !r.per100 || gezien.has(r.productSleutel)) continue
    gezien.add(r.productSleutel)
    uit.push({ sleutel: r.productSleutel, naam: r.naam, merk: r.merk, per100: r.per100, gram: r.gram })
    if (uit.length >= max) break
  }
  return uit
}
