import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalSchema } from '@/lib/club/training/data'
import { gewichtMee, kopieRegels } from '@/lib/club/training/kopie'
import { isRij } from '@/lib/club/training/rijen'
import { lidVestiging, maakSchema } from '@/lib/club/training/schrijven'
import { isUuid } from '@/lib/club/training/typen'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'

// POST /api/club/training/schemas/[id]/kopie: kopieer een schema.
//   { lidId: null }                       opslaan als sjabloon
//   { lidId: "..." }                      sjabloon (of schema) toepassen op een lid, als concept
//   { lidId: "...", metGewicht: true }    schema naar een ander lid, met de gewichten
//   { naam: "..." }                       optioneel een andere naam (bijvoorbeeld voor een sjabloon)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params

  const buiten = await eisVestigingVanRecord(t, 'club_schemas', id)
  if (buiten) return buiten
  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body)) return clubFout('Ongeldig verzoek.', 400)
  const lidId = body.lidId === null || body.lidId === '' || body.lidId === undefined ? null : body.lidId
  if (lidId !== null && !isUuid(lidId)) return clubFout('Onbekend lid.', 400)
  const vestiging = lidId ? await lidVestiging(t.admin, t.userId, lidId) : null
  if (lidId && !hoortBij(t.vestigingen, vestiging)) return clubFout('Dit lid bestaat niet (meer).', 404)

  const bron = await haalSchema(t.admin, t.userId, id)
  if (!bron) return clubFout('Onbekend schema.', 404)
  const k = bron.kop
  const naam = typeof body.naam === 'string' && body.naam.trim() ? body.naam.trim().slice(0, 80) : k.naam

  const uit = await maakSchema(
    t.admin,
    t.userId,
    {
      lidId,
      naam,
      doel: k.doel,
      niveau: k.niveau,
      weken: k.weken,
      status: 'concept',
      medewerkerId: lidId ? k.medewerkerId : null,
      notitie: k.notitie,
      dagTitels: k.dagTitels,
      basisSleutel: lidId ? null : k.basisSleutel,
    },
    kopieRegels(bron.regels, { metGewicht: gewichtMee(lidId, k.lidId, body.metGewicht === true) }),
  )
  if (!uit.ok) return clubFout(uit.fout, 500)
  if (lidId && k.lidId && k.lidId !== lidId) await logActie(t, 'Schema gekopieerd naar ander lid', naam, vestiging)
  return clubJson({ id: uit.id }, 201)
}
