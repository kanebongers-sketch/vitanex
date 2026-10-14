import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { leesSjabloon } from '@/lib/club/personeel/invoer'
import { bewaarPatroon } from '@/lib/club/personeel/plannen-opslag'

// POST /api/club/personeel/patronen  { vestiging, maandag, naam }  bewaart die week als vast patroon

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesSjabloon(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { vestiging, maandag, naam } = invoer.waarde
  return alsAntwoord(await bewaarPatroon(t, vestiging, maandag, naam))
}
