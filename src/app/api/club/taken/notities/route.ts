import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson, vandaagNl } from '@/lib/club/taken/api'
import { leesNotitieInvoer } from '@/lib/club/taken/invoer'
import { voegNotitieToe } from '@/lib/club/taken/afvink-opslag'

// POST /api/club/taken/notities  { vestiging, datum, tekst, medewerkerId?, wie }  geeft de notitie
// Voor "Iets anders gedaan?" per dag.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNotitieInvoer(await leesJson(req), vandaagNl())
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await voegNotitieToe(t, invoer.waarde))
}
