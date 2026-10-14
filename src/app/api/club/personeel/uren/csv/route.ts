import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging } from '@/lib/club/kern/vestiging'
import { isDatum, nlDelen } from '@/lib/club/rooster/tijd'
import { haalDiensten, haalTeam } from '@/lib/club/personeel/opslag'
import { PERIODE_SOORTEN, periodeVan, urenCsv, urenOverzicht } from '@/lib/club/personeel/uren'

// GET /api/club/personeel/uren/csv?v=<vestiging>&periode=week|4weken|maand&op=<datum>
//   CSV (puntkomma, decimale komma) voor de salarisadministratie.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const vestiging = kiesVestiging(zoek.get('v'))
  const soort = PERIODE_SOORTEN.find((p) => p === zoek.get('periode')) ?? 'week'
  const op = zoek.get('op')
  const periode = periodeVan(soort, isDatum(op) ? op : nlDelen(new Date()).datum)
  const [team, diensten] = await Promise.all([
    haalTeam(t.admin, t.userId, vestiging),
    haalDiensten(t.admin, t.userId, vestiging, periode.van, periode.tot),
  ])
  if (!team || !diensten) return clubFout('De uren konden niet worden gelezen.', 500)
  const csv = urenCsv(urenOverzicht(team, diensten, periode), team, periode)
  await logActie(t, 'uren geexporteerd', `${periode.van} tot ${periode.tot}`, vestiging)
  return new NextResponse(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="uren-${vestiging}-${periode.van}.csv"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
