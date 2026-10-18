// DELETE /api/club/lid/community/berichten/[id]  het lid haalt een eigen bericht weg

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/kern/organisatie'
import { vereisCommunityLid } from '@/lib/club/community/api'
import { verwijderEigenBericht } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Dit bericht bestaat niet.', 404)
  return alsAntwoord(await verwijderEigenBericht(l, id))
}
