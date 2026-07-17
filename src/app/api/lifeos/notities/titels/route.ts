// GET /api/lifeos/notities/titels — alle titels die bestaan.
//
// Waarvoor: de UI moet van een `[[verwijzing]]` weten of hij ergens op uitkomt.
// Dat kan ze niet uit de zichtbare lijst afleiden — een notitie van vorige week
// staat daar niet in, en dan zou een prima werkende verwijzing er als "bestaat
// nog niet" uitzien. Liever één kleine extra call dan een UI die dingen beweert
// die niet waar zijn.
//
// `afgekapt: true` betekent: dit zijn niet alle titels. De UI hoort dan van geen
// enkele verwijzing te beweren dat hij niet bestaat.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalTitels } from '@/lib/lifeos/notities/kennis'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await haalTitels(toegang.admin, toegang.userId)
  if (!uitkomst.ok) {
    return NextResponse.json({ fout: 'Kon de titels niet ophalen.' }, { status: 502 })
  }

  return NextResponse.json(uitkomst.waarde, { headers: CACHE_HEADERS })
}
