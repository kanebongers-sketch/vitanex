import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { haalSchema } from '@/lib/club/training/data'
import { isRij } from '@/lib/club/training/rijen'
import { lidVestiging, maakSchema } from '@/lib/club/training/schrijven'
import { isUuid } from '@/lib/club/training/typen'

// POST /api/club/training/schemas/[id]/kopie: kopieer een schema.
//   { lidId: null }   opslaan als sjabloon
//   { lidId: "..." }  sjabloon (of schema) toepassen op een lid, als concept

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params

  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body)) return clubFout('Ongeldig verzoek.', 400)
  const lidId = body.lidId === null || body.lidId === '' || body.lidId === undefined ? null : body.lidId
  if (lidId !== null && !isUuid(lidId)) return clubFout('Onbekend lid.', 400)
  if (lidId && !(await lidVestiging(t.admin, t.userId, lidId))) return clubFout('Dit lid bestaat niet (meer).', 404)

  const bron = await haalSchema(t.admin, t.userId, id)
  if (!bron) return clubFout('Onbekend schema.', 404)
  const k = bron.kop

  const uit = await maakSchema(
    t.admin,
    t.userId,
    {
      lidId,
      naam: k.naam,
      doel: k.doel,
      niveau: k.niveau,
      weken: k.weken,
      status: 'concept',
      medewerkerId: lidId ? k.medewerkerId : null,
      notitie: k.notitie,
      dagTitels: k.dagTitels,
    },
    bron.regels.map((r) => ({
      dag: r.dag, oefeningId: r.oefeningId, sets: r.sets, herhalingen: r.herhalingen, gewichtKg: lidId ? r.gewichtKg : null,
      rustSec: r.rustSec, notitie: r.notitie,
    })),
  )
  if (!uit.ok) return clubFout(uit.fout, 500)
  return clubJson({ id: uit.id }, 201)
}
