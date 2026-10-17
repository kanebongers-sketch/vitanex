import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { volledigeNaam, zoekLeden } from '@/lib/club/kern/lid'

// GET /api/club/afspraken/leden?v=<vestiging>&q=<zoekterm>
// Lid zoeken bij het maken van een afspraak: naam, lidnummer, e-mail of telefoon.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const q = (zoek.get('q') ?? '').slice(0, 60)
  if (q.trim().length < 2) return clubJson({ leden: [] })
  const vestiging = kiesUit(t.vestigingen, zoek.get('v'))
  if (!vestiging) return clubFout('Onbekende vestiging.', 400)
  const leden = await zoekLeden(t.admin, t.userId, vestiging, q, 8)
  if (!leden) return clubFout('Zoeken is niet gelukt. Probeer het opnieuw.', 500)
  return clubJson({ leden: leden.map((l) => ({ id: l.id, naam: volledigeNaam(l), lidnummer: l.lidnummer })) })
}
