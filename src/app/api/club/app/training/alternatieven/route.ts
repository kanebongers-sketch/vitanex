import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid } from '@/lib/club/kern/lid'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { alternatievenAntwoord } from '@/lib/club/training/alternatieven-opslag'
import { isUuid } from '@/lib/club/training/typen'

// GET /api/club/app/training/alternatieven?lid=<id>&regel=<schemaregel-id>
// Voorvertoning van de ledenapp in Club: dezelfde alternatieven als het lid
// krijgt via /api/club/lid/training/alternatieven.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lidId = req.nextUrl.searchParams.get('lid')
  if (!isUuid(lidId)) return clubFout('Lid niet gevonden.', 404)
  const lid = await haalLid(t.admin, t.userId, lidId)
  if (!lid || !hoortBij(t.vestigingen, lid.vestiging)) return clubFout('Lid niet gevonden.', 404)
  return alternatievenAntwoord(t, lid.id, req.nextUrl.searchParams.get('regel'))
}
