import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leesLessenVraag } from '@/lib/club/rooster/invoer'
import { haalLessen } from '@/lib/club/rooster/opslag'

// GET /api/club/rooster/lessen?v=<vestiging>&van=<ISO>&tot=<ISO>  (maximaal 62 dagen)
// Antwoord: { lessen: [{ id, startOp, eindOp, capaciteit, geannuleerd, annuleerReden,
//   lestype: { id, naam, soort }, zaal: { id, naam }, instructeur: { id, naam },
//   geboekt, wachtlijst, aanwezig, noShow }] }

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const vraag = leesLessenVraag(req.nextUrl.searchParams)
  if (!vraag.ok) return clubFout(vraag.fout, 400)
  const lessen = await haalLessen(t.admin, t.userId, vraag.waarde.vestiging, vraag.waarde.van, vraag.waarde.tot)
  if (!lessen) return clubFout('De lessen konden niet worden gelezen.', 500)
  return clubJson({ lessen })
}
