import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { ruilDiensten } from '@/lib/club/personeel/diensten-opslag'
import { leesRuil } from '@/lib/club/personeel/invoer'

// POST /api/club/personeel/ruilen  { a, b }  wisselt de medewerkers van twee diensten

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesRuil(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  // Beide diensten moeten in een eigen vestiging liggen (anders hetzelfde antwoord als onbekend).
  const dicht = (await eisVestigingVanRecord(t, 'club_diensten', invoer.waarde.a)) ?? (await eisVestigingVanRecord(t, 'club_diensten', invoer.waarde.b))
  if (dicht) return dicht
  return alsAntwoord(await ruilDiensten(t, invoer.waarde.a, invoer.waarde.b))
}
