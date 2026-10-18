// GET /api/club/lid/afspraken/sloten?type=&datum=&medewerker=
// Vrije tijden voor het ingelogde lid, in de eigen vestiging.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { slotenVoorLid } from '@/lib/club/app/acties-afspraken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req, 'afspraken')
  if (l instanceof NextResponse) return l
  const zoek = req.nextUrl.searchParams
  return slotenVoorLid(l, l.lid, { type: zoek.get('type'), datum: zoek.get('datum'), medewerker: zoek.get('medewerker') })
}
