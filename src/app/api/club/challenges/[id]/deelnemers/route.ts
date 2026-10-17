import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesLidId } from '@/lib/club/challenges/invoer'
import { schrijfIn, schrijfUit } from '@/lib/club/challenges/opslag'

// POST   /api/club/challenges/[id]/deelnemers  { lidId }  een lid schrijft zich in
// DELETE /api/club/challenges/[id]/deelnemers  { lidId }  een lid schrijft zich uit
// Alleen bij challenges met deelname 'inschrijven'. Lid en challenge worden tegen de sportschool gecontroleerd.

async function lees(req: NextRequest, params: Promise<{ id: string }>) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze challenge bestaat niet.', 404)
  const lid = leesLidId(await leesJson(req))
  if (!lid.ok) return clubFout(lid.fout, 400)
  return { t, id, lidId: lid.waarde }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const v = await lees(req, params)
  if (v instanceof NextResponse) return v
  return alsAntwoord(await schrijfIn(v.t, v.id, v.lidId))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const v = await lees(req, params)
  if (v instanceof NextResponse) return v
  return alsAntwoord(await schrijfUit(v.t, v.id, v.lidId))
}
