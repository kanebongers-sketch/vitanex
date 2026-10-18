import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/taken/api'
import { isUuid, leesTaakWijziging } from '@/lib/club/taken/invoer'
import { wijzigTaak } from '@/lib/club/taken/beheer-opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// PATCH /api/club/taken/taak/[id]
//   { naam, groep, frequentie, perWeekMin, moment } of { actief } of { verplaats: 'omhoog' | 'omlaag' }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_taken', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze taak bestaat niet.', 404)
  const w = leesTaakWijziging(await leesJson(req))
  if (!w.ok) return clubFout(w.fout, 400)
  return alsAntwoord(await wijzigTaak(t, id, w.waarde))
}
