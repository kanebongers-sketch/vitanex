// GET /api/club/afspraken/app/sloten?lid=&type=&datum=&medewerker=
// Vrije tijden voor een lid in de app: met de boekregels van het type (zoveel
// uur van tevoren, hooguit vier weken vooruit). Leeg medewerker = maakt niet uit.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { isDatum } from '@/lib/club/rooster/tijd'
import { isUuid } from '@/lib/club/afspraken/invoer'
import { haalType } from '@/lib/club/afspraken/opslag'
import { boekVenster } from '@/lib/club/afspraken/regels'
import { zoekSloten } from '@/lib/club/afspraken/sloten-opslag'
import { trainersVoorType } from '@/lib/club/afspraken/api'
import { lidVoorApp } from '@/lib/club/afspraken/app-api'

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const zoek = req.nextUrl.searchParams
  const lid = await lidVoorApp(t, zoek.get('lid'))
  if (lid instanceof NextResponse) return lid
  const typeId = zoek.get('type')
  const datum = zoek.get('datum')
  const mw = zoek.get('medewerker')
  if (!isUuid(typeId)) return clubFout('Kies een soort afspraak.', 400)
  if (!isDatum(datum)) return clubFout('Kies een geldige datum.', 400)
  if (mw && !isUuid(mw)) return clubFout('Onbekende trainer.', 400)
  const type = await haalType(t.admin, t.userId, typeId)
  if (!type || !type.actief || !type.appBoekbaar) return clubFout('Dit soort afspraak kun je niet zelf boeken.', 404)
  const trainers = await trainersVoorType(t, lid.vestiging, type)
  if (!trainers) return clubFout('De trainers konden niet worden geladen.', 500)
  const ids = mw ? trainers.filter((m) => m.id === mw).map((m) => m.id) : trainers.map((m) => m.id)
  const { vanaf, tot } = boekVenster(type, new Date())
  const sloten = await zoekSloten(t.admin, t.userId, { vestiging: lid.vestiging, type, datum, medewerkerIds: ids, vanaf, tot })
  if (!sloten) return clubFout('De vrije tijden konden niet worden geladen.', 500)
  const naam = new Map(trainers.map((m) => [m.id, m.naam]))
  return clubJson({ sloten: sloten.map((s) => ({ ...s, medewerkerNaam: naam.get(s.medewerkerId) ?? '' })) })
}
