// PATCH /api/club/community/groepen/[id]  { actie: 'archiveren' | 'terugzetten' }
//                                         of de velden van de groep (zoals POST)

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { vereisCommunityBeheer } from '@/lib/club/community/api'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesGroep, leesGroepActie } from '@/lib/club/community/invoer'
import { archiveerGroep, wijzigGroep } from '@/lib/club/community/beheer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisCommunityBeheer(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze groep bestaat niet.', 404)
  const b = await leesJsonOfTeGroot(req, 4_000)
  if (b instanceof NextResponse) return b
  const actie = leesGroepActie(b.body)
  if (!actie.ok) return clubFout(actie.fout, 400)
  if (actie.waarde) return alsAntwoord(await archiveerGroep(t, id, actie.waarde === 'archiveren'))
  const invoer = leesGroep(b.body, t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigGroep(t, id, invoer.waarde))
}
