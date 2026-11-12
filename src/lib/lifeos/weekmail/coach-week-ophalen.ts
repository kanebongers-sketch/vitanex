// ─── LifeOS — weekmail: coachgesprekken ophalen (SERVER-ONLY) ───────────────
// Haalt het coach-overzicht van het team op zoals de coachpagina het doet
// (`EigenaarCoach`): alleen de PT'ers, zonder de beheerder. De link gaat naar de
// coachpagina van Kane zelf (de beheerderslink); deze mail gaat alleen naar Kane.
// Best-effort: elke fout levert een blok met staat 'fout' op, nooit een gooi.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalCoachTeam } from '@/lib/lifeos/pt-coaching/coach-team'
import type { PtTeamGegevens } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { ptUrl } from '@/lib/fit-factory/domein'
import { bouwCoachWeek, type CoachWeek } from './coach-week'

/** De code van Kane's eigen beheerderslink (fitfactorypt.nl/<code>), of null. */
async function beheerderCode(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await admin
    .from('pt_lead_links')
    .select('code')
    .eq('user_id', userId)
    .eq('rol', 'beheerder')
    .eq('actief', true)
    .limit(1)
    .maybeSingle()
  if (error || !data || typeof data.code !== 'string' || data.code.length === 0) return null
  return data.code
}

export async function haalCoachWeek(
  admin: SupabaseClient,
  userId: string,
  team: PtTeamGegevens | null,
  nu: Date,
): Promise<CoachWeek> {
  const code = await beheerderCode(admin, userId).catch(() => null)
  const link = code ? ptUrl(`/${encodeURIComponent(code)}/coach`) : null
  if (!team) return { staat: 'fout', link }
  try {
    const pts = team.team.filter((p) => p.id !== team.beheerderId)
    const ct = await haalCoachTeam(admin, userId, pts, team.leads, team.klanten, nu)
    return bouwCoachWeek(ct.rijen, ct.agenda, nu, link)
  } catch (oorzaak) {
    console.error('[weekmail] coachgesprekken ophalen mislukt', oorzaak)
    return { staat: 'fout', link }
  }
}
