import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalOefeningen } from '@/lib/club/training/data'
import { isRij } from '@/lib/club/training/rijen'
import { lidVestiging, maakSchema } from '@/lib/club/training/schrijven'
import { basisRegels, basisSjabloon, naamSleutel } from '@/lib/club/training/sjablonen/basis'
import { isUuid } from '@/lib/club/training/typen'
import { hoortBij } from '@/lib/club/kern/vestigingen'

// POST /api/club/training/sjablonen/basis { sleutel, lidId? }
// Een startschema uit de basisset:
//   zonder lidId: als eigen sjabloon van de sportschool (daarna aan te passen)
//   met lidId:    direct als concept op dat lid
// De oefeningen worden op naam gekoppeld aan de eigen bibliotheek.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body)) return clubFout('Ongeldig verzoek.', 400)
  const sjabloon = basisSjabloon(body.sleutel)
  if (!sjabloon) return clubFout('Onbekend startschema.', 400)
  const lidId = body.lidId === null || body.lidId === undefined || body.lidId === '' ? null : body.lidId
  if (lidId !== null && !isUuid(lidId)) return clubFout('Onbekend lid.', 400)
  const vestiging = lidId ? await lidVestiging(t.admin, t.userId, lidId) : null
  if (lidId && !hoortBij(t.vestigingen, vestiging)) return clubFout('Dit lid bestaat niet (meer).', 404)

  const oefeningen = await haalOefeningen(t.admin, t.userId)
  if (!oefeningen) return clubFout('De oefeningen konden niet worden geladen.', 500)
  const opNaam = new Map(oefeningen.filter((o) => o.actief).map((o) => [naamSleutel(o.naam), o.id]))
  const { regels, ontbreekt } = basisRegels(sjabloon, opNaam)
  if (ontbreekt.length > 0) {
    return clubFout(`Deze oefeningen staan niet (actief) in jullie bibliotheek: ${ontbreekt.join(', ')}. Zet ze aan of kies een ander startschema.`, 422)
  }

  const uit = await maakSchema(
    t.admin,
    t.userId,
    {
      lidId,
      naam: sjabloon.naam,
      doel: sjabloon.doel,
      niveau: sjabloon.niveau,
      weken: sjabloon.weken,
      status: 'concept',
      medewerkerId: null,
      notitie: `${sjabloon.uitleg} ${sjabloon.perWeek[0].toUpperCase()}${sjabloon.perWeek.slice(1)}.`.slice(0, 1000),
      dagTitels: sjabloon.dagen.map((d) => d.titel),
      basisSleutel: lidId ? null : sjabloon.sleutel,
    },
    regels,
  )
  if (!uit.ok) return clubFout(uit.fout, 500)
  await logActie(t, lidId ? 'Startschema op lid gezet' : 'Startschema als sjabloon opgeslagen', sjabloon.naam, vestiging)
  return clubJson({ id: uit.id }, 201)
}
