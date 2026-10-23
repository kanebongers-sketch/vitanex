// ─── Club, betalen: btw uit een bedrag inclusief (PUUR) ─────────────────────
// Prijzen voor leden zijn altijd inclusief btw. Per factuurregel rekenen we de
// btw terug: btw = bedrag x p / (100 + p), afgerond half van nul af (zie
// AFRONDING in cent.ts), en de grondslag is het bedrag min die btw. Zo is
// grondslag plus btw altijd precies het bedrag van de regel.
//
// Keuze: btw per regel, en de uitsplitsing per tarief is de som van de regels.
// Dan klopt elke regel op de factuur afzonderlijk en telt de uitsplitsing
// exact op tot het totaal. Tarieven komen uit btw-tarieven.ts.

import { cent, maalBreuk, min, NUL, plus, type Cent } from './cent'
import { isBekendBtwProcent, type BtwProcent } from './btw-tarieven'

export interface BtwUitsplitsing {
  procent: BtwProcent
  /** Bedrag exclusief btw. */
  grondslag: Cent
  btw: Cent
  /** Bedrag inclusief btw (grondslag plus btw). */
  totaal: Cent
}

function eisTarief(procent: number): asserts procent is BtwProcent {
  if (!isBekendBtwProcent(procent)) throw new RangeError(`Onbekend btw-tarief: ${String(procent)}`)
}

/** Btw en grondslag uit een bedrag inclusief btw. Werkt ook voor negatieve bedragen (creditnota, korting). */
export function btwUitInclusief(inclusief: Cent, procent: BtwProcent): BtwUitsplitsing {
  eisTarief(procent)
  const btw = procent === 0 ? NUL : maalBreuk(inclusief, procent, 100 + procent)
  return { procent, grondslag: min(inclusief, btw), btw, totaal: inclusief }
}

export interface RegelMetTarief {
  bedrag: Cent
  procent: BtwProcent
}

/**
 * Uitsplitsing per tarief over alle regels, oplopend op percentage. Per tarief
 * is het de som van de regels (zie keuze bovenaan). Tarieven zonder regels
 * komen niet in de uitkomst.
 */
export function btwPerTarief(regels: readonly RegelMetTarief[]): BtwUitsplitsing[] {
  const perTarief = new Map<BtwProcent, BtwUitsplitsing>()
  for (const r of regels) {
    const deel = btwUitInclusief(r.bedrag, r.procent)
    const oud = perTarief.get(r.procent)
    perTarief.set(
      r.procent,
      oud
        ? { procent: r.procent, grondslag: plus(oud.grondslag, deel.grondslag), btw: plus(oud.btw, deel.btw), totaal: plus(oud.totaal, deel.totaal) }
        : deel,
    )
  }
  return [...perTarief.values()].sort((a, b) => a.procent - b.procent)
}

export interface BtwTotalen {
  grondslag: Cent
  btw: Cent
  totaal: Cent
}

/** Totalen over een uitsplitsing per tarief. */
export function btwTotalen(uitsplitsing: readonly BtwUitsplitsing[]): BtwTotalen {
  return uitsplitsing.reduce<BtwTotalen>(
    (t, u) => ({ grondslag: plus(t.grondslag, u.grondslag), btw: plus(t.btw, u.btw), totaal: plus(t.totaal, u.totaal) }),
    { grondslag: cent(0), btw: cent(0), totaal: cent(0) },
  )
}
