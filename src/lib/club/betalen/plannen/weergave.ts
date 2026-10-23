// ─── Club, betalen: plannen klaarzetten voor de pagina (PUUR) ───────────────
// Per lidmaatschapsvorm de plannen met hun aantal contracten, de prijs die nu
// voor nieuwe leden geldt, de laatst geplande prijs en de wijzigingen die nog
// moeten ingaan. Alleen gewone data: dit gaat van de server naar de client.

import type { Datum } from '../contract/datum'
import type { Plan, PlanPrijs } from './model'
import { komendeVersies, laatstePrijs, prijsOp, type Prijs } from './prijsversie'

export interface PlanWeergave extends Plan {
  contracten: number
  /** De prijs voor een nieuw contract dat vandaag begint. */
  nu: Prijs
  /** De laatst geplande prijs (het startpunt in het formulier). */
  laatste: Prijs
  komend: PlanPrijs[]
}

export function planWeergaven(
  plannen: readonly Plan[],
  versies: readonly PlanPrijs[],
  contracten: ReadonlyMap<string, number>,
  vandaag: Datum,
): Record<string, PlanWeergave[]> {
  const uit: Record<string, PlanWeergave[]> = {}
  for (const p of plannen) {
    const eigen = versies.filter((v) => v.planId === p.id)
    const w: PlanWeergave = { ...p, contracten: contracten.get(p.id) ?? 0, nu: prijsOp(p, eigen, vandaag), laatste: laatstePrijs(p, eigen), komend: komendeVersies(eigen, vandaag) }
    uit[p.vormId] = [...(uit[p.vormId] ?? []), w]
  }
  return uit
}
