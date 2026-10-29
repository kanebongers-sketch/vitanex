// ─── Club, voedingsdagboek: wat de ledenapp bij het openen krijgt ───────────
// De server leest alles in een keer (haalDagboekApp) en geeft het als een
// serialiseerbaar object aan de clientcomponent. Daarna praat de app met
// /api/club/lid/voeding. Alleen gegevens van het lid zelf.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Doelen } from '../model'
import { plusDag, recenteProducten } from './berekeningen'
import type { AiFuncties } from './ai/schakelaar'
import type { DagboekInstellingen, DagboekRegel, EigenProduct, Favoriet, Macros, Product } from './model'
import { haalEigenProducten, haalFavorieten, haalInstellingen, haalRecenteRegels, haalRegels } from './opslag'

export interface DagboekStart {
  /** De dag die open staat (JJJJ-MM-DD) en vandaag. */
  dag: string
  vandaag: string
  /** De zeven dagen tot en met `dag`. */
  regels: DagboekRegel[]
  instellingen: DagboekInstellingen
  /** Het doel uit het voedingsplan van de coach, als dat er is. */
  planDoel: Macros | null
  recent: Product[]
  favorieten: Favoriet[]
  eigen: EigenProduct[]
  ai: AiFuncties
}

export function planNaarDoel(plan: Doelen | null): Macros | null {
  return plan ? { kcal: plan.kcal, eiwitG: plan.eiwitG, koolhydratenG: plan.koolhydratenG, vetG: plan.vetG } : null
}

/** Alles voor het openen van het dagboek; null bij een leesfout. */
export async function haalDagboekApp(
  admin: SupabaseClient,
  userId: string,
  lidId: string,
  opties: { vandaag: string; plan: Doelen | null; ai: AiFuncties },
): Promise<DagboekStart | null> {
  const { vandaag } = opties
  const [instellingen, regels, recenteRegels, favorieten, eigen] = await Promise.all([
    haalInstellingen(admin, userId, lidId),
    haalRegels(admin, userId, lidId, plusDag(vandaag, -6), vandaag),
    haalRecenteRegels(admin, userId, lidId, vandaag),
    haalFavorieten(admin, userId, lidId),
    haalEigenProducten(admin, userId, lidId),
  ])
  if (!instellingen || !regels || !recenteRegels || !favorieten || !eigen) return null
  const recent: Product[] = recenteProducten(recenteRegels).map((r) => ({ sleutel: r.sleutel, naam: r.naam, merk: r.merk, per100: r.per100, portieGram: r.gram, hoeveelheid: null }))
  return { dag: vandaag, vandaag, regels, instellingen, planDoel: planNaarDoel(opties.plan), recent, favorieten, eigen, ai: opties.ai }
}
