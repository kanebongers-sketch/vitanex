// ─── Club, betalen: prijs wijzigen en prijsversies (PUUR) ───────────────────
// Regel (bouwplan 2.1 en flow 2): zolang een plan geen contracten heeft, gaat
// een nieuwe prijs direct op het plan. Heeft het plan contracten, dan blijft
// de plan-rij staan en komt er een prijsversie bij met een ingangsdatum in de
// toekomst. Nieuwe contracten krijgen vanaf die dag de nieuwe prijs; bestaande
// leden houden hun bevroren prijs tot een aangekondigde wijziging.

import { isDatum, plusDagen, type Datum } from '../contract/datum'
import type { BtwProcent } from '../geld/btw-tarieven'
import { GRENS, type PlanPrijs } from './model'

export interface Prijs {
  bedragCent: number
  btwProcent: BtwProcent
}

export type PrijsBesluit =
  | { soort: 'gelijk' }
  | { soort: 'direct' }
  | { soort: 'versie'; geldigVanaf: Datum }
  | { soort: 'fout'; fout: string }

/** Versies op datum, oudste eerst. */
function opDatum(versies: readonly PlanPrijs[]): PlanPrijs[] {
  return [...versies].sort((a, b) => (a.geldigVanaf < b.geldigVanaf ? -1 : a.geldigVanaf > b.geldigVanaf ? 1 : 0))
}

/** De prijs voor een nieuw contract dat op `op` begint: de laatste versie die dan geldt, anders de plan-rij. */
export function prijsOp(plan: Prijs, versies: readonly PlanPrijs[], op: Datum): Prijs {
  const geldend = opDatum(versies).filter((v) => v.geldigVanaf <= op).at(-1)
  return geldend ? { bedragCent: geldend.bedragCent, btwProcent: geldend.btwProcent } : { bedragCent: plan.bedragCent, btwProcent: plan.btwProcent }
}

/** De laatst geplande prijs (ook als die nog moet ingaan): daarmee vergelijkt een wijziging. */
export function laatstePrijs(plan: Prijs, versies: readonly PlanPrijs[]): Prijs {
  const laatste = opDatum(versies).at(-1)
  return laatste ? { bedragCent: laatste.bedragCent, btwProcent: laatste.btwProcent } : { bedragCent: plan.bedragCent, btwProcent: plan.btwProcent }
}

/** Versies die nog moeten ingaan (na vandaag). */
export function komendeVersies(versies: readonly PlanPrijs[], vandaag: Datum): PlanPrijs[] {
  return opDatum(versies).filter((v) => v.geldigVanaf > vandaag)
}

export interface PrijsVraag {
  /** De plan-rij en de versies zoals ze nu in de database staan. */
  plan: Prijs
  versies: readonly PlanPrijs[]
  nieuw: Prijs
  heeftContracten: boolean
  /** De gekozen ingangsdatum (alleen nodig bij contracten). */
  vanaf: unknown
  vandaag: Datum
}

/** Wat er moet gebeuren bij het opslaan van een plan met deze prijs. */
export function besluitPrijs(v: PrijsVraag): PrijsBesluit {
  const huidig = laatstePrijs(v.plan, v.versies)
  if (huidig.bedragCent === v.nieuw.bedragCent && huidig.btwProcent === v.nieuw.btwProcent) return { soort: 'gelijk' }
  if (!v.heeftContracten) return { soort: 'direct' }
  if (!isDatum(v.vanaf)) return { soort: 'fout', fout: 'Dit plan heeft al leden. Kies vanaf welke dag de nieuwe prijs geldt.' }
  if (v.vanaf <= v.vandaag) return { soort: 'fout', fout: 'De nieuwe prijs kan op zijn vroegst morgen ingaan.' }
  if (v.vanaf > plusDagen(v.vandaag, GRENS.prijsVooruitDagen)) return { soort: 'fout', fout: 'Plan een prijswijziging hooguit een jaar vooruit.' }
  return { soort: 'versie', geldigVanaf: v.vanaf }
}
