// POST /api/club/lid/community/groepen/[id]/berichten  { tekst }
// Een bericht in de groep. Met een woord uit de filter wordt het vastgehouden
// voor de sportschool (antwoord: { id, status: 'vastgehouden' }).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { COMMUNITY_BODY_MAX, vereisCommunityLid } from '@/lib/club/community/api'
import { leesBerichtTekst } from '@/lib/club/community/invoer'
import { plaatsBericht } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze groep bestaat niet.', 404)
  const b = await leesJsonOfTeGroot(req, COMMUNITY_BODY_MAX)
  if (b instanceof NextResponse) return b
  const tekst = leesBerichtTekst(b.body)
  if (!tekst.ok) return clubFout(tekst.fout, 400)
  return alsAntwoord(await plaatsBericht(l, id, tekst.waarde))
}
