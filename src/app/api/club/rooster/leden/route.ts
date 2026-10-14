import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging } from '@/lib/club/gedeeld/vestiging'
import { volledigeNaam, zoekLeden } from '@/lib/club/gedeeld/lid'

// GET /api/club/rooster/leden?v=<vestiging>&q=<zoekterm>
// Voor "lid toevoegen" in het zijpaneel: alleen wat de balie daarvoor nodig heeft.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const q = (zoek.get('q') ?? '').slice(0, 60)
  if (q.trim().length < 2) return clubJson({ leden: [] })
  const leden = await zoekLeden(t.admin, t.userId, kiesVestiging(zoek.get('v')), q, 8)
  if (!leden) return clubFout('Zoeken is niet gelukt.', 500)
  return clubJson({
    leden: leden.map((l) => ({ id: l.id, naam: volledigeNaam(l), lidnummer: l.lidnummer, status: l.status })),
  })
}
