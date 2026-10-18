// POST   /api/club/community/groepen/[id]/leden  { lidId }  lid toevoegen (ook terugzetten)
// DELETE /api/club/community/groepen/[id]/leden  { lidId }  lid uit de groep halen

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesLidId } from '@/lib/club/community/invoer'
import { haalLidUitGroep, voegLidToe } from '@/lib/club/community/beheer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

async function pas(req: NextRequest, { params }: Context, toevoegen: boolean): Promise<NextResponse> {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze groep bestaat niet.', 404)
  const b = await leesJsonOfTeGroot(req, 1_000)
  if (b instanceof NextResponse) return b
  const lid = leesLidId(b.body)
  if (!lid.ok) return clubFout(lid.fout, 400)
  return alsAntwoord(toevoegen ? await voegLidToe(t, id, lid.waarde) : await haalLidUitGroep(t, id, lid.waarde))
}

export function POST(req: NextRequest, ctx: Context) {
  return pas(req, ctx, true)
}

export function DELETE(req: NextRequest, ctx: Context) {
  return pas(req, ctx, false)
}
