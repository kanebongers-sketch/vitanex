// ─── Club, betalen: wisselen van plan binnen een periode (PUUR) ─────────────
// Het lid wisselt op `wisselDatum` binnen de lopende periode. Het oude plan is
// voor die periode al gefactureerd. Uitkomst:
// - credit: het deel van het oude bedrag voor de dagen vanaf de wissel
//   (creditnota), nooit meer dan wat er nog te crediteren is;
// - debet: het deel van het nieuwe bedrag voor diezelfde dagen (nieuwe factuur).
// Beide met de grootste-restmethode per dag, op de cent exact: gebruikt deel
// plus credit is precies het oude bedrag.
//
// `nieuwBedragVoorPeriode` is wat het nieuwe plan voor deze zelfde periode zou
// kosten. Heeft het nieuwe plan hetzelfde interval, dan is dat gewoon de prijs;
// anders rekent de aanroeper het om. Vanaf de volgende periode factureert het
// nieuwe plan gewoon. Een nieuwe looptijd mag alleen met akkoord van het lid.

import { cent, kleinste, min, NUL, plus, type Cent } from '../geld/cent'
import { splitsOpDatum, type Periode } from './periodes'
import type { Datum } from './datum'

export interface PlanwisselInvoer {
  periode: Periode
  wisselDatum: Datum
  /** Wat er voor deze periode op het oude plan is gefactureerd (inclusief btw, 0 of meer). */
  oudGefactureerd: Cent
  /** Wat er voor deze periode al eerder is gecrediteerd (0 of meer). */
  alGecrediteerd: Cent
  /** Wat het nieuwe plan voor deze periode zou kosten (inclusief btw, 0 of meer). */
  nieuwBedragVoorPeriode: Cent
}

export interface PlanwisselUitkomst {
  /** Te crediteren op het oude plan (0 of meer). */
  credit: Cent
  /** Te factureren op het nieuwe plan (0 of meer). */
  debet: Cent
  /** Wat het lid netto nog betaalt (negatief = het lid krijgt terug). */
  verschil: Cent
  /** Het deel van het oude bedrag dat gebruikt is (voor de wissel). */
  oudGebruikt: Cent
}

export function planwissel(invoer: PlanwisselInvoer): PlanwisselUitkomst {
  if (invoer.oudGefactureerd < 0 || invoer.alGecrediteerd < 0 || invoer.nieuwBedragVoorPeriode < 0) {
    throw new RangeError('Bedragen bij een planwissel kunnen niet negatief zijn')
  }
  if (invoer.alGecrediteerd > invoer.oudGefactureerd) throw new RangeError('Er is al meer gecrediteerd dan gefactureerd')
  const [oudGebruikt, oudRest] = splitsOpDatum(invoer.oudGefactureerd, invoer.periode, invoer.wisselDatum)
  const [, nieuwRest] = splitsOpDatum(invoer.nieuwBedragVoorPeriode, invoer.periode, invoer.wisselDatum)
  const nogTeCrediteren = min(invoer.oudGefactureerd, invoer.alGecrediteerd)
  const credit = kleinste(oudRest, nogTeCrediteren)
  return { credit, debet: nieuwRest, verschil: min(nieuwRest, credit), oudGebruikt }
}

/** Mag een creditnota van `bedrag` nog op een factuur van `gefactureerd` met `alGecrediteerd`? */
export function magCrediteren(gefactureerd: Cent, alGecrediteerd: Cent, bedrag: Cent): boolean {
  return bedrag > NUL && plus(alGecrediteerd, bedrag) <= gefactureerd
}

/** Het hoogste bedrag dat nog gecrediteerd kan worden. */
export function maxCredit(gefactureerd: Cent, alGecrediteerd: Cent): Cent {
  const rest = min(gefactureerd, alGecrediteerd)
  return rest < 0 ? cent(0) : rest
}
