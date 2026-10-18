// POST /api/club/afspraken/app/[id]/annuleren { lidId }: het lid annuleert zelf,
// binnen de annuleerregel van het type. Daarna is het tijdslot weer vrij.
// Voorvertoning voor de beheerder; leden gebruiken /api/club/lid/afspraken/[id]/annuleren.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/afspraken/invoer'
import { leesJson } from '@/lib/club/afspraken/api'
import { lidVoorApp } from '@/lib/club/afspraken/app-api'
import { annuleerAfspraakVoorLid } from '@/lib/club/app/acties-afspraken'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Afspraak niet gevonden.', 404)
  const body = await leesJson(req)
  const lidId = typeof body === 'object' && body !== null && 'lidId' in body ? body.lidId : null
  const lid = await lidVoorApp(t, lidId)
  if (lid instanceof NextResponse) return lid
  return annuleerAfspraakVoorLid(t, lid, id)
}
