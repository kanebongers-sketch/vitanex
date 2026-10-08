// GET /api/lifeos/pt-team/[id] — alle leads en klanten van één PT'er (alleen-lezen).
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { zorgVoorLinks } from '@/lib/lifeos/leads/links'
import { haalLeadsVoor } from '@/lib/lifeos/leads/opslag'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { haalKlantenVoor } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { haalDoelenVoor } from '@/lib/lifeos/pt-dashboard/doelen-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const { id } = await ctx.params

  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  if (!personen.ok) return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502 })
  const persoon = personen.waarde.find((p) => p.id === id)
  if (!persoon) return NextResponse.json({ fout: 'Deze PT\'er bestaat niet (meer).' }, { status: 404 })

  const [links, leads, klanten, doelen] = await Promise.all([
    zorgVoorLinks(toegang.admin, toegang.userId, [persoon]),
    haalLeadsVoor(toegang.admin, toegang.userId, [id]),
    haalKlantenVoor(toegang.admin, toegang.userId, [id]),
    haalDoelenVoor(toegang.admin, toegang.userId, [id]),
  ])
  return NextResponse.json(
    {
      naam: persoon.naam,
      code: links.get(id)?.code ?? null,
      vandaag: dagSleutelNl(new Date()),
      leads: leads.get(id) ?? [],
      klanten: klanten.get(id) ?? [],
      doelen: doelen.ok ? (doelen.waarde.get(id) ?? null) : null,
    },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } },
  )
}
