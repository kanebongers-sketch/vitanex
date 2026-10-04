// ─── LifeOS — een DEGIRO-regel aan de juiste notering koppelen ──────────────
// Eén ISIN heeft vaak meerdere noteringen (Amsterdam in USD, Xetra in EUR, …).
// We kiezen de notering die DEGIRO ook toont: dezelfde valuta én een koers die
// binnen een paar procent van jouw slotkoers ligt. Vinden we die niet, dan
// gokken we niet — dan kies je de notering zelf (zoekveld op de kaart).

import { haalKoers, zoekNotering, type Koers } from './yahoo'
import type { CsvPositie } from './csv'

/** Hoe ver de koers van DEGIRO's slotkoers mag liggen (andere beurs, ander moment). */
const MARGE = 0.08

/** De beste kandidaat: zelfde valuta, dichtst bij de slotkoers, binnen de marge. Puur. */
export function kiesBeste(kandidaten: readonly Koers[], valuta: string, slotkoers: number): Koers | null {
  let beste: Koers | null = null
  let besteAfwijking = Number.POSITIVE_INFINITY
  for (const k of kandidaten) {
    if (k.valuta.toUpperCase() !== valuta.toUpperCase()) continue
    const afwijking = Math.abs(k.koers - slotkoers) / slotkoers
    if (afwijking <= MARGE && afwijking < besteAfwijking) {
      beste = k
      besteAfwijking = afwijking
    }
  }
  return beste
}

/** Zoek de notering voor een CSV-regel: ISIN, dan de naam, dan Stuttgart op ISIN. */
export async function koppelNotering(p: CsvPositie): Promise<Koers | null> {
  const symbolen = new Set<string>()
  for (const q of [p.isin, p.naam]) {
    for (const r of await zoekNotering(q)) symbolen.add(r.symbool)
  }
  symbolen.add(`${p.isin}.SG`)
  const koersen = (await Promise.all([...symbolen].slice(0, 12).map((s) => haalKoers(s)))).filter((k): k is Koers => k !== null)
  return kiesBeste(koersen, p.valuta, p.slotkoers)
}
