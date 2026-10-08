// PUT /api/lifeos/pt-team/[id]/doelen — Kane zet de doelen van één PT'er.
// Body: { leadsPerWeek, klantenPerMaand, abonnementen, notitie } (leeg/0 = geen doel).
// Antwoord: de opgeslagen doelen. Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { leesDoelenInvoer } from '@/lib/lifeos/pt-dashboard/doelen'
import { slaDoelenOp } from '@/lib/lifeos/pt-dashboard/doelen-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }

export async function PUT(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const { id } = await ctx.params

  const invoer = leesDoelenInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return NextResponse.json({ fout: invoer.fout }, { status: 400, headers: GEEN_CACHE })

  // Alleen doelen voor iemand die echt in het PT-team zit.
  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  if (!personen.ok) return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502, headers: GEEN_CACHE })
  if (!personen.waarde.some((p) => p.id === id)) {
    return NextResponse.json({ fout: 'Deze PT\'er bestaat niet (meer).' }, { status: 404, headers: GEEN_CACHE })
  }

  const uit = await slaDoelenOp(toegang.admin, toegang.userId, id, invoer.waarde)
  if (!uit.ok) return NextResponse.json({ fout: 'Kon de doelen niet opslaan. Probeer het opnieuw.' }, { status: 502, headers: GEEN_CACHE })
  return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
}
