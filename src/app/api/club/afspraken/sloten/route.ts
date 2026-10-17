import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { leesSlotVraag } from '@/lib/club/afspraken/invoer'
import { haalType } from '@/lib/club/afspraken/opslag'
import { zoekSloten } from '@/lib/club/afspraken/sloten-opslag'
import { trainersVoorType } from '@/lib/club/afspraken/api'

// GET /api/club/afspraken/sloten?v=&type=&datum=&medewerker=&negeer=
// Vrije tijden voor de balie en trainers: vanaf nu, zonder de app-regels.

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const vraag = leesSlotVraag(req.nextUrl.searchParams)
  if (!vraag.ok) return clubFout(vraag.fout, 400)
  const v = vraag.waarde
  if (!hoortBij(t.vestigingen, v.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const type = await haalType(t.admin, t.userId, v.typeId)
  if (!type) return clubFout('Dit soort afspraak bestaat niet.', 404)
  const trainers = await trainersVoorType(t, v.vestiging, type)
  if (!trainers) return clubFout('De trainers konden niet worden geladen.', 500)
  const ids = v.medewerkerId ? trainers.filter((m) => m.id === v.medewerkerId).map((m) => m.id) : trainers.map((m) => m.id)
  const negeer = req.nextUrl.searchParams.get('negeer') ?? undefined
  const sloten = await zoekSloten(t.admin, t.userId, { vestiging: v.vestiging, type, datum: v.datum, medewerkerIds: ids, vanaf: new Date(), tot: null, negeerAfspraakId: negeer })
  if (!sloten) return clubFout('De vrije tijden konden niet worden berekend.', 500)
  const naam = new Map(trainers.map((m) => [m.id, m.naam]))
  return clubJson({ sloten: sloten.map((s) => ({ ...s, medewerkerNaam: naam.get(s.medewerkerId) ?? '' })) })
}
