import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid, leesLesWijziging } from '@/lib/club/rooster/invoer'
import { haalLesDetail, wijzigLes } from '@/lib/club/rooster/opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// GET   /api/club/rooster/lessen/[id]  de les met deelnemers, wachtlijst en proefleden
// PATCH /api/club/rooster/lessen/[id]  { capaciteit?, instructeurId?, zaalId? } voor alleen deze les

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_lessen', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze les bestaat niet.', 404)
  const detail = await haalLesDetail(t.admin, t.userId, id)
  return detail ? clubJson(detail) : clubFout('Deze les bestaat niet.', 404)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_lessen', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze les bestaat niet.', 404)
  const wijziging = leesLesWijziging(await leesJson(req))
  if (!wijziging.ok) return clubFout(wijziging.fout, 400)
  return alsAntwoord(await wijzigLes(t, id, wijziging.waarde))
}
