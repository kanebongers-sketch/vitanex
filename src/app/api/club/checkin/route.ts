import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { isVestiging } from '@/lib/club/gedeeld/vestiging'
import { volledigeNaam } from '@/lib/club/gedeeld/lid'
import { checkIn } from '@/lib/club/checkin/data'
import { leesCheckinInvoer } from '@/lib/club/checkin/regels'

// POST /api/club/checkin  { lidId, vestiging, bron }
// Checkt een lid in aan de balie. Niet actief of al binnen 30 minuten
// ingecheckt: geen nieuwe rij, wel een duidelijk antwoord voor het scherm.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  const invoer = leesCheckinInvoer(body)
  if (!invoer || !isVestiging(invoer.vestiging)) return clubFout('Ongeldig verzoek.', 400)
  const uitslag = await checkIn(t.admin, t.userId, { lidId: invoer.lidId, vestiging: invoer.vestiging, bron: invoer.bron }, new Date())
  if (!uitslag.ok) return clubFout(uitslag.fout, uitslag.status)
  if (uitslag.antwoord.soort === 'ingecheckt') {
    const les = uitslag.antwoord.les ? `, aanwezig bij ${uitslag.antwoord.les.naam}` : ''
    await logActie(t, 'Ingecheckt', `${volledigeNaam(uitslag.lid)} (${invoer.bron})${les}`, invoer.vestiging)
  }
  return clubJson(uitslag.antwoord)
}
