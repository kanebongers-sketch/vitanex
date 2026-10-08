// GET /api/lifeos/pt-team — per PT'er de kerncijfers uit het PT-dashboard
// (leads, opvolging, klanten, maandwaarde) + per club de leads per status +
// team-brede funnel & trends (`analyse`, zie pt-dashboard/analyse.ts).
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'
import { zorgVoorLinks } from '@/lib/lifeos/leads/links'
import { haalLeadsVoor } from '@/lib/lifeos/leads/opslag'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoor } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { bouwTeamOverzicht } from '@/lib/lifeos/pt-dashboard/team-overzicht'
import { haalDoelenVoor } from '@/lib/lifeos/pt-dashboard/doelen-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  if (!personen.ok) return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502 })
  const team = personen.waarde.filter((p) => p.status !== 'inactief' && !isVergadering(p.naam))
  const ids = team.map((p) => p.id)

  const [links, leads, klanten, doelen] = await Promise.all([
    zorgVoorLinks(toegang.admin, toegang.userId, team),
    haalLeadsVoor(toegang.admin, toegang.userId, ids),
    haalKlantenVoor(toegang.admin, toegang.userId, ids),
    haalDoelenVoor(toegang.admin, toegang.userId, ids),
  ])
  const overzicht = bouwTeamOverzicht(
    team.map((p) => ({ id: p.id, naam: p.naam, code: links.get(p.id)?.code ?? null, pinStatus: links.get(p.id)?.pinStatus ?? null })),
    leads,
    klanten,
    dagSleutelNl(new Date()),
    // Doelen zijn een extra laag: lukt het lezen niet, dan het overzicht zonder doelen.
    doelen.ok ? doelen.waarde : undefined,
  )
  return NextResponse.json(overzicht, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}
