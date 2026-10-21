import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { isRij } from '@/lib/club/training/rijen'
import { lidVestiging, maakSchema } from '@/lib/club/training/schrijven'
import { isUuid } from '@/lib/club/training/typen'
import { hoortBij } from '@/lib/club/kern/vestigingen'

// POST /api/club/training/schemas: een nieuw, leeg schema (concept) voor een lid,
// of een nieuw sjabloon als lidId leeg is. Body: { lidId?: string | null, naam?: string }

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body)) return clubFout('Ongeldig verzoek.', 400)
  const lidId = body.lidId === null || body.lidId === undefined || body.lidId === '' ? null : body.lidId
  if (lidId !== null && !isUuid(lidId)) return clubFout('Onbekend lid.', 400)
  if (lidId && !hoortBij(t.vestigingen, await lidVestiging(t.admin, t.userId, lidId))) return clubFout('Dit lid bestaat niet (meer).', 404)
  const naam = typeof body.naam === 'string' && body.naam.trim() ? body.naam.trim().slice(0, 80) : lidId ? 'Nieuw schema' : 'Nieuw sjabloon'

  const uit = await maakSchema(
    t.admin,
    t.userId,
    { lidId, naam, doel: null, niveau: 1, weken: null, status: 'concept', medewerkerId: null, notitie: null, dagTitels: ['Dag A'] },
    [],
  )
  if (!uit.ok) return clubFout(uit.fout, 500)
  return clubJson({ id: uit.id }, 201)
}
