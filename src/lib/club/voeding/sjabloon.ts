// ─── Club, voeding: een sjabloon op een lid toepassen (PUUR) ────────────────
// Een sjabloon geeft adviezen, een dagindeling, een doel en eventueel eiwit per
// kilo. Is de rekenhulp voor het lid ingevuld, dan rekent Club de dagdoelen
// opnieuw uit met het doel en de eiwitnorm van het sjabloon. Zo niet, dan
// gelden de vaste dagdoelen van het sjabloon, en waar die leeg zijn blijft
// staan wat er al stond. De trainer ziet het resultaat en slaat zelf op.

import { bereken, controleerInvoer, type RekenInvoer } from './rekenhulp'
import type { Doelen, Maaltijd, VoedingSjabloon } from './model'
import type { VoedingDoel } from './rekenhulp'

export interface PlanConcept extends Doelen {
  doel: VoedingDoel | null
  adviezen: string[]
  maaltijden: Maaltijd[]
  berekening: RekenInvoer | null
  sjabloonId: string | null
}

export interface ToepasUitkomst {
  plan: PlanConcept
  /** Waar de dagdoelen vandaan komen, voor een korte melding. */
  bron: 'berekend' | 'sjabloon' | 'ongewijzigd'
}

export function pasSjabloonToe(s: VoedingSjabloon, huidig: PlanConcept): ToepasUitkomst {
  const basis = {
    ...huidig,
    doel: s.doel ?? huidig.doel,
    adviezen: s.adviezen.length ? [...s.adviezen] : huidig.adviezen,
    maaltijden: s.maaltijden.length ? s.maaltijden.map((m) => ({ ...m })) : huidig.maaltijden,
    sjabloonId: s.id,
  }
  if (huidig.berekening) {
    const invoer: RekenInvoer = {
      ...huidig.berekening,
      doel: s.doel ?? huidig.berekening.doel,
      eiwitPerKg: s.eiwitPerKg ?? huidig.berekening.eiwitPerKg,
    }
    if (controleerInvoer(invoer).length === 0) {
      const u = bereken(invoer)
      return { plan: { ...basis, berekening: invoer, kcal: u.kcal, eiwitG: u.eiwitG, koolhydratenG: u.koolhydratenG, vetG: u.vetG }, bron: 'berekend' }
    }
  }
  const vast = [s.kcal, s.eiwitG, s.koolhydratenG, s.vetG].some((n) => n !== null)
  return {
    plan: {
      ...basis,
      kcal: s.kcal ?? huidig.kcal,
      eiwitG: s.eiwitG ?? huidig.eiwitG,
      koolhydratenG: s.koolhydratenG ?? huidig.koolhydratenG,
      vetG: s.vetG ?? huidig.vetG,
    },
    bron: vast ? 'sjabloon' : 'ongewijzigd',
  }
}
