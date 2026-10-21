// POST /api/club/lid/community/berichten/[id]/melden  { reden, toelichting? }
// Het bericht komt in de lijst van de sportschool (/club/community).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { COMMUNITY_BODY_MAX, vereisCommunityLid } from '@/lib/club/community/api'
import { leesMelding } from '@/lib/club/community/invoer'
import { meldBericht } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Dit bericht bestaat niet.', 404)
  const b = await leesJsonOfTeGroot(req, COMMUNITY_BODY_MAX)
  if (b instanceof NextResponse) return b
  const invoer = leesMelding(b.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await meldBericht(l, id, invoer.waarde))
}
