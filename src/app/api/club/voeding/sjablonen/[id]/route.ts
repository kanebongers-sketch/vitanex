import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { leesSjabloon } from '@/lib/club/voeding/invoer'
import { verwijderSjabloon, wijzigSjabloon } from '@/lib/club/voeding/opslag'

// PATCH  /api/club/voeding/sjablonen/[id]  het hele sjabloon opnieuw
// DELETE /api/club/voeding/sjablonen/[id]  plannen houden hun eigen kopie

const MAX_BODY = 32 * 1024
const GEEN_SJABLOON = 'Dit sjabloon bestaat niet.'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout(GEEN_SJABLOON, 404)
  const body = await leesJsonBegrensd(req, MAX_BODY)
  if (body === 'te-groot') return clubFout('Het sjabloon is te groot.', 413)
  const invoer = leesSjabloon(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigSjabloon(t, id, invoer.waarde))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout(GEEN_SJABLOON, 404)
  return alsAntwoord(await verwijderSjabloon(t, id))
}
