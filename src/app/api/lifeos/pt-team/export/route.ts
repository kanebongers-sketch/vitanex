// GET /api/lifeos/pt-team/export?soort=leads|klanten — alle leads of alle
// PT-klanten van het team als CSV voor Excel (NL). Zelfde kolommen als de oude
// Excel-tracker; de opbouw staat puur in `pt-dashboard/export.ts`.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { haalPtTeamGegevens } from '@/lib/lifeos/pt-dashboard/team-opslag'
import { exportBestandsnaam, isExportSoort, klantenCsv, leadsCsv } from '@/lib/lifeos/pt-dashboard/export'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const soort = req.nextUrl.searchParams.get('soort')
  if (!isExportSoort(soort)) return NextResponse.json({ fout: 'Kies soort=leads of soort=klanten.' }, { status: 400 })

  const g = await haalPtTeamGegevens(toegang.admin, toegang.userId)
  if (!g) return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502 })

  const body =
    soort === 'leads'
      ? leadsCsv(g.team.map((p) => ({ naam: p.naam, items: g.leads.get(p.id) ?? [] })))
      : klantenCsv(g.team.map((p) => ({ naam: p.naam, items: g.klanten.get(p.id) ?? [] })))

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportBestandsnaam(soort, dagSleutelNl(new Date()))}"`,
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
