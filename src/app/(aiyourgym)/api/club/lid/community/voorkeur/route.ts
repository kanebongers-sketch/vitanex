// PATCH /api/club/lid/community/voorkeur  { opRanglijst: boolean }
// Of het lid met voornaam en initiaal op de ranglijsten van groepen staat.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { COMMUNITY_BODY_MAX, vereisCommunityLid } from '@/lib/club/community/api'
import { leesVoorkeur } from '@/lib/club/community/invoer'
import { zetOpRanglijst } from '@/lib/club/community/lid-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const l = await vereisCommunityLid(req)
  if (l instanceof NextResponse) return l
  const b = await leesJsonOfTeGroot(req, COMMUNITY_BODY_MAX)
  if (b instanceof NextResponse) return b
  const v = leesVoorkeur(b.body)
  if (!v.ok) return clubFout(v.fout, 400)
  return alsAntwoord(await zetOpRanglijst(l, v.waarde.opRanglijst))
}
