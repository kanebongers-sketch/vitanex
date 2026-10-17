// PUT /api/club/automatisering/regels  { sleutel, aan, drempel, wie, sjabloon }
// Een regel voor ledenbehoud instellen. Hoort bij het instellingencentrum:
// alleen wie bij Beheer mag (Kane en de eigenaar, of een clubmanager met dat recht).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { REGEL_DEFINITIES, leesRegelInvoer } from '@/lib/club/automatisering/regels'
import { isMedewerkerVan, slaRegelOp } from '@/lib/club/automatisering/opslag'

export async function PUT(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magOnderdeel(t.onderdelen, 'beheer')) return clubFout('Niet gevonden.', 404)

  const b = await leesJsonOfTeGroot(req, 4_000)
  if (b instanceof NextResponse) return b
  const invoer = leesRegelInvoer(b.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const regel = invoer.waarde
  if (regel.wie.soort === 'medewerker' && !(await isMedewerkerVan(t.admin, t.userId, regel.wie.id))) {
    return clubFout('Deze medewerker werkt niet bij deze sportschool.', 400)
  }
  if (!(await slaRegelOp(t.admin, t.userId, regel))) return clubFout('De regel kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, `automatisering ${regel.aan ? 'aan' : 'uit'}`, REGEL_DEFINITIES[regel.sleutel].titel, null)
  return clubJson({ regel })
}
