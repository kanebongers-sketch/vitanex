// ─── Voeding — pure berekeningen ────────────────────────────────────────────
// De rekenkern van de voedingsapp, los van de UI en dus testbaar zonder DOM.
// Geëxtraheerd uit de voeding-pagina, waar de portie-schaling twee keer
// gedupliceerd stond (DRY) en de dagtotaal inline werd uitgerekend.

import { ML_PER_GLAS } from './constants'
import type { DagTotaal, NutrientenPer100g, VoedingLog } from './types'

/** De som van een dag: alle macro's opgeteld. Ontbrekende waarden tellen als 0. */
export function berekenDagTotaal(logs: readonly VoedingLog[]): DagTotaal {
  return logs.reduce<DagTotaal>(
    (acc, l) => ({
      calorieen: acc.calorieen + (l.calorieen ?? 0),
      eiwitten_g: acc.eiwitten_g + (l.eiwitten_g ?? 0),
      koolhydraten_g: acc.koolhydraten_g + (l.koolhydraten_g ?? 0),
      vetten_g: acc.vetten_g + (l.vetten_g ?? 0),
      vezels_g: acc.vezels_g + (l.vezels_g ?? 0),
    }),
    { calorieen: 0, eiwitten_g: 0, koolhydraten_g: 0, vetten_g: 0, vezels_g: 0 },
  )
}

/** De macro's van een product per 100 g, zoals ze in het antwoord binnenkomen. */
type Per100g = Pick<NutrientenPer100g, 'calorieen' | 'eiwitten_g' | 'koolhydraten_g' | 'vetten_g' | 'vezels_g'>

export interface GeschaaldeMacros {
  calorieen: number
  eiwitten_g: number
  koolhydraten_g: number
  vetten_g: number
  vezels_g: number
}

/**
 * Schaalt voedingswaarden-per-100 g naar een portie in grammen.
 * Kcal wordt afgerond op heel, macro's op één decimaal — precies zoals de
 * pagina het deed, nu op één plek zodat beide invoerpaden identiek rekenen.
 */
export function schaalNaarPortie(per100g: Per100g, gram: number): GeschaaldeMacros {
  const factor = gram / 100
  const macro = (v: number | null | undefined): number => Number(((v ?? 0) * factor).toFixed(1))
  return {
    calorieen: Math.round((per100g.calorieen ?? 0) * factor),
    eiwitten_g: macro(per100g.eiwitten_g),
    koolhydraten_g: macro(per100g.koolhydraten_g),
    vetten_g: macro(per100g.vetten_g),
    vezels_g: macro(per100g.vezels_g),
  }
}

/** Het waterdoel in glazen (minimaal 4), afgeleid van het doel in milliliter. */
export function waterDoelInGlazen(doelMl: number): number {
  return Math.max(4, Math.round(doelMl / ML_PER_GLAS))
}
