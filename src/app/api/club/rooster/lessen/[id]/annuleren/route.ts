import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid, leesAnnuleerReden } from '@/lib/club/rooster/invoer'
import { annuleerLes } from '@/lib/club/rooster/opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// POST /api/club/rooster/lessen/[id]/annuleren  { reden }
// Antwoord: { status: 'geannuleerd', geraakt } met geraakt = aantal vervallen reserveringen.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_lessen', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze les bestaat niet.', 404)
  const reden = leesAnnuleerReden(await leesJson(req))
  if (!reden.ok) return clubFout(reden.fout, 400)
  return alsAntwoord(await annuleerLes(t, id, reden.waarde))
}
