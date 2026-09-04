// GET /api/lifeos/pt-coaching?persoon=<id> — de coaching-geschiedenis van één
// PT-klant, nieuwste eerst. Het verloop over tijd: gaat het beter of niet?
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalEvaluaties } from '@/lib/lifeos/pt-coaching/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const persoon = req.nextUrl.searchParams.get('persoon')
  if (!persoon) {
    return NextResponse.json({ fout: 'Geen PT-klant opgegeven.' }, { status: 400 })
  }

  const uitkomst = await haalEvaluaties(toegang.admin, toegang.userId, persoon)
  if (!uitkomst.ok) {
    return NextResponse.json({ fout: 'Kon de coaching-geschiedenis niet lezen.' }, { status: 502 })
  }

  return NextResponse.json(
    { evaluaties: uitkomst.waarde },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } },
  )
}
