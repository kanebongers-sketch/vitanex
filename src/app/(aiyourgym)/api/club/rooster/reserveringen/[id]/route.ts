import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid, leesAfvinkInvoer } from '@/lib/club/rooster/invoer'
import { zetAfvinkStatus } from '@/lib/club/rooster/opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { TAAL_COOKIE, kiesTaal } from '@/lib/aiyourgym/taal/taal'
import { ROOSTER_REGELS } from '@/lib/aiyourgym/taal/woorden/club/rooster'

// PATCH /api/club/rooster/reserveringen/[id]  { status: 'aanwezig'|'no_show'|'geboekt' }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const taal = kiesTaal(req.cookies.get(TAAL_COOKIE)?.value)
  const buiten = await eisVestigingVanRecord(t, 'club_reserveringen', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout(ROOSTER_REGELS[taal].reserveringBestaatNiet, 404)
  const status = leesAfvinkInvoer(await leesJson(req))
  if (!status.ok) return clubFout(status.fout, 400)
  return alsAntwoord(await zetAfvinkStatus(t, id, status.waarde, new Date(), taal))
}
