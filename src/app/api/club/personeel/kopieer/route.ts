import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { leesKopie } from '@/lib/club/personeel/invoer'
import { kopieerVorigeWeek } from '@/lib/club/personeel/plannen-opslag'

// POST /api/club/personeel/kopieer  { vestiging, maandag, vervang? }
//   Zet de diensten van de week ervoor in deze week (aanvullen, of vervangen). Antwoord: { toegevoegd }

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesKopie(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { vestiging, maandag, vervang } = invoer.waarde
  return alsAntwoord(await kopieerVorigeWeek(t, vestiging, maandag, vervang))
}
