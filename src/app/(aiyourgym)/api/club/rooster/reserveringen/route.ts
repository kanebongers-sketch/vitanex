import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesReserveerInvoer } from '@/lib/club/rooster/invoer'
import { reserveer } from '@/lib/club/rooster/opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// POST /api/club/rooster/reserveringen  { lesId, lidId, bron: 'app'|'balie'|'instructeur' }
// Antwoord: { id, status: 'geboekt'|'wachtlijst', wachtpositie } of { fout }.
// Een medewerker boekt alleen in lessen van zijn eigen vestigingen (anders 404).

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesReserveerInvoer(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const buiten = await eisVestigingVanRecord(t, 'club_lessen', invoer.waarde.lesId)
  if (buiten) return buiten
  return alsAntwoord(await reserveer(t, invoer.waarde))
}
