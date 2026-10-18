// POST   /api/club/lid/community/groepen/[id]  het lid wordt lid van een open groep
// DELETE /api/club/lid/community/groepen/[id]  en verlaat de groep weer

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/kern/organisatie'
import { vereisCommunityLid } from '@/lib/club/community/api'
import { verlaatGroep, wordLid } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Context) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze groep bestaat niet.', 404)
  return alsAntwoord(await wordLid(l, id))
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze groep bestaat niet.', 404)
  return alsAntwoord(await verlaatGroep(l, id))
}
