import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging } from '@/lib/club/kern/vestiging'
import { zoekVoorBalie } from '@/lib/club/checkin/data'

// GET /api/club/checkin/zoek?v=budel&q=...
// Een gescande code (QR-token, Sportivity-ID, lidnummer) of een naam.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const q = (zoek.get('q') ?? '').slice(0, 80)
  const antwoord = await zoekVoorBalie(t.admin, t.userId, kiesVestiging(zoek.get('v')), q, new Date())
  if (!antwoord) return clubFout('Zoeken lukte niet. Probeer het opnieuw.', 500)
  return clubJson(antwoord)
}
