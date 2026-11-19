import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { leesVast } from '@/lib/club/personeel/invoer'
import { zetVasteWeek } from '@/lib/club/personeel/team-opslag'

// PUT /api/club/personeel/beschikbaarheid/vast
//   { medewerkerId, dagen: zeven keer { beschikbaar: true, false of null, van?, tot? } }  (maandag eerst)

export async function PUT(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesVast(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  // Alleen voor een collega met wie je een vestiging deelt.
  const dicht = await eisVestigingVanRecord(t, 'club_medewerkers', invoer.waarde.medewerkerId)
  if (dicht) return dicht
  return alsAntwoord(await zetVasteWeek(t, invoer.waarde.medewerkerId, invoer.waarde.dagen))
}
