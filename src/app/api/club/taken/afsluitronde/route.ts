import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson, vandaagNl } from '@/lib/club/taken/api'
import { leesAfsluitInvoer } from '@/lib/club/taken/invoer'
import { meldAfsluitronde } from '@/lib/club/taken/afvink-opslag'

// POST /api/club/taken/afsluitronde  { vestiging, medewerkerId?, wie }
// Meldt de afsluitronde van vandaag klaar (wie, wanneer, hoeveel nog open) en logt het.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesAfsluitInvoer(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const r = await meldAfsluitronde(t, invoer.waarde, vandaagNl())
  if (r.ok) {
    const open = r.waarde.openTaken === 0 ? 'alles afgevinkt' : `${r.waarde.openTaken} open`
    await logActie(t, 'Afsluitronde klaar', `${r.waarde.wie}, ${open}`, invoer.waarde.vestiging)
  }
  return alsAntwoord(r)
}
