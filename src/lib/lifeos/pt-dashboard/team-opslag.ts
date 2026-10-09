// ─── PT-team — alles van het team in één keer (SERVER-ONLY) ─────────────────
// De actieve PT'ers (CRM-groep pt_team, zonder vergader-tegels) met hun leads en
// klanten — plus de beheerder (Kane), die zelf ook PT-klanten traint maar geen
// PT'er is (geen coachgesprek, geen pincode). Gedeeld door de eigenaar-weergaven
// in de PT-app, de CSV-export en de weekmail.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'
import { haalLeadsVoorStrikt } from '@/lib/lifeos/leads/opslag'
import type { Lead } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoorStrikt } from './klanten-opslag'
import { haalDoelenVoor, type DoelenUitkomst } from './doelen-opslag'
import type { PtKlant } from './abonnementen'
import type { PtDoelen } from './doelen'

export interface PtTeamGegevens {
  team: { id: string; naam: string }[]
  leads: Map<string, Lead[]>
  klanten: Map<string, PtKlant[]>
  /** De persoon_id van de beheerder in `team`, of null — telt mee als trainer, niet als PT'er. */
  beheerderId: string | null
  /** Alleen met `metDoelen`: de doelen per persoon, opgehaald in hetzelfde rondje als leads en klanten. */
  doelen?: DoelenUitkomst<Map<string, PtDoelen>>
}

/** De beheerder (rol `beheerder`, actief) als trainer, of null als die er niet is. */
async function haalBeheerder(admin: SupabaseClient, userId: string): Promise<{ id: string; naam: string } | null | 'fout'> {
  // Link + naam in één vraag (foreign key persoon_id → crm_personen).
  const samen = await admin
    .from('pt_lead_links')
    .select('persoon_id, persoon:crm_personen(id, naam, user_id)')
    .eq('user_id', userId)
    .eq('rol', 'beheerder')
    .eq('actief', true)
    .limit(1)
    .maybeSingle()
  if (!samen.error) {
    if (!samen.data) return null
    const ruw: unknown = Array.isArray(samen.data.persoon) ? samen.data.persoon[0] : samen.data.persoon
    const p = typeof ruw === 'object' && ruw !== null ? (ruw as { id: string; naam: string; user_id: string }) : null
    return p && p.user_id === userId ? { id: p.id, naam: String(p.naam).split(' ')[0] } : null
  }
  // Vangnet: de oude weg met twee vragen, liever trager dan een kapotte teampagina.
  const { data: link, error } = await admin.from('pt_lead_links').select('persoon_id').eq('user_id', userId).eq('rol', 'beheerder').eq('actief', true).limit(1).maybeSingle()
  if (error) return 'fout'
  if (!link) return null
  const { data: p, error: fout } = await admin.from('crm_personen').select('id, naam').eq('user_id', userId).eq('id', link.persoon_id).maybeSingle()
  if (fout) return 'fout'
  return p ? { id: p.id as string, naam: String(p.naam).split(' ')[0] } : null
}

/** Null = team, leads of klanten konden niet gelezen worden (fout ≠ leeg). */
export async function haalPtTeamGegevens(
  admin: SupabaseClient,
  userId: string,
  { metDoelen = false }: { metDoelen?: boolean } = {},
): Promise<PtTeamGegevens | null> {
  const [personen, beheerder] = await Promise.all([haalPersonen(admin, userId, 'pt_team'), haalBeheerder(admin, userId)])
  if (!personen.ok || beheerder === 'fout') return null
  const pts = personen.waarde
    .filter((p) => p.status !== 'inactief' && !isVergadering(p.naam))
    .map((p) => ({ id: p.id, naam: p.naam }))
  const team = beheerder ? [...pts, beheerder] : pts
  const ids = team.map((p) => p.id)
  const [leads, klanten, doelen] = await Promise.all([
    haalLeadsVoorStrikt(admin, userId, ids),
    haalKlantenVoorStrikt(admin, userId, ids),
    metDoelen ? haalDoelenVoor(admin, userId, ids) : Promise.resolve(undefined),
  ])
  if (!leads || !klanten) return null
  return { team, leads, klanten, beheerderId: beheerder?.id ?? null, ...(doelen ? { doelen } : {}) }
}
