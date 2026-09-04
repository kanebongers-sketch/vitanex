// ─── LifeOS — PT-coaching: opslag ───────────────────────────────────────────
// SERVER-ONLY. Schrijft en leest de `pt_coaching`-tabel (migratie 170) op het
// LifeOS-project. De service-role-client komt als PARAMETER binnen (van
// `vereisLifeosToegang`) — deze module weet niets van env of project.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvaluatieInvoer, EvaluatieJson } from './pt-coaching'

export type OpslagUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' }

const KOLOMMEN = 'id, score_algemeen, score_energie, score_voortgang, notitie, aandachtspunt, aangemaakt_op'

interface Rij {
  id: string
  score_algemeen: number
  score_energie: number
  score_voortgang: number
  notitie: string | null
  aandachtspunt: string | null
  aangemaakt_op: string
}

function vanRij(r: Rij): EvaluatieJson {
  return {
    id: r.id,
    aangemaaktOp: r.aangemaakt_op,
    scores: { algemeen: r.score_algemeen, energie: r.score_energie, voortgang: r.score_voortgang },
    notitie: r.notitie,
    aandachtspunt: r.aandachtspunt,
  }
}

/** Slaat één afgeronde coaching op en geeft de bewaarde rij terug. */
export async function slaEvaluatieOp(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
  inv: EvaluatieInvoer,
): Promise<OpslagUitkomst<EvaluatieJson>> {
  const { data, error } = await admin
    .from('pt_coaching')
    .insert({
      user_id: userId,
      persoon_id: persoonId,
      score_algemeen: inv.scores.algemeen,
      score_energie: inv.scores.energie,
      score_voortgang: inv.scores.voortgang,
      notitie: inv.notitie ?? null,
      aandachtspunt: inv.aandachtspunt ?? null,
    })
    .select(KOLOMMEN)
    .single()

  if (error || !data) return { ok: false, reden: 'db' }
  return { ok: true, waarde: vanRij(data as Rij) }
}

/** Alle evaluaties van één persoon, nieuwste eerst (voor de tijdlijn/kaart). */
export async function haalEvaluaties(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
): Promise<OpslagUitkomst<EvaluatieJson[]>> {
  const { data, error } = await admin
    .from('pt_coaching')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .eq('persoon_id', persoonId)
    .order('aangemaakt_op', { ascending: false })

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: (Array.isArray(data) ? (data as Rij[]) : []).map(vanRij) }
}
