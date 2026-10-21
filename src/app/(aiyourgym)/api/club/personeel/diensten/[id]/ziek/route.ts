import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/personeel/api'
import { meldZiek } from '@/lib/club/personeel/diensten-opslag'
import { isUuid } from '@/lib/club/personeel/invoer'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// POST /api/club/personeel/diensten/[id]/ziek
//   De dienst wordt "ziek" voor de medewerker en er komt een open dienst bij. Antwoord: { openId }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_diensten', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze dienst bestaat niet.', 404)
  return alsAntwoord(await meldZiek(t, id))
}
