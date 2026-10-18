// POST   /api/club/lid/challenges/[id]  het ingelogde lid schrijft zich in
// DELETE /api/club/lid/challenges/[id]  en weer uit
// Alleen bij challenges met deelname 'inschrijven' en voor de eigen vestiging.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { schrijfIn, schrijfUit } from '@/lib/club/challenges/opslag'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Context) {
  const l = await vereisLidToegang(req, 'voortgang')
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze challenge bestaat niet.', 404)
  return alsAntwoord(await schrijfIn(l, id, l.lid.id))
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const l = await vereisLidToegang(req, 'voortgang')
  if (l instanceof NextResponse) return l
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze challenge bestaat niet.', 404)
  return alsAntwoord(await schrijfUit(l, id, l.lid.id))
}
