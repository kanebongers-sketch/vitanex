// POST   /api/club/lid/community/berichten/[id]/reactie  { soort: 'duim' | 'highfive' }
// DELETE /api/club/lid/community/berichten/[id]/reactie  { soort }  de reactie weer weg

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { COMMUNITY_BODY_MAX, vereisCommunityLid } from '@/lib/club/community/api'
import { leesReactie } from '@/lib/club/community/invoer'
import { zetReactie } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

async function wissel(req: NextRequest, { params }: Context, aan: boolean): Promise<NextResponse> {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Dit bericht bestaat niet.', 404)
  const b = await leesJsonOfTeGroot(req, COMMUNITY_BODY_MAX)
  if (b instanceof NextResponse) return b
  const soort = leesReactie(b.body)
  if (!soort.ok) return clubFout(soort.fout, 400)
  return alsAntwoord(await zetReactie(l, id, soort.waarde, aan))
}

export function POST(req: NextRequest, ctx: Context) {
  return wissel(req, ctx, true)
}

export function DELETE(req: NextRequest, ctx: Context) {
  return wissel(req, ctx, false)
}
