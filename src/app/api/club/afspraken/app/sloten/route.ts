// GET /api/club/afspraken/app/sloten?lid=&type=&datum=&medewerker=
// Vrije tijden voor een lid in de app: met de boekregels van het type (zoveel
// uur van tevoren, hooguit vier weken vooruit). Leeg medewerker = maakt niet uit.
// Voorvertoning voor de beheerder; leden gebruiken /api/club/lid/afspraken/sloten.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { lidVoorApp } from '@/lib/club/afspraken/app-api'
import { slotenVoorLid } from '@/lib/club/app/acties-afspraken'

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const lid = await lidVoorApp(t, zoek.get('lid'))
  if (lid instanceof NextResponse) return lid
  return slotenVoorLid(t, lid, { type: zoek.get('type'), datum: zoek.get('datum'), medewerker: zoek.get('medewerker') })
}
