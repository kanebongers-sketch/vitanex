import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { volledigeNaam, zoekLeden } from '@/lib/club/kern/lid'
import { kiesVestiging } from '@/lib/club/kern/vestiging'

// GET /api/club/training/leden?v=budel&q=sanne: leden zoeken voor de lidkiezer.
// Alleen wat de kiezer nodig heeft: id, naam, lidnummer, status.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const zoek = req.nextUrl.searchParams
  const vestiging = kiesVestiging(zoek.get('v'))
  const term = (zoek.get('q') ?? '').slice(0, 60)
  const leden = await zoekLeden(t.admin, t.userId, vestiging, term, 12)
  if (!leden) return clubFout('Zoeken lukte niet.', 500)

  return clubJson({
    leden: leden.map((l) => ({ id: l.id, naam: volledigeNaam(l), lidnummer: l.lidnummer, status: l.status })),
  })
}
