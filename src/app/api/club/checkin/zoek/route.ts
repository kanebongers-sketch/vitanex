import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { zoekVoorBalie } from '@/lib/club/checkin/data'

// GET /api/club/checkin/zoek?v=budel&q=...
// Een gescande code (QR-token, Sportivity-ID, lidnummer) of een naam.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const q = (zoek.get('q') ?? '').slice(0, 80)
  const vestiging = kiesUit(t.vestigingen, zoek.get('v'))
  if (!vestiging) return clubFout('Onbekende vestiging.', 400)
  const antwoord = await zoekVoorBalie(t.admin, t.userId, vestiging, q, new Date(), t.vestigingen)
  if (!antwoord) return clubFout('Zoeken lukte niet. Probeer het opnieuw.', 500)
  return clubJson(antwoord)
}
