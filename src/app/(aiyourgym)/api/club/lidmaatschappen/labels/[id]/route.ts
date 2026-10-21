import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesLabel, leesTagsOok } from '@/lib/club/lidmaatschappen/invoer'
import { verwijderLabel, wijzigLabel } from '@/lib/club/lidmaatschappen/opslag'

// PATCH  /api/club/lidmaatschappen/labels/[id]  { naam, omschrijving, kleur }  een nieuwe naam gaat mee in de tags van alle leden
// DELETE /api/club/lidmaatschappen/labels/[id]  { tagsOok }  label weg, en desgewenst de tag bij alle leden

const WEG = 'Dit label bestaat niet.'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout(WEG, 404)
  const invoer = leesLabel(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigLabel(t, id, invoer.waarde))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout(WEG, 404)
  return alsAntwoord(await verwijderLabel(t, id, leesTagsOok(await leesJson(req))))
}
