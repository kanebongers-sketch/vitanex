// PATCH /api/club/community/berichten/[id]  { actie: 'verbergen' | 'plaatsen' }
// Een vastgehouden of gemeld bericht beoordelen; open meldingen erop zijn
// daarmee afgehandeld.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesModeratie } from '@/lib/club/community/invoer'
import { modereerBericht } from '@/lib/club/community/beheer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Dit bericht bestaat niet.', 404)
  const b = await leesJsonOfTeGroot(req, 1_000)
  if (b instanceof NextResponse) return b
  const actie = leesModeratie(b.body)
  if (!actie.ok) return clubFout(actie.fout, 400)
  return alsAntwoord(await modereerBericht(t, id, actie.waarde))
}
