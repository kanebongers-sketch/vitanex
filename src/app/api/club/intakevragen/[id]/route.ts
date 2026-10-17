import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isVraagId } from '@/lib/club/intakevragen/invoer'
import { verwijderVraag, wijzigVraag } from '@/lib/club/intakevragen/opslag'

// PATCH  /api/club/intakevragen/[id]  de hele vraag opnieuw (bij een vaste vraag alleen tekst, uitleg, sectie en aan/uit)
// DELETE /api/club/intakevragen/[id]  een eigen vraag weg; oude intakes houden hun kopie van de vraag
// [id] is een uuid, of kern:<sleutel> voor een vaste vraag die nog niet is aangepast.

const ONBEKEND = 'Deze vraag bestaat niet (meer).'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isVraagId(id)) return clubFout(ONBEKEND, 404)
  const b = await leesJsonOfTeGroot(req, 16_000)
  if (b instanceof NextResponse) return b
  return alsAntwoord(await wijzigVraag(t, id, b.body))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isVraagId(id)) return clubFout(ONBEKEND, 404)
  return alsAntwoord(await verwijderVraag(t, id))
}
