// ─── PT-team — alles van het team in één keer (SERVER-ONLY) ─────────────────
// De actieve PT'ers (CRM-groep pt_team, zonder vergader-tegels) met hun leads en
// klanten. Gedeeld door de CSV-export en de weekmail.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'
import { haalLeadsVoorStrikt } from '@/lib/lifeos/leads/opslag'
import type { Lead } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoorStrikt } from './klanten-opslag'
import type { PtKlant } from './abonnementen'

export interface PtTeamGegevens {
  team: { id: string; naam: string }[]
  leads: Map<string, Lead[]>
  klanten: Map<string, PtKlant[]>
}

/** Null = team, leads of klanten konden niet gelezen worden (fout ≠ leeg). */
export async function haalPtTeamGegevens(admin: SupabaseClient, userId: string): Promise<PtTeamGegevens | null> {
  const personen = await haalPersonen(admin, userId, 'pt_team')
  if (!personen.ok) return null
  const team = personen.waarde
    .filter((p) => p.status !== 'inactief' && !isVergadering(p.naam))
    .map((p) => ({ id: p.id, naam: p.naam }))
  const ids = team.map((p) => p.id)
  const [leads, klanten] = await Promise.all([haalLeadsVoorStrikt(admin, userId, ids), haalKlantenVoorStrikt(admin, userId, ids)])
  if (!leads || !klanten) return null
  return { team, leads, klanten }
}
