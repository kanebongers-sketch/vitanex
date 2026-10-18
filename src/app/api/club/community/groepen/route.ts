// POST /api/club/community/groepen  { naam, uitleg, toegang, vestiging, challengeId, lestypeId, ranglijst }
// Een nieuwe communitygroep voor de ledenapp. Antwoord: { id }.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { leesGroep } from '@/lib/club/community/invoer'
import { maakGroep } from '@/lib/club/community/beheer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const b = await leesJsonOfTeGroot(req, 4_000)
  if (b instanceof NextResponse) return b
  const invoer = leesGroep(b.body, t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakGroep(t, invoer.waarde))
}
