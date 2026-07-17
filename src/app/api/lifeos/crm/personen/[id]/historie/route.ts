// GET  /api/lifeos/crm/personen/[id]/historie — de tijdlijn van één persoon
//        → { historie: HistorieItem[] }  (nieuwste eerst)
// POST /api/lifeos/crm/personen/[id]/historie — een losse notitie toevoegen
//        body { soort: 'notitie', notitie } → { item: HistorieItem } 201
//
// De popup toont deze tijdlijn: statuswissels (door de PATCH op de persoon
// geschreven), contact/follow-up, en de losse notities die je hier toevoegt.
// Een statuswissel loop je NIET via deze POST — die hoort bij het verplaatsen van
// de tegel (PATCH op de persoon), zodat status en log niet uit elkaar lopen.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalHistorie, leesLosseNotitie, logGebeurtenis } from '@/lib/lifeos/crm/historie'
import type { Reden } from '@/lib/lifeos/crm/fout'

export const runtime = 'nodejs'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

function foutAntwoord(reden: Reden) {
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die notitie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Persoon bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon de geschiedenis niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await haalHistorie(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ historie: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params

  const body: unknown = await req.json().catch(() => null)
  const notitie = leesLosseNotitie(body)
  if (!notitie.ok) {
    return NextResponse.json({ fout: notitie.fout }, { status: 400 })
  }

  const uitkomst = await logGebeurtenis(toegang.admin, toegang.userId, id, {
    soort: 'notitie',
    notitie: notitie.waarde,
  })
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ item: uitkomst.waarde }, { status: 201 })
}
