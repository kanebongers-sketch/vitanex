import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesSluiting } from '@/lib/club/sluiting/invoer'
import { verwijderSluiting, wijzigSluiting } from '@/lib/club/sluiting/opslag'

// PATCH  /api/club/sluiting/[id]  { datum, vestiging, soort, van?, tot?, reden }  de hele regel opnieuw
// DELETE /api/club/sluiting/[id]  de regel weg (configuratie, geen ledendata)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze sluitingsdag bestaat niet.', 404)
  const invoer = leesSluiting(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigSluiting(t, id, invoer.waarde))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze sluitingsdag bestaat niet.', 404)
  return alsAntwoord(await verwijderSluiting(t, id))
}
