import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisKane } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { leesStatusWijziging, zetDemoStatus } from '@/lib/club/platform/demo-aanvragen'

// PATCH /api/club/platform/demo-aanvragen  { id, status: 'afgehandeld' | 'open' }
// Kane zet een demo-aanvraag van de website op afgehandeld (of terug op open).
// Alleen voor Kane: iedereen anders krijgt een 404. Zelfde oorsprong controleert
// vereisKane (via vereisClubToegang) voor elke schrijvende methode.

const MAX_BODY_BYTES = 512

export async function PATCH(req: NextRequest) {
  const t = await vereisKane(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY_BYTES)
  if (gelezen instanceof NextResponse) return gelezen
  const wijziging = leesStatusWijziging(gelezen.body)
  if (!wijziging.ok) return clubFout(wijziging.fout, 400)
  if (!(await zetDemoStatus(t.admin, wijziging.id, wijziging.status, new Date()))) return clubFout('Bijwerken lukte niet. Probeer het opnieuw.', 500)
  return clubJson({ ok: true, status: wijziging.status })
}
