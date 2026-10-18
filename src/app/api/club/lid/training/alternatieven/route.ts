// GET /api/club/lid/training/alternatieven?regel=<schemaregel-id>
// Toestel bezet: andere oefeningen met hetzelfde bewegingspatroon en dezelfde
// spier, voor alleen deze training. Alleen voor een regel uit een schema van
// het ingelogde lid, en nooit zwaarder dan het origineel (alternatieven.ts).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { alternatievenAntwoord } from '@/lib/club/training/alternatieven-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  return alternatievenAntwoord(l, l.lid.id, req.nextUrl.searchParams.get('regel'))
}
